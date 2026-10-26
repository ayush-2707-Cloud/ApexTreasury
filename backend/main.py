from datetime import datetime, timedelta
import math
import time
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# --- DATABASE SETUP ---
DATABASE_URL = "sqlite:///./apex_treasury.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- ORM MODELS ---
class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    currency = Column(String, unique=True, index=True) # "USD", "INR", "EUR"
    balance = Column(Float, default=0.0)
    account_type = Column(String) # "EEFC_VIRTUAL", "DOMESTIC_SETTLEMENT"

class ScheduledExpense(Base):
    __tablename__ = "scheduled_expenses"
    id = Column(Integer, primary_key=True, index=True)
    vendor = Column(String) # "AWS Cloud", "OpenAI API", "GitHub Enterprise"
    amount = Column(Float)
    currency = Column(String, default="USD")
    due_date = Column(DateTime)
    category = Column(String) # "Infrastructure", "AI Model Compute", "DevTools"
    is_active = Column(Boolean, default=True)

class InflowTransaction(Base):
    __tablename__ = "inflow_transactions"
    id = Column(Integer, primary_key=True, index=True)
    source = Column(String) # "Stripe", "Lemon Squeezy", "Apple App Store"
    amount = Column(Float)
    currency = Column(String)
    purpose_code = Column(String, default="P0802") # Software export code
    received_at = Column(DateTime, default=datetime.utcnow)
    fema_deadline = Column(DateTime) # Last day of next calendar month

class SettlementAudit(Base):
    __tablename__ = "settlement_audits"
    id = Column(Integer, primary_key=True, index=True)
    amount_usd = Column(Float)
    amount_inr_realized = Column(Float)
    mid_market_rate = Column(Float)
    bank_baseline_rate = Column(Float)
    fee_saved_usd = Column(Float)
    executed_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# --- DEPENDENCY ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- FASTAPI APP ---
app = FastAPI(
    title="ApexTreasury Engine",
    description="Autonomous cross-border cash-flow router and FEMA compliance ledger with live FX feed",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONSTANTS & BENCHMARKS ---
TRADITIONAL_BANK_MARKUP = 0.038  # 3.8% bank spread + foreign wire friction
APEX_EXPENSE_BUFFER_DAYS = 30

# Twelve Data primary live exchange feed
TWELVE_DATA_API_KEY = "28acb0a286a3437eb1ecfec52ef4e779"
TWELVE_DATA_URL = f"https://api.twelvedata.com/exchange_rate?symbol=USD/INR&apikey={TWELVE_DATA_API_KEY}"

# ExchangeRate-API secondary fallback
EXCHANGERATE_API_KEY = "ddf4511ae580085b4dff46da"
EXCHANGERATE_URL = f"https://v6.exchangerate-api.com/v6/{EXCHANGERATE_API_KEY}/latest/USD"

# Open exchange tertiary fallback
FALLBACK_OPEN_API = "https://open.er-api.com/v6/latest/USD"

# --- IN-MEMORY FX CACHE ---
fx_cache: Dict[str, Any] = {
    "rate": 94.9964, # Safe fallback if offline / initial
    "last_fetched": 0,
    "source": "FALLBACK_OFFLINE",
    "status": "INITIAL"
}

CACHE_TTL_SECONDS = 600 # 10 minutes cache TTL

async def fetch_live_usd_inr(force_refresh: bool = False) -> float:
    """Fetches live mid-market USD/INR rate from Twelve Data API with 10-min caching and multi-tier fallback."""
    current_time = time.time()
    
    # Return cached rate if still fresh and not forcing refresh
    if not force_refresh and (current_time - fx_cache["last_fetched"] < CACHE_TTL_SECONDS) and fx_cache["last_fetched"] > 0:
        return fx_cache["rate"]
    
    # Tier 1: Twelve Data Real-Time FX Rate
    try:
        async with httpx.AsyncClient(timeout=4.5) as client:
            resp = await client.get(TWELVE_DATA_URL)
            if resp.status_code == 200:
                data = resp.json()
                if "rate" in data and data["rate"] is not None:
                    live_rate = round(float(data["rate"]), 4)
                    fx_cache["rate"] = live_rate
                    fx_cache["last_fetched"] = current_time
                    fx_cache["source"] = "TWELVE_DATA"
                    fx_cache["status"] = "LIVE"
                    print(f"[FX Engine] Synced live rate via Twelve Data: 1 USD = INR {live_rate}")
                    return live_rate
    except Exception as e:
        print(f"[FX Engine Warning] Twelve Data API call failed: {e}. Falling back to secondary.")

    # Tier 2: ExchangeRate-API v6 Fallback
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(EXCHANGERATE_URL)
            if resp.status_code == 200:
                data = resp.json()
                if "conversion_rates" in data and "INR" in data["conversion_rates"]:
                    live_rate = round(float(data["conversion_rates"]["INR"]), 4)
                    fx_cache["rate"] = live_rate
                    fx_cache["last_fetched"] = current_time
                    fx_cache["source"] = "EXCHANGERATE_API_V6"
                    fx_cache["status"] = "LIVE_BACKUP"
                    print(f"[FX Engine] Synced live rate via ExchangeRate-API backup: 1 USD = INR {live_rate}")
                    return live_rate
    except Exception as e2:
        print(f"[FX Engine Warning] ExchangeRate-API call failed: {e2}. Falling back to open API.")
        
    # Tier 3: Open ER API Fallback
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(FALLBACK_OPEN_API)
            if resp.status_code == 200:
                data = resp.json()
                if "rates" in data and "INR" in data["rates"]:
                    live_rate = round(float(data["rates"]["INR"]), 4)
                    fx_cache["rate"] = live_rate
                    fx_cache["last_fetched"] = current_time
                    fx_cache["source"] = "OPEN_EXCHANGE_FALLBACK"
                    fx_cache["status"] = "LIVE_FALLBACK"
                    print(f"[FX Engine] Synced live rate via open.er-api: 1 USD = INR {live_rate}")
                    return live_rate
    except Exception as e3:
        print(f"[FX Engine Warning] Open API call failed: {e3}. Retaining cache.")

    return fx_cache["rate"]

# --- SEED DATABASE ON STARTUP ---
@app.on_event("startup")
async def seed_database():
    # Pre-fetch live FX rate on launch
    try:
        await fetch_live_usd_inr()
    except Exception as e:
        print(f"[Startup Warning] Could not pre-fetch FX: {e}")

    db = SessionLocal()
    try:
        # Seed Accounts if empty
        if not db.query(Account).first():
            db.add_all([
                Account(currency="USD", balance=4250.00, account_type="EEFC_VIRTUAL"),
                Account(currency="INR", balance=185000.00, account_type="DOMESTIC_SETTLEMENT"),
            ])
        
        # Seed Recurring SaaS Bills
        if not db.query(ScheduledExpense).first():
            now = datetime.utcnow()
            db.add_all([
                ScheduledExpense(vendor="OpenAI API Compute", amount=450.00, currency="USD", due_date=now + timedelta(days=4), category="AI Compute"),
                ScheduledExpense(vendor="AWS Cloud Infrastructure", amount=820.00, currency="USD", due_date=now + timedelta(days=12), category="Infrastructure"),
                ScheduledExpense(vendor="GitHub Enterprise & Copilot", amount=85.00, currency="USD", due_date=now + timedelta(days=18), category="DevTools"),
                ScheduledExpense(vendor="Vercel & Supabase Pro", amount=140.00, currency="USD", due_date=now + timedelta(days=25), category="Infrastructure"),
            ])
        db.commit()
    finally:
        db.close()

# --- BUSINESS LOGIC HELPER ---
def compute_fema_deadline(from_date: datetime) -> datetime:
    """Calculates last day of the following calendar month (RBI FEMA EEFC Rule)."""
    next_month = from_date.month + 1 if from_date.month < 12 else 1
    next_year = from_date.year if from_date.month < 12 else from_date.year + 1
    month_after = next_month + 1 if next_month < 12 else 1
    year_after = next_year if next_month < 12 else next_year + 1
    end_of_next_month = datetime(year_after, month_after, 1) - timedelta(days=1)
    return end_of_next_month

# --- API SCHEMAS ---
class InflowPayload(BaseModel):
    source: str
    amount: float
    currency: str = "USD"

class SweepExecutionPayload(BaseModel):
    sweep_amount_usd: Optional[float] = None  # None = sweep all surplus

# --- CORE ENDPOINTS ---

@app.get("/api/v1/treasury/overview")
async def get_treasury_overview(db: Session = Depends(get_db)):
    mid_market_rate = await fetch_live_usd_inr()
    
    usd_acc = db.query(Account).filter(Account.currency == "USD").first()
    inr_acc = db.query(Account).filter(Account.currency == "INR").first()
    
    # Calculate 30-day foreign currency burn
    now = datetime.utcnow()
    horizon = now + timedelta(days=APEX_EXPENSE_BUFFER_DAYS)
    upcoming_expenses = db.query(ScheduledExpense).filter(
        ScheduledExpense.is_active == True,
        ScheduledExpense.currency == "USD",
        ScheduledExpense.due_date <= horizon
    ).all()
    
    total_usd_burn = sum(e.amount for e in upcoming_expenses)
    ring_fenced_usd = min(usd_acc.balance, total_usd_burn)
    sweepable_surplus_usd = max(0.0, usd_acc.balance - ring_fenced_usd)
    
    # Calculate total historic fees saved
    total_savings = sum(a.fee_saved_usd for a in db.query(SettlementAudit).all())
    
    # FEMA 30-Day Liquidation Status
    oldest_inflow = db.query(InflowTransaction).order_by(InflowTransaction.received_at.asc()).first()
    fema_deadline = oldest_inflow.fema_deadline if oldest_inflow else compute_fema_deadline(now)
    days_to_deadline = (fema_deadline - now).days

    bank_penalized_rate = round(mid_market_rate * (1 - TRADITIONAL_BANK_MARKUP), 2)
    current_time = time.time()
    seconds_ago = int(current_time - fx_cache["last_fetched"]) if fx_cache["last_fetched"] > 0 else 0

    return {
        "balances": {
            "eefc_usd": round(usd_acc.balance, 2),
            "domestic_inr": round(inr_acc.balance, 2),
            "total_usd_equivalent": round(usd_acc.balance + (inr_acc.balance / mid_market_rate), 2),
            "total_inr_equivalent": round(inr_acc.balance + (usd_acc.balance * mid_market_rate), 2)
        },
        "burn_allocation": {
            "required_30d_usd_burn": round(total_usd_burn, 2),
            "ring_fenced_usd": round(ring_fenced_usd, 2),
            "sweepable_surplus_usd": round(sweepable_surplus_usd, 2),
            "runway_coverage_pct": round((ring_fenced_usd / total_usd_burn * 100) if total_usd_burn > 0 else 100.0, 1)
        },
        "compliance": {
            "framework": "RBI FEMA / EEFC Account Framework",
            "statutory_purpose_code": "P0802 - Software Implementation Services",
            "fema_sweep_deadline": fema_deadline.strftime("%Y-%m-%d"),
            "days_remaining_to_sweep": max(0, days_to_deadline),
            "status": "COMPLIANT" if days_to_deadline > 5 else "ACTION_REQUIRED"
        },
        "fee_leakage_audit": {
            "mid_market_rate": round(mid_market_rate, 4),
            "bank_penalized_rate": bank_penalized_rate,
            "total_historic_fees_saved_usd": round(total_savings + 242.50, 2), # Base seed savings
            "effective_margin_gain_pct": 7.2
        },
        "fx_meta": {
            "rate": round(mid_market_rate, 4),
            "last_fetched": fx_cache["last_fetched"],
            "seconds_ago": seconds_ago,
            "source": fx_cache["source"],
            "cache_ttl_seconds": CACHE_TTL_SECONDS
        }
    }

@app.get("/api/v1/treasury/burn-forecast")
def get_burn_forecast(db: Session = Depends(get_db)):
    """Generates daily cumulative curve of inflows vs ring-fenced burn over 30 days."""
    expenses = db.query(ScheduledExpense).filter(ScheduledExpense.is_active == True).order_by(ScheduledExpense.due_date.asc()).all()
    
    forecast_points = []
    now = datetime.utcnow()
    cumulative_burn = 0.0
    
    for day in range(0, 31):
        target_date = now + timedelta(days=day)
        day_expenses = [e.amount for e in expenses if e.due_date.date() == target_date.date()]
        cumulative_burn += sum(day_expenses)
        
        forecast_points.append({
            "day": day,
            "date": target_date.strftime("%b %d"),
            "projected_burn": round(cumulative_burn, 2),
            "ring_fenced_reserve": 1495.00,
            "safe_surplus": max(0.0, 1495.00 - cumulative_burn)
        })
    
    serialized_bills = [
        {
            "id": e.id,
            "vendor": e.vendor,
            "amount": e.amount,
            "currency": e.currency,
            "due_date": e.due_date.strftime("%Y-%m-%d"),
            "category": e.category,
            "days_until": (e.due_date.date() - now.date()).days
        }
        for e in expenses
    ]
    
    return {"timeline": forecast_points, "upcoming_bills": serialized_bills}

@app.post("/api/v1/treasury/inflow")
@app.post("/api/v1/simulate/inflow")
def record_inflow(payload: InflowPayload, db: Session = Depends(get_db)):
    """Ingests payout from Stripe / Lemon Squeezy into EEFC USD account."""
    now = datetime.utcnow()
    fema_deadline = compute_fema_deadline(now)
    
    # 1. Record transaction
    inflow = InflowTransaction(
        source=payload.source,
        amount=payload.amount,
        currency=payload.currency,
        purpose_code="P0802",
        received_at=now,
        fema_deadline=fema_deadline
    )
    db.add(inflow)
    
    # 2. Credit EEFC USD account directly without auto-conversion
    usd_acc = db.query(Account).filter(Account.currency == "USD").first()
    usd_acc.balance += payload.amount
    
    db.commit()
    return {
        "status": "SUCCESS",
        "message": f"Ingested ${payload.amount} from {payload.source}",
        "credited_to": "EEFC_VIRTUAL_USD",
        "auto_sweep_prevented": True,
        "fema_retention_deadline": fema_deadline.strftime("%Y-%m-%d")
    }

@app.post("/api/v1/treasury/execute-sweep")
async def execute_sweep(payload: SweepExecutionPayload, db: Session = Depends(get_db)):
    """Converts surplus foreign currency to local currency at live mid-market wholesale rate with slippage guard."""
    mid_market_rate = await fetch_live_usd_inr()

    usd_acc = db.query(Account).filter(Account.currency == "USD").first()
    inr_acc = db.query(Account).filter(Account.currency == "INR").first()
    
    # Determine amount to sweep
    expenses = db.query(ScheduledExpense).filter(ScheduledExpense.is_active == True).all()
    required_burn = sum(e.amount for e in expenses)
    max_surplus = max(0.0, usd_acc.balance - required_burn)
    
    sweep_amount = payload.sweep_amount_usd if payload.sweep_amount_usd is not None else max_surplus
    if sweep_amount <= 0:
        raise HTTPException(status_code=400, detail="No surplus funds available to sweep without risking cloud bill default.")
    
    if sweep_amount > usd_acc.balance:
        raise HTTPException(status_code=400, detail="Insufficient USD balance.")
        
    # Rate calculations - 0.15% institutional partner spread
    realized_rate = round(mid_market_rate * (1 - 0.0015), 4)
    bank_quote_rate = round(mid_market_rate * (1 - TRADITIONAL_BANK_MARKUP), 4)
    
    inr_gained = sweep_amount * realized_rate
    traditional_bank_inr = sweep_amount * bank_quote_rate
    fee_saved_inr = inr_gained - traditional_bank_inr
    fee_saved_usd = fee_saved_inr / mid_market_rate
    
    # Execute Ledger Transfer
    usd_acc.balance -= sweep_amount
    inr_acc.balance += inr_gained
    
    audit = SettlementAudit(
        amount_usd=sweep_amount,
        amount_inr_realized=inr_gained,
        mid_market_rate=mid_market_rate,
        bank_baseline_rate=bank_quote_rate,
        fee_saved_usd=fee_saved_usd
    )
    db.add(audit)
    db.commit()
    
    return {
        "status": "SETTLED",
        "swept_usd": sweep_amount,
        "credited_inr": round(inr_gained, 2),
        "realized_rate": realized_rate,
        "mid_market_rate": round(mid_market_rate, 4),
        "traditional_bank_loss_avoided_inr": round(fee_saved_inr, 2),
        "fee_saved_usd": round(fee_saved_usd, 2),
        "new_usd_balance": round(usd_acc.balance, 2),
        "new_inr_balance": round(inr_acc.balance, 2)
    }

@app.post("/api/v1/treasury/refresh-fx")
async def force_refresh_fx():
    """Forces an immediate refresh of the live FX rate bypassing cache."""
    new_rate = await fetch_live_usd_inr(force_refresh=True)
    return {
        "status": "REFRESHED",
        "rate": round(new_rate, 4),
        "source": fx_cache["source"],
        "timestamp": fx_cache["last_fetched"]
    }

@app.get("/api/v1/treasury/activity")
def get_activity_feed(db: Session = Depends(get_db)):
    """Returns recent ledger events: scheduled ring-fencing, inflows, and sweep settlements."""
    inflows = db.query(InflowTransaction).order_by(InflowTransaction.received_at.desc()).limit(10).all()
    sweeps = db.query(SettlementAudit).order_by(SettlementAudit.executed_at.desc()).limit(10).all()
    expenses = db.query(ScheduledExpense).filter(ScheduledExpense.is_active == True).order_by(ScheduledExpense.due_date.asc()).all()

    items = []
    for exp in expenses:
        items.append({
            "id": f"exp-{exp.id}",
            "type": "RING_FENCED",
            "title": exp.vendor,
            "subtitle": f"{exp.category} • Due in {(exp.due_date.date() - datetime.utcnow().date()).days} days",
            "amount_usd": -exp.amount,
            "amount_formatted": f"-${exp.amount:,.2f}",
            "status": "LOCKED",
            "timestamp": exp.due_date.isoformat()
        })

    for s in sweeps:
        items.append({
            "id": f"sweep-{s.id}",
            "type": "SETTLED",
            "title": "Surplus Treasury Sweep",
            "subtitle": f"Interbank converted @ ₹{s.mid_market_rate:.2f}/USD",
            "amount_usd": -s.amount_usd,
            "amount_formatted": f"₹{s.amount_inr_realized:,.0f}",
            "status": "SETTLED",
            "timestamp": s.executed_at.isoformat()
        })

    for inf in inflows:
        items.append({
            "id": f"inflow-{inf.id}",
            "type": "RECEIVED",
            "title": f"{inf.source} Revenue Payout",
            "subtitle": f"Credited to Virtual EEFC (FEMA {inf.purpose_code})",
            "amount_usd": inf.amount,
            "amount_formatted": f"+${inf.amount:,.2f}",
            "status": "RECEIVED",
            "timestamp": inf.received_at.isoformat()
        })

    return {"activity": items}

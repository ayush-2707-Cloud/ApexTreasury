import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { sampleGlyph, generateEarthGlobe, PARTICLE_COUNT } from './particleSampler';

// Two-tone banking emerald shader: rich emerald front, translucent mint back
const vertexShader = `
  uniform float uProgress;
  uniform float uTime;
  attribute vec3 aTarget;
  varying float vDepth;

  void main() {
    vec3 mixedPos = mix(position, aTarget, smoothstep(0.0, 1.0, uProgress));
    
    // Living Brownian micro-shimmer
    mixedPos.x += sin(uTime * 1.8 + mixedPos.y * 3.2) * 0.008;
    mixedPos.y += cos(uTime * 1.8 + mixedPos.x * 3.2) * 0.008;

    vec4 mvPosition = modelViewMatrix * vec4(mixedPos, 1.0);
    vec4 centerPos = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    
    vDepth = mvPosition.z - centerPos.z;
    gl_PointSize = (22.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vDepth;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.32, dist);

    // Front: Crisp banking emerald (#059669 / #10B981)
    vec3 frontEmerald = vec3(0.02, 0.65, 0.44); 
    // Back: Soft translucent mint (#6EE7B7) for spherical 3D depth
    vec3 backMint = vec3(0.43, 0.90, 0.72);

    float depthFactor = smoothstep(-0.9, 0.5, vDepth);
    vec3 finalColor = mix(backMint, frontEmerald, depthFactor);
    float finalAlpha = mix(0.18, 0.96, depthFactor);

    gl_FragColor = vec4(finalColor, alpha * finalAlpha);
  }
`;

interface CardRefs {
  l1: React.RefObject<HTMLDivElement | null>;
  l2: React.RefObject<HTMLDivElement | null>;
  r1: React.RefObject<HTMLDivElement | null>;
  r2: React.RefObject<HTMLDivElement | null>;
  r3: React.RefObject<HTMLDivElement | null>;
  numL1: React.RefObject<HTMLSpanElement | null>;
  numL2: React.RefObject<HTMLSpanElement | null>;
  numR1: React.RefObject<HTMLSpanElement | null>;
  numR2: React.RefObject<HTMLSpanElement | null>;
  numR3: React.RefObject<HTMLSpanElement | null>;
}

function WebGLScene({ cards }: { cards: CardRefs }) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const spinState = useRef({
    speed: 0.18,
    targetSpeed: 0.18,
  });

  const datasets = useMemo(() => ({
    inr: sampleGlyph('₹'),
    usd: sampleGlyph('$'),
    eur: sampleGlyph('€'),
    gbp: sampleGlyph('£'),
    earth: generateEarthGlobe(PARTICLE_COUNT, 1.65),
  }), []);

  const uniforms = useMemo(() => ({
    uProgress: { value: 0.0 },
    uTime: { value: 0.0 },
  }), []);

  useEffect(() => {
    if (!pointsRef.current || !materialRef.current) return;

    const geo = pointsRef.current.geometry;
    const mat = materialRef.current;
    const tl = gsap.timeline({ repeat: -1 });

    const cardElements = [
      cards.l1.current,
      cards.r1.current,
      cards.r2.current,
      cards.l2.current,
      cards.r3.current,
    ].filter(Boolean);

    // Hide cards initially
    gsap.set(cardElements, { opacity: 0, scale: 0.9, y: 14, pointerEvents: 'none' });

    // Numeric counter proxy targets
    const countL1 = { val: 0 };
    const countR1 = { val: 0 };
    const countR2 = { val: 0 };
    const countL2 = { val: 0 };
    const countR3 = { val: 1000 };

    const resetNumbers = () => {
      countL1.val = 0;
      countR1.val = 0;
      countR2.val = 0;
      countL2.val = 0;
      countR3.val = 1000;
      if (cards.numL1.current) cards.numL1.current.textContent = "+$0.00 USD";
      if (cards.numR1.current) cards.numR1.current.textContent = "$0.00 USD";
      if (cards.numR2.current) cards.numR2.current.textContent = "₹0.00";
      if (cards.numL2.current) cards.numL2.current.textContent = "+₹0.00";
      if (cards.numR3.current) cards.numR3.current.textContent = "#2026-1000";
    };

    resetNumbers();

    const morph = (source: Float32Array, target: Float32Array, duration: number, ease = "power2.inOut") => {
      tl.call(() => {
        (geo.attributes.position as THREE.BufferAttribute).copyArray(source);
        geo.attributes.position.needsUpdate = true;
        (geo.attributes.aTarget as THREE.BufferAttribute).copyArray(target);
        geo.attributes.aTarget.needsUpdate = true;
        mat.uniforms.uProgress.value = 0.0;
      });
      tl.to(mat.uniforms.uProgress, { value: 1.0, duration, ease });
    };

    // 1. ROTATING RUPEE HOLD (4.0s)
    tl.call(() => {
      spinState.current.targetSpeed = 0.18;
    });
    morph(datasets.inr, datasets.inr, 0.01);
    tl.to({}, { duration: 4.0 });

    // 2. DELIBERATE CURRENCY MIGRATION (2.2s)
    tl.call(() => {
      spinState.current.targetSpeed = 0.22;
    });
    morph(datasets.inr, datasets.usd, 0.8, "power2.inOut");
    tl.to({}, { duration: 0.4 });
    morph(datasets.usd, datasets.eur, 0.7, "power2.inOut");
    tl.to({}, { duration: 0.35 });
    morph(datasets.eur, datasets.gbp, 0.7, "power2.inOut");
    tl.to({}, { duration: 0.35 });

    // 3. CENTRIFUGE VORTEX (0.6s)
    tl.call(() => {
      spinState.current.targetSpeed = 1.1;
    });
    morph(datasets.gbp, datasets.inr, 0.28, "power1.in");
    morph(datasets.inr, datasets.usd, 0.18, "none");
    morph(datasets.usd, datasets.eur, 0.14, "none");

    // 4. EARTH GLOBE RESOLUTION (10.0s ROTATION CYCLE)
    tl.call(() => {
      spinState.current.targetSpeed = 0.24;
      resetNumbers();
    });
    morph(datasets.eur, datasets.earth, 1.4, "power3.out");

    // --- SEQUENTIAL CARD ENTRANCES WITH SLOT MACHINE ROLL (0.75s Interval) ---
    // Card 1: Left 1 (Inward Wire)
    tl.to(cards.l1.current, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.5,
      ease: 'back.out(1.35)',
      pointerEvents: 'auto',
    }, "-=0.2");
    tl.to(countL1, {
      val: 4850,
      duration: 1.1,
      ease: 'power3.out',
      onUpdate: () => {
        if (cards.numL1.current) {
          cards.numL1.current.textContent = `+$${countL1.val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
        }
      },
    }, "<");

    tl.to({}, { duration: 0.25 }); // 0.75s total interval before next card

    // Card 2: Right 1 (EEFC Buffer)
    tl.to(cards.r1.current, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.5,
      ease: 'back.out(1.35)',
      pointerEvents: 'auto',
    });
    tl.to(countR1, {
      val: 1495,
      duration: 1.1,
      ease: 'power3.out',
      onUpdate: () => {
        if (cards.numR1.current) {
          cards.numR1.current.textContent = `$${countR1.val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
        }
      },
    }, "<");

    tl.to({}, { duration: 0.25 });

    // Card 3: Right 2 (Domestic Clearing)
    tl.to(cards.r2.current, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.5,
      ease: 'back.out(1.35)',
      pointerEvents: 'auto',
    });
    tl.to(countR2, {
      val: 408500,
      duration: 1.3,
      ease: 'power3.out',
      onUpdate: () => {
        if (cards.numR2.current) {
          cards.numR2.current.textContent = `₹${Math.round(countR2.val).toLocaleString('en-IN')}.00`;
        }
      },
    }, "<");

    tl.to({}, { duration: 0.25 });

    // Card 4: Left 2 (FX Spread Alpha)
    tl.to(cards.l2.current, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.5,
      ease: 'back.out(1.35)',
      pointerEvents: 'auto',
    });
    tl.to(countL2, {
      val: 32560,
      duration: 1.2,
      ease: 'power3.out',
      onUpdate: () => {
        if (cards.numL2.current) {
          cards.numL2.current.textContent = `+₹${Math.round(countL2.val).toLocaleString('en-IN')}.00`;
        }
      },
    }, "<");

    tl.to({}, { duration: 0.25 });

    // Card 5: Right 3 (Compliance Vault)
    tl.to(cards.r3.current, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.5,
      ease: 'back.out(1.35)',
      pointerEvents: 'auto',
    });
    tl.to(countR3, {
      val: 8812,
      duration: 1.1,
      ease: 'power3.out',
      onUpdate: () => {
        if (cards.numR3.current) {
          cards.numR3.current.textContent = `#2026-${Math.round(countR3.val)}`;
        }
      },
    }, "<");

    // Earth holds full rotation with all completed numbers visible
    tl.to({}, { duration: 3.8 });

    // 5. CARDS DISSOLVE BEFORE COLLAPSE
    tl.to(cardElements, {
      opacity: 0,
      scale: 0.92,
      y: -10,
      duration: 0.4,
      ease: 'power2.in',
      pointerEvents: 'none',
    });

    // Seamless reverse morph directly back to Rupee
    tl.call(() => {
      spinState.current.targetSpeed = 0.18;
    });
    morph(datasets.earth, datasets.inr, 1.4, "power3.inOut");

    return () => {
      tl.kill();
    };
  }, [datasets, cards]);

  useFrame((_state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
    if (groupRef.current) {
      const spin = spinState.current;
      spin.speed = THREE.MathUtils.lerp(spin.speed, spin.targetSpeed, 0.06);
      groupRef.current.rotation.y += spin.speed * delta * 4.0;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.16, 0.04);
    }
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[datasets.inr.slice(), 3]} />
          <bufferAttribute attach="attributes-aTarget" args={[datasets.inr.slice(), 3]} />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export default function CurrencyGlobeHero() {
  const l1Ref = useRef<HTMLDivElement>(null);
  const l2Ref = useRef<HTMLDivElement>(null);
  const r1Ref = useRef<HTMLDivElement>(null);
  const r2Ref = useRef<HTMLDivElement>(null);
  const r3Ref = useRef<HTMLDivElement>(null);

  const numL1Ref = useRef<HTMLSpanElement>(null);
  const numL2Ref = useRef<HTMLSpanElement>(null);
  const numR1Ref = useRef<HTMLSpanElement>(null);
  const numR2Ref = useRef<HTMLSpanElement>(null);
  const numR3Ref = useRef<HTMLSpanElement>(null);

  const cardRefs = useMemo(() => ({
    l1: l1Ref,
    l2: l2Ref,
    r1: r1Ref,
    r2: r2Ref,
    r3: r3Ref,
    numL1: numL1Ref,
    numL2: numL2Ref,
    numR1: numR1Ref,
    numR2: numR2Ref,
    numR3: numR3Ref,
  }), []);

  return (
    <div className="relative w-full max-w-7xl mx-auto h-[600px] lg:h-[700px] flex items-center justify-center px-4 overflow-visible">
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full pointer-events-none"
      >
        <WebGLScene cards={cardRefs} />
      </Canvas>

      {/* ========================================================
          LEFT HEMISPHERE CARDS
          ======================================================== */}
      {/* Left 1: Upper Hemisphere */}
      <div
        ref={l1Ref}
        style={{ opacity: 0 }}
        className="absolute top-[16%] left-2 md:left-4 lg:left-8 z-20 w-[295px] lg:w-[320px] bg-white/95 backdrop-blur-2xl border border-slate-900/[0.08] rounded-2xl p-4 lg:p-5 shadow-[0_18px_38px_-4px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.95)] select-none text-left"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-2 font-semibold tracking-wide text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            US &rarr; IN CORRIDOR
          </span>
          <span className="font-medium text-slate-400">184ms</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Inward Wire</span>
            <span
              ref={numL1Ref}
              className="text-lg lg:text-xl font-extrabold text-slate-950 font-mono tracking-tight tabular-nums"
            >
              +$0.00 USD
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 bg-emerald-50/90 border border-emerald-200/70 px-2 py-0.5 rounded-md font-mono font-semibold">
            Zero Deduct
          </span>
        </div>
      </div>

      {/* Left 2: Southern Hemisphere */}
      <div
        ref={l2Ref}
        style={{ opacity: 0 }}
        className="absolute bottom-[16%] left-2 md:left-4 lg:left-8 z-20 w-[295px] lg:w-[320px] bg-white/95 backdrop-blur-2xl border border-slate-900/[0.08] rounded-2xl p-4 lg:p-5 shadow-[0_18px_38px_-4px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.95)] select-none text-left"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs font-mono text-slate-500">
          <span className="font-bold tracking-wide text-slate-800 uppercase">FX Spread Alpha</span>
          <span className="text-emerald-700 font-semibold bg-emerald-50/80 px-1.5 py-0.5 rounded font-mono">0.00% SPREAD</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between font-mono">
          <div>
            <span className="text-xs text-slate-500 font-sans font-medium block">Retained Yield</span>
            <span
              ref={numL2Ref}
              className="text-lg lg:text-xl font-extrabold text-slate-950 tracking-tight tabular-nums"
            >
              +₹0.00
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-sans font-medium">vs 3.8% Bank</span>
        </div>
      </div>

      {/* ========================================================
          RIGHT HEMISPHERE CARDS
          ======================================================== */}
      {/* Right 1: Above Equator */}
      <div
        ref={r1Ref}
        style={{ opacity: 0 }}
        className="absolute top-[16%] right-2 md:right-4 lg:right-8 z-20 w-[295px] lg:w-[320px] bg-white/95 backdrop-blur-2xl border border-slate-900/[0.08] rounded-2xl p-4 lg:p-5 shadow-[0_18px_38px_-4px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.95)] select-none text-left"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs font-mono text-slate-500">
          <span className="font-bold tracking-wide text-slate-800 uppercase">EEFC Buffer Lock</span>
          <span className="text-emerald-700 font-semibold bg-emerald-50/80 px-1.5 py-0.5 rounded font-mono">P0802</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Infra Opex Shield</span>
            <span
              ref={numR1Ref}
              className="text-lg lg:text-xl font-extrabold text-slate-950 font-mono tracking-tight tabular-nums"
            >
              $0.00 USD
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono font-medium">AWS / OpenAI</span>
        </div>
      </div>

      {/* Right 2: Exactly in Line with Equator */}
      <div
        ref={r2Ref}
        style={{ opacity: 0 }}
        className="absolute top-1/2 -translate-y-1/2 right-2 md:right-4 lg:right-8 z-20 w-[295px] lg:w-[320px] bg-white/95 backdrop-blur-2xl border border-slate-900/[0.08] rounded-2xl p-4 lg:p-5 shadow-[0_18px_38px_-4px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.95)] select-none text-left"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-2 font-bold tracking-wide text-slate-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            DOMESTIC CLEARING
          </span>
          <span className="text-emerald-700 font-bold bg-emerald-50/80 px-1.5 py-0.5 rounded font-mono">T+0</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between font-mono">
          <div>
            <span className="text-xs text-slate-500 font-sans font-medium block">Total Net Inflow</span>
            <span
              ref={numR2Ref}
              className="text-lg lg:text-xl font-extrabold text-slate-950 tracking-tight tabular-nums"
            >
              ₹0.00
            </span>
          </div>
          <span className="text-xs text-emerald-700 font-semibold font-sans">Book Credit</span>
        </div>
      </div>

      {/* Right 3: Below Equator */}
      <div
        ref={r3Ref}
        style={{ opacity: 0 }}
        className="absolute bottom-[16%] right-2 md:right-4 lg:right-8 z-20 w-[295px] lg:w-[320px] bg-white/95 backdrop-blur-2xl border border-slate-900/[0.08] rounded-2xl p-4 lg:p-5 shadow-[0_18px_38px_-4px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.95)] select-none text-left"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs font-mono text-slate-500">
          <span className="font-bold tracking-wide text-slate-800 uppercase">Compliance Vault</span>
          <span className="text-emerald-700 font-semibold bg-emerald-50/80 px-1.5 py-0.5 rounded font-mono">e-BRC</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">FIRA Generated</span>
            <span
              ref={numR3Ref}
              className="text-lg lg:text-xl font-extrabold text-slate-950 font-mono tracking-tight tabular-nums"
            >
              #2026-1000
            </span>
          </div>
          <span className="text-[11px] text-emerald-800 bg-emerald-50/80 border border-emerald-200/60 px-1.5 py-0.5 rounded font-mono font-semibold">
            0% GST Claim
          </span>
        </div>
      </div>
    </div>
  );
}

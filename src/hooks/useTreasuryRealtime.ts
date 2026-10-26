import { useState, useEffect, useRef } from 'react';
import { supabase, type LiveSettlementRecord } from '../lib/supabase';

export interface UseTreasuryRealtimeResult {
  isConnected: boolean;
  connectionState: 'connected' | 'connecting' | 'fallback';
  latestSettlement: LiveSettlementRecord | null;
  settlements: LiveSettlementRecord[];
}

export function useTreasuryRealtime(): UseTreasuryRealtimeResult {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connected' | 'connecting' | 'fallback'>('connecting');
  const [latestSettlement, setLatestSettlement] = useState<LiveSettlementRecord | null>(null);
  const [settlements, setSettlements] = useState<LiveSettlementRecord[]>([]);

  // Timeout guard for fallback if connection takes more than 5s
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fallbackTimeoutRef.current = setTimeout(() => {
      setConnectionState((prev) => (prev === 'connected' ? 'connected' : 'fallback'));
    }, 5000);

    const channel = supabase
      .channel('public:settlements')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'settlements' },
        (payload) => {
          if (payload.new) {
            const newRecord = payload.new as LiveSettlementRecord;
            setLatestSettlement(newRecord);
            setSettlements((prev) => [newRecord, ...prev.slice(0, 19)]);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionState('connected');
          if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
          setConnectionState('fallback');
        } else {
          setIsConnected(false);
          setConnectionState('connecting');
        }
      });

    return () => {
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    isConnected,
    connectionState,
    latestSettlement,
    settlements,
  };
}

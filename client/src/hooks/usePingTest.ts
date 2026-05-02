import { useState, useCallback, useRef } from 'react';
import type { PingTestResponse } from '@pingtest/shared';
import { runPingTest } from '../api/client';

export type PingTestState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'success'; data: PingTestResponse }
  | { phase: 'error'; message: string };

export function usePingTest() {
  const [state, setState] = useState<PingTestState>({ phase: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  const startTest = useCallback(async (target: string, count?: number) => {
    // Abort previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ phase: 'loading' });

    try {
      const data = await runPingTest({ target, count: count ?? 4 });
      if (controller.signal.aborted) return;
      setState({ phase: 'success', data });
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED') return;
      const message = err?.response?.data?.error || err?.message || 'Ping test failed';
      setState({ phase: 'error', message });
    }
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setState({ phase: 'idle' });
  }, []);

  return { state, startTest, reset };
}

import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import { createRunStream } from '@airaie/shared';
import type { RunEvent } from '@airaie/shared';
import * as agentsApi from '@api/agents';

export function useRunAgent() {
  return useMutation({
    mutationFn: ({
      agentId,
      version,
      inputs,
      dryRun,
    }: {
      agentId: string;
      version: number;
      inputs: Record<string, unknown>;
      dryRun?: boolean;
    }) => agentsApi.runAgent(agentId, version, { inputs, dry_run: dryRun }),
  });
}

export function useRunStream(runId: string | null, onEvent?: (event: RunEvent) => void) {
  const cleanupRef = useRef<(() => void) | null>(null);

  const handleEvent = useCallback(
    (event: RunEvent) => {
      onEvent?.(event);
    },
    [onEvent]
  );

  useEffect(() => {
    if (!runId) return;
    cleanupRef.current = createRunStream(runId, handleEvent);
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [runId, handleEvent]);
}

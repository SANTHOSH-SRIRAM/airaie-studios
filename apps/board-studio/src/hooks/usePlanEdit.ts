// ============================================================
// usePlanEdit — Hook for plan editing mutations (param tweaks + tool swaps)
// ============================================================

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editPlan, compilePlan, validatePlan } from '@api/plans';
import type { PlanResponse } from '@api/plans';

export interface StepChanges {
  parameters?: Record<string, unknown>;
  tool_id?: string;
  tool_version?: string;
}

export interface UsePlanEditReturn {
  editStep: (stepId: string, changes: StepChanges) => void;
  recompile: () => void;
  isEditing: boolean;
  planModified: boolean;
  isRecompiling: boolean;
}

export function usePlanEdit(cardId: string): UsePlanEditReturn {
  const queryClient = useQueryClient();
  const [planModified, setPlanModified] = useState(false);

  const editMutation = useMutation<PlanResponse, Error, { stepId: string; changes: StepChanges }>({
    mutationFn: ({ stepId, changes }) =>
      editPlan(cardId, { step_id: stepId, ...changes }),
    onSuccess: () => {
      setPlanModified(true);
      queryClient.invalidateQueries({ queryKey: ['plan', cardId] });
    },
  });

  const recompileMutation = useMutation<PlanResponse, Error, void>({
    mutationFn: async () => {
      const compiled = await compilePlan(cardId);
      const validated = await validatePlan(cardId);
      return validated;
    },
    onSuccess: () => {
      setPlanModified(false);
      queryClient.invalidateQueries({ queryKey: ['plan', cardId] });
    },
  });

  const editStep = useCallback(
    (stepId: string, changes: StepChanges) => {
      editMutation.mutate({ stepId, changes });
    },
    [editMutation]
  );

  const recompile = useCallback(() => {
    recompileMutation.mutate();
  }, [recompileMutation]);

  return {
    editStep,
    recompile,
    isEditing: editMutation.isPending,
    planModified,
    isRecompiling: recompileMutation.isPending,
  };
}

/**
 * Validates agent run response structure and reports missing fields
 * that frontend components silently default to zero/empty.
 */
export interface ValidationResult {
  valid: boolean;
  warnings: string[];
}

export function validateAgentRunResponse(
  res: Record<string, unknown>,
): ValidationResult {
  const warnings: string[] = [];
  const outputs = res.outputs as Record<string, unknown> | undefined;

  if (!outputs) {
    warnings.push('Response missing outputs field');
  } else {
    if (!outputs.proposal && !outputs.score) {
      warnings.push('No proposal or score in outputs');
    }
    if (!outputs.policy_decision) {
      warnings.push('No policy_decision in outputs');
    }
  }

  if (!res.cost_actual && !res.cost_estimate) {
    warnings.push('No cost data in response');
  }

  return { valid: warnings.length === 0, warnings };
}

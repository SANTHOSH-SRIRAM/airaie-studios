// ============================================================
// Preflight check name to fix suggestion mapping
// ============================================================

export interface FixSuggestion {
  suggestion: string;
  inputField?: string;
  inputLabel?: string;
}

/**
 * Mapping from preflight check_name patterns to actionable fix suggestions.
 * When a check has an inputField, the UI can offer a "Go to Inputs" link.
 */
export const preflightFixMap: Record<string, FixSuggestion> = {
  geometry_file_check: {
    suggestion: 'Upload a geometry file (STL, STEP, IGES)',
    inputField: 'geometry',
    inputLabel: 'Geometry',
  },
  mesh_quality_check: {
    suggestion: 'Improve mesh quality or upload a refined mesh',
    inputField: 'mesh',
    inputLabel: 'Mesh',
  },
  material_check: {
    suggestion: 'Select a material from the material library',
    inputField: 'material',
    inputLabel: 'Material',
  },
  boundary_condition_check: {
    suggestion: 'Define boundary conditions for the simulation',
    inputField: 'boundary_conditions',
    inputLabel: 'Boundary Conditions',
  },
  solver_config_check: {
    suggestion: 'Configure solver parameters',
    inputField: 'solver',
    inputLabel: 'Solver',
  },
  license_check: {
    suggestion: 'Tool requires a valid license. Contact your administrator.',
    inputField: undefined,
    inputLabel: undefined,
  },
  resource_check: {
    suggestion: 'Insufficient compute resources. Request additional quota.',
    inputField: undefined,
    inputLabel: undefined,
  },
};

/**
 * Look up a fix suggestion for a preflight check_name.
 * Tries exact match first, then pattern match (check_name contains the
 * map key stem without the trailing '_check'). Returns null if no match.
 */
export function getFixSuggestion(checkName: string): FixSuggestion | null {
  // Exact match
  if (preflightFixMap[checkName]) {
    return preflightFixMap[checkName];
  }

  // Pattern match: iterate keys, strip '_check' suffix, check inclusion
  for (const key of Object.keys(preflightFixMap)) {
    const stem = key.replace('_check', '');
    if (checkName.includes(stem)) {
      return preflightFixMap[key];
    }
  }

  return null;
}

// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PreflightReport from '../studio/PreflightReport';
import { getFixSuggestion } from '@/constants/preflightFixMap';
import type { PreflightResult } from '@/types/execution';

// --- Helper to build mock PreflightResult ---

function makeResult(overrides: Partial<PreflightResult> = {}): PreflightResult {
  return {
    passed: false,
    checks: [],
    blockers: [],
    warnings: [],
    total_ms: 42,
    run_at: '2026-03-21T00:00:00Z',
    ...overrides,
  };
}

describe('PreflightReport fix suggestions', () => {
  it('renders fix suggestion text for a blocker with a known check_name', () => {
    const result = makeResult({
      blockers: [
        { check_name: 'geometry_file_check', message: 'No geometry file found' },
      ],
    });
    render(<PreflightReport result={result} />);
    expect(screen.getByText(/Upload a geometry file/)).toBeInTheDocument();
  });

  it('shows "Go to Inputs" link button for checks with input field mapping', () => {
    const result = makeResult({
      blockers: [
        { check_name: 'geometry_file_check', message: 'No geometry file found' },
      ],
    });
    const onNavigateToInput = vi.fn();
    render(<PreflightReport result={result} onNavigateToInput={onNavigateToInput} />);
    expect(screen.getByText(/Go to Inputs/)).toBeInTheDocument();
    expect(screen.getByText(/Geometry/)).toBeInTheDocument();
  });

  it('clicking "Go to Inputs" link calls onNavigateToInput with the correct field key', () => {
    const result = makeResult({
      blockers: [
        { check_name: 'geometry_file_check', message: 'No geometry file found' },
      ],
    });
    const onNavigateToInput = vi.fn();
    render(<PreflightReport result={result} onNavigateToInput={onNavigateToInput} />);
    const link = screen.getByText(/Go to Inputs/);
    fireEvent.click(link);
    expect(onNavigateToInput).toHaveBeenCalledWith('geometry');
  });

  it('blockers without a fix mapping still render normally (no suggestion, no crash)', () => {
    const result = makeResult({
      blockers: [
        { check_name: 'unknown_check', message: 'Something unknown failed' },
      ],
    });
    render(<PreflightReport result={result} />);
    expect(screen.getByText('unknown_check')).toBeInTheDocument();
    expect(screen.getByText('Something unknown failed')).toBeInTheDocument();
    expect(screen.queryByText(/Go to Inputs/)).not.toBeInTheDocument();
  });

  it('warnings with suggestions show both the existing suggestion text AND the fix navigation link if mapped', () => {
    const result = makeResult({
      warnings: [
        {
          check_name: 'mesh_quality_check',
          message: 'Mesh quality below threshold',
          suggestion: 'Consider refining the mesh',
        },
      ],
    });
    const onNavigateToInput = vi.fn();
    render(<PreflightReport result={result} onNavigateToInput={onNavigateToInput} />);
    // Original suggestion text
    expect(screen.getByText(/Consider refining the mesh/)).toBeInTheDocument();
    // Fix suggestion link with inputLabel
    const goToInputsLink = screen.getByText(/Go to Inputs/);
    expect(goToInputsLink).toBeInTheDocument();
    expect(goToInputsLink.textContent).toContain('Mesh');
  });
});

describe('getFixSuggestion', () => {
  it('returns a suggestion for exact match', () => {
    const fix = getFixSuggestion('geometry_file_check');
    expect(fix).not.toBeNull();
    expect(fix!.suggestion).toMatch(/geometry file/i);
    expect(fix!.inputField).toBe('geometry');
  });

  it('returns a suggestion via pattern match', () => {
    // 'geometry_file_validation' should match 'geometry_file' pattern
    const fix = getFixSuggestion('geometry_file_validation');
    expect(fix).not.toBeNull();
    expect(fix!.inputField).toBe('geometry');
  });

  it('returns null for unknown check names (graceful degradation)', () => {
    const fix = getFixSuggestion('completely_unknown_check_xyz');
    expect(fix).toBeNull();
  });

  it('returns suggestion without inputField for license_check', () => {
    const fix = getFixSuggestion('license_check');
    expect(fix).not.toBeNull();
    expect(fix!.inputField).toBeUndefined();
  });
});

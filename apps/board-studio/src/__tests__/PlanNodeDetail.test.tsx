// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import type { PlanStep } from '@/types/board';

// Mock @airaie/ui
vi.mock('@airaie/ui', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
  Button: ({ children, onClick, disabled, variant, size, loading, ...rest }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size} {...rest}>
      {loading ? 'Loading...' : children}
    </button>
  ),
  Spinner: () => <div data-testid="spinner" />,
}));

// --- Fixtures ---

const mockStep: PlanStep = {
  id: 'step-1',
  tool_name: 'mesh-generator',
  tool_version: '1.0.0',
  role: 'preprocess',
  status: 'pending',
  parameters: { mesh_size: 1000, tolerance: 0.05 },
  parameter_schema: {
    properties: {
      mesh_size: { type: 'number', minimum: 100, maximum: 5000 },
      tolerance: { type: 'number', minimum: 0.001, maximum: 1.0 },
    },
  },
  depends_on: [],
};

const mockRunningStep: PlanStep = {
  id: 'step-2',
  tool_name: 'fea-solver',
  tool_version: '2.1.0',
  role: 'solve',
  status: 'running',
  parameters: { solver_type: 'direct', iterations: 500 },
  parameter_schema: {
    properties: {
      iterations: { type: 'number', minimum: 1, maximum: 10000 },
    },
  },
  depends_on: ['step-1'],
  progress: 65,
  duration_ms: 12500,
};

const mockCompletedStep: PlanStep = {
  id: 'step-3',
  tool_name: 'report-gen',
  tool_version: '1.2.0',
  role: 'report',
  status: 'completed',
  parameters: { format: 'pdf' },
  depends_on: ['step-2'],
};

const mockCompatibleTools = [
  { tool_id: 'mesh-generator', name: 'Mesh Generator', tool_version: '1.0.0' },
  { tool_id: 'mesh-gen-v2', name: 'Mesh Generator V2', tool_version: '2.0.0' },
  { tool_id: 'auto-mesh', name: 'Auto Mesh', tool_version: '1.5.0' },
];

// --- Tests ---

describe('PlanNodeDetail — editing', () => {
  let PlanNodeDetail: any;

  beforeEach(async () => {
    const mod = await import('@components/studio/PlanNodeDetail');
    PlanNodeDetail = mod.default;
  });

  it('renders editable input fields for numeric parameters when editing=true', () => {
    render(
      <PlanNodeDetail
        step={mockStep}
        onClose={vi.fn()}
        editing={true}
      />
    );
    const meshInput = screen.getByDisplayValue('1000');
    expect(meshInput).toBeDefined();
    expect(meshInput.getAttribute('type')).toBe('number');

    const tolInput = screen.getByDisplayValue('0.05');
    expect(tolInput).toBeDefined();
    expect(tolInput.getAttribute('type')).toBe('number');
  });

  it('enforces min/max from parameter_schema on input fields', () => {
    render(
      <PlanNodeDetail
        step={mockStep}
        onClose={vi.fn()}
        editing={true}
      />
    );
    const meshInput = screen.getByDisplayValue('1000') as HTMLInputElement;
    expect(meshInput.getAttribute('min')).toBe('100');
    expect(meshInput.getAttribute('max')).toBe('5000');

    const tolInput = screen.getByDisplayValue('0.05') as HTMLInputElement;
    expect(tolInput.getAttribute('min')).toBe('0.001');
    expect(tolInput.getAttribute('max')).toBe('1');
  });

  it('shows tool swap dropdown with compatible tools list', () => {
    render(
      <PlanNodeDetail
        step={mockStep}
        onClose={vi.fn()}
        editing={true}
        compatibleTools={mockCompatibleTools}
      />
    );
    const select = screen.getByRole('combobox');
    expect(select).toBeDefined();
    // Should have 3 options
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(3);
    expect(options[0].textContent).toContain('Mesh Generator');
  });

  it('calls onStepEdit with updated parameters when Save clicked', () => {
    const onStepEdit = vi.fn();
    render(
      <PlanNodeDetail
        step={mockStep}
        onClose={vi.fn()}
        editing={true}
        onStepEdit={onStepEdit}
      />
    );
    // Change mesh_size
    const meshInput = screen.getByDisplayValue('1000');
    fireEvent.change(meshInput, { target: { value: '2000' } });

    // Click Save
    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);

    expect(onStepEdit).toHaveBeenCalledWith('step-1', {
      parameters: expect.objectContaining({ mesh_size: 2000 }),
    });
  });

  it('calls onStepEdit with new tool when tool swapped', () => {
    const onStepEdit = vi.fn();
    render(
      <PlanNodeDetail
        step={mockStep}
        onClose={vi.fn()}
        editing={true}
        onStepEdit={onStepEdit}
        compatibleTools={mockCompatibleTools}
      />
    );
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'mesh-gen-v2' } });

    expect(onStepEdit).toHaveBeenCalledWith('step-1', {
      tool_id: 'mesh-gen-v2',
      tool_version: '2.0.0',
    });
  });

  it('disables editing when step status is running or completed', () => {
    // Running step
    const { unmount } = render(
      <PlanNodeDetail
        step={mockRunningStep}
        onClose={vi.fn()}
        editing={true}
      />
    );
    // Should NOT show editable inputs for numeric params
    const iterInput = screen.queryByDisplayValue('500');
    if (iterInput) {
      expect((iterInput as HTMLInputElement).disabled).toBe(true);
    }
    // Should not show Save button
    expect(screen.queryByText('Save')).toBeNull();
    unmount();

    // Completed step
    render(
      <PlanNodeDetail
        step={mockCompletedStep}
        onClose={vi.fn()}
        editing={true}
      />
    );
    expect(screen.queryByText('Save')).toBeNull();
  });

  it('read-only mode (default) shows parameters as text', () => {
    render(
      <PlanNodeDetail
        step={mockStep}
        onClose={vi.fn()}
      />
    );
    // Should show text values, not inputs
    expect(screen.getByText('1000')).toBeDefined();
    expect(screen.queryByDisplayValue('1000')).toBeNull();
  });
});

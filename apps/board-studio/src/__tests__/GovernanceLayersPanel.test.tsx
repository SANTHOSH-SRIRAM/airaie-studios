// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import GovernanceLayersPanel from '@components/studio/GovernanceLayersPanel';
import type { GovernanceLayers } from '@/types/governance';

const mockLayers: GovernanceLayers = {
  tool_contract: {
    sandbox_enabled: true,
    audit_logging: true,
    quota_remaining: 80,
    quota_limit: 100,
    verdict: 'pass',
    details: ['All checks passed'],
  },
  sandbox_policy: {
    project_id: 'proj-1',
    adapter_limits: { docker: '5 containers', python: '3 processes' },
    resource_limits: { memory: '4GB', cpu: '2 cores' },
    verdict: 'warning',
    details: ['Near resource limit'],
  },
  policy_engine: {
    decision: 'needs-approval',
    rationale: 'Study mode requires gate evaluation before execution.',
    policy_refs: ['POL-001: Study Mode Gate Policy', 'POL-003: Tool Trust Requirements'],
    verdict: 'warning',
  },
};

describe('GovernanceLayersPanel', () => {
  it('renders placeholder when no layers provided', () => {
    render(<GovernanceLayersPanel cardId="c1" boardId="b1" />);
    expect(screen.getByText('Governance layer data not available for this card.')).toBeTruthy();
  });

  it('renders all 3 section headers when layers provided', () => {
    render(<GovernanceLayersPanel cardId="c1" boardId="b1" layers={mockLayers} />);
    expect(screen.getByText('Tool Contract')).toBeTruthy();
    expect(screen.getByText('Sandbox Policy')).toBeTruthy();
    expect(screen.getByText('Policy Engine')).toBeTruthy();
  });

  it('renders verdict badges with correct text', () => {
    render(<GovernanceLayersPanel cardId="c1" boardId="b1" layers={mockLayers} />);
    expect(screen.getByText('Pass')).toBeTruthy();
    // Two sections have warning verdict
    const warningBadges = screen.getAllByText('Warning');
    expect(warningBadges.length).toBe(2);
  });

  it('sections are collapsed by default', () => {
    render(<GovernanceLayersPanel cardId="c1" boardId="b1" layers={mockLayers} />);
    // Content should not be visible when collapsed
    expect(screen.queryByText('All checks passed')).toBeNull();
    expect(screen.queryByText('Near resource limit')).toBeNull();
  });

  it('clicking a section header toggles its content', () => {
    render(<GovernanceLayersPanel cardId="c1" boardId="b1" layers={mockLayers} />);

    // Click Tool Contract header to expand
    fireEvent.click(screen.getByText('Tool Contract'));
    expect(screen.getByText('All checks passed')).toBeTruthy();
    expect(screen.getByText('Sandbox Enabled')).toBeTruthy();
    expect(screen.getByText('Audit Logging')).toBeTruthy();

    // Click again to collapse
    fireEvent.click(screen.getByText('Tool Contract'));
    expect(screen.queryByText('All checks passed')).toBeNull();
  });

  it('expands sandbox policy section with adapter and resource limits', () => {
    render(<GovernanceLayersPanel cardId="c1" boardId="b1" layers={mockLayers} />);

    fireEvent.click(screen.getByText('Sandbox Policy'));
    expect(screen.getByText('Adapter Limits')).toBeTruthy();
    expect(screen.getByText('docker')).toBeTruthy();
    expect(screen.getByText('5 containers')).toBeTruthy();
    expect(screen.getByText('Resource Limits')).toBeTruthy();
    expect(screen.getByText('memory')).toBeTruthy();
    expect(screen.getByText('4GB')).toBeTruthy();
  });

  it('expands policy engine section with decision and policy refs', () => {
    render(<GovernanceLayersPanel cardId="c1" boardId="b1" layers={mockLayers} />);

    fireEvent.click(screen.getByText('Policy Engine'));
    expect(screen.getByText('Needs Approval')).toBeTruthy();
    expect(screen.getByText('Study mode requires gate evaluation before execution.')).toBeTruthy();
    expect(screen.getByText('POL-001: Study Mode Gate Policy')).toBeTruthy();
    expect(screen.getByText('POL-003: Tool Trust Requirements')).toBeTruthy();
  });

  it('shows block verdict correctly', () => {
    const blockedLayers: GovernanceLayers = {
      ...mockLayers,
      policy_engine: {
        decision: 'blocked',
        rationale: 'Tool not certified for release mode.',
        policy_refs: [],
        verdict: 'block',
      },
    };
    render(<GovernanceLayersPanel cardId="c1" boardId="b1" layers={blockedLayers} />);
    expect(screen.getByText('Block')).toBeTruthy();
  });
});

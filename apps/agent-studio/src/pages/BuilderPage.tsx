import React, { useState, useRef, useCallback } from 'react';
import AgentSectionNav, { type AgentSection } from '@components/builder/AgentSectionNav';
import AgentToolbar from '@components/builder/AgentToolbar';
import GoalEditor from '@components/builder/GoalEditor';
import ToolAllowlist from '@components/builder/ToolAllowlist';
import ContextSchemaEditor from '@components/builder/ContextSchemaEditor';
import ScoringEditor from '@components/builder/ScoringEditor';
import ConstraintsEditor from '@components/builder/ConstraintsEditor';
import PolicyEditor from '@components/builder/PolicyEditor';
import SpecPreview from '@components/builder/SpecPreview';

const sectionIds: AgentSection[] = [
  'goal',
  'tools',
  'context',
  'scoring',
  'constraints',
  'policy',
  'preview',
];

export default function BuilderPage() {
  const [activeSection, setActiveSection] = useState<AgentSection>('goal');
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((section: AgentSection) => {
    setActiveSection(section);
    const el = contentRef.current?.querySelector(`[data-section="${section}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <AgentToolbar />

      {/* 2-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Section Navigation */}
        <AgentSectionNav
          activeSection={activeSection}
          onSectionChange={scrollToSection}
        />

        {/* Right: Section content (scrollable) */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto p-6 space-y-8"
        >
          <div data-section="goal">
            <GoalEditor />
          </div>

          <hr className="border-surface-border" />

          <div data-section="tools">
            <ToolAllowlist />
          </div>

          <hr className="border-surface-border" />

          <div data-section="context">
            <ContextSchemaEditor />
          </div>

          <hr className="border-surface-border" />

          <div data-section="scoring">
            <ScoringEditor />
          </div>

          <hr className="border-surface-border" />

          <div data-section="constraints">
            <ConstraintsEditor />
          </div>

          <hr className="border-surface-border" />

          <div data-section="policy">
            <PolicyEditor />
          </div>

          <hr className="border-surface-border" />

          <div data-section="preview">
            <SpecPreview />
          </div>
        </div>
      </div>
    </div>
  );
}

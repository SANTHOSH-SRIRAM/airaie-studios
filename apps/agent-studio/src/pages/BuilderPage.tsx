import React, { useState, useRef, useCallback } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import AgentSectionNav, { type AgentSection } from '@components/builder/AgentSectionNav';
import AgentToolbar from '@components/builder/AgentToolbar';
import GoalEditor from '@components/builder/GoalEditor';
import ToolAllowlist from '@components/builder/ToolAllowlist';
import ContextSchemaEditor from '@components/builder/ContextSchemaEditor';
import ScoringEditor from '@components/builder/ScoringEditor';
import ConstraintsEditor from '@components/builder/ConstraintsEditor';
import PolicyEditor from '@components/builder/PolicyEditor';
import DomainTagsEditor from '@components/builder/DomainTagsEditor';
import DeniedCapabilitiesEditor from '@components/builder/DeniedCapabilitiesEditor';
import SpecPreview from '@components/builder/SpecPreview';
import { useSpecStore } from '@store/specStore';
import { useUIStore } from '@store/uiStore';
import {
  useCreateAgent,
  useCreateAgentVersion,
  useValidateAgentVersion,
  usePublishAgentVersion,
} from '@hooks/useAgents';

interface AgentResponse {
  agent?: { id: string };
  id?: string;
}

interface VersionResponse {
  version?: { version: number } | number;
  valid?: boolean;
}

export default function BuilderPage() {
  const [activeSection, setActiveSection] = useState<AgentSection>('goal');
  const [status, setStatus] = useState<{ type: 'info' | 'error'; message: string } | null>(null);
  const [latestVersion, setLatestVersion] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const createAgent = useCreateAgent();
  const createVersion = useCreateAgentVersion();
  const validateVersion = useValidateAgentVersion();
  const publishVersion = usePublishAgentVersion();

  const scrollToSection = useCallback((section: AgentSection) => {
    setActiveSection(section);
    const el = contentRef.current?.querySelector(`[data-section="${section}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleValidate = useCallback(async () => {
    const agentId = useUIStore.getState().agentId;
    if (!agentId || latestVersion < 1) {
      setStatus({ type: 'error', message: 'Save the agent first before validating.' });
      return;
    }
    try {
      const result = await validateVersion.mutateAsync({ agentId, version: latestVersion });
      const valid = (result as unknown as VersionResponse)?.valid;
      setStatus({ type: valid ? 'info' : 'error', message: valid ? 'Validation passed.' : 'Validation failed.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: `Validation error: ${err.message}` });
    }
  }, [validateVersion, latestVersion]);

  const handleSave = useCallback(async () => {
    const spec = useSpecStore.getState().buildSpec('1.0.0', 'user');
    let agentId = useUIStore.getState().agentId;

    try {
      if (!agentId) {
        const agent = await createAgent.mutateAsync({ name: 'Untitled Agent', description: '', owner: 'user' });
        const agentResp = agent as unknown as AgentResponse;
        agentId = agentResp?.agent?.id ?? agentResp?.id ?? '';
        useUIStore.getState().setAgentId(agentId);
      }

      const ver = await createVersion.mutateAsync({ agentId, spec: spec as unknown as Record<string, unknown> });
      const verResp = ver as unknown as VersionResponse;
      const vNum = typeof verResp?.version === 'object' ? verResp.version.version : (verResp?.version ?? 1);
      setLatestVersion(vNum);
      useSpecStore.getState().setDirty(false);
      setStatus({ type: 'info', message: `Saved as version ${vNum}.` });
    } catch (err: any) {
      setStatus({ type: 'error', message: `Save failed: ${err.message}` });
    }
  }, [createAgent, createVersion]);

  const handlePublish = useCallback(async () => {
    const agentId = useUIStore.getState().agentId;
    if (!agentId || latestVersion < 1) {
      setStatus({ type: 'error', message: 'Save the agent first before publishing.' });
      return;
    }
    try {
      await publishVersion.mutateAsync({ agentId, version: latestVersion });
      setStatus({ type: 'info', message: `Version ${latestVersion} published.` });
    } catch (err: any) {
      setStatus({ type: 'error', message: `Publish failed: ${err.message}` });
    }
  }, [publishVersion, latestVersion]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AgentToolbar
        onValidate={handleValidate}
        onSave={handleSave}
        onPublish={handlePublish}
      />

      {status && (
        <div className={`px-4 py-2 text-xs ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
          {status.message}
          <button className="ml-2 underline" onClick={() => setStatus(null)}>dismiss</button>
        </div>
      )}

      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <Group orientation="horizontal" id="builder-panels" className="h-full w-full">
          {/* Section Navigator */}
          <Panel id="builder-nav" defaultSize="18%" minSize="12%" maxSize="25%">
            <div className="h-full w-full flex flex-col border-r border-gray-200 overflow-hidden">
              <AgentSectionNav
                activeSection={activeSection}
                onSectionChange={scrollToSection}
              />
              {/* Collapsible JSON preview at bottom of nav */}
              {showPreview && (
                <div className="border-t border-gray-200 flex-1 overflow-auto">
                  <div className="px-3 py-2">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-[10px] uppercase tracking-wider text-gray-400 font-medium hover:text-gray-600"
                    >
                      Spec Preview
                    </button>
                  </div>
                  <div className="px-3 pb-3 text-[11px] font-mono text-gray-500 overflow-auto max-h-60">
                    <SpecPreview />
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <Separator className="w-px bg-gray-200 hover:bg-blue-400 active:bg-blue-500 transition-colors" />

          {/* Active Section Editor */}
          <Panel id="builder-editor" defaultSize="82%" minSize="50%">
            <div
              ref={contentRef}
              className="h-full overflow-y-auto p-6 space-y-8"
            >
              {/* Show only active section for focused editing, or all for scroll */}
              <div data-section="goal"><GoalEditor /></div>
              <hr className="border-gray-100" />
              <div data-section="tools"><ToolAllowlist /></div>
              <hr className="border-gray-100" />
              <div data-section="context"><ContextSchemaEditor /></div>
              <hr className="border-gray-100" />
              <div data-section="scoring"><ScoringEditor /></div>
              <hr className="border-gray-100" />
              <div data-section="constraints"><ConstraintsEditor /></div>
              <hr className="border-gray-100" />
              <div data-section="policy"><PolicyEditor /></div>
              <hr className="border-gray-100" />
              <div data-section="domain-tags"><DomainTagsEditor /></div>
              <hr className="border-gray-100" />
              <div data-section="denied-capabilities"><DeniedCapabilitiesEditor /></div>
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  );
}

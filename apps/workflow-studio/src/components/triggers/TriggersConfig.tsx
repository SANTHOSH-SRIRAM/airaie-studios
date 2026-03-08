import React, { useState } from 'react';
import { cn, Button, Badge, EmptyState, Spinner } from '@airaie/ui';
import { Plus, Webhook, Clock, Zap, Trash2, Save } from 'lucide-react';
import { useTriggers, useCreateTrigger, useUpdateTrigger, useDeleteTrigger } from '@hooks/useTriggers';
import type { Trigger } from '@api/triggers';
import WebhookConfig from './WebhookConfig';
import CronConfig from './CronConfig';
import EventTriggerConfig from './EventTriggerConfig';

type TriggerType = 'webhook' | 'cron' | 'event';

export interface TriggersConfigProps {
  workflowId?: string;
  className?: string;
}

const typeIcon = { webhook: Webhook, cron: Clock, event: Zap };
const typeLabel = { webhook: 'Webhook', cron: 'Cron Schedule', event: 'Event' };

const TriggersConfig: React.FC<TriggersConfigProps> = ({ workflowId, className }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingConfigs, setPendingConfigs] = useState<Record<string, Record<string, unknown>>>({});

  // API hooks — only enabled when workflowId is present
  const { data: triggers, isLoading } = useTriggers(workflowId ?? '');
  const createTrigger = useCreateTrigger(workflowId ?? '');
  const updateTrigger = useUpdateTrigger(workflowId ?? '');
  const deleteTrigger = useDeleteTrigger(workflowId ?? '');

  const safeTriggers: Trigger[] = Array.isArray(triggers) ? triggers : [];

  const handleAdd = (type: TriggerType) => {
    if (!workflowId) return;
    createTrigger.mutate(
      { type, config: {}, enabled: true },
      { onSuccess: (t) => setExpandedId(t.id) },
    );
  };

  const handleDelete = (id: string) => {
    if (!workflowId) return;
    deleteTrigger.mutate(id);
    if (expandedId === id) setExpandedId(null);
  };

  const handleConfigChange = (id: string, config: Record<string, unknown>) => {
    setPendingConfigs((prev) => ({ ...prev, [id]: config }));
  };

  const handleSave = (trigger: Trigger) => {
    if (!workflowId) return;
    const config = pendingConfigs[trigger.id];
    if (!config) return;
    updateTrigger.mutate(
      { triggerId: trigger.id, config },
      { onSuccess: () => setPendingConfigs((prev) => { const next = { ...prev }; delete next[trigger.id]; return next; }) },
    );
  };

  if (!workflowId) {
    return (
      <div className={cn('space-y-4', className)}>
        <EmptyState
          icon={Zap}
          heading="Select a workflow"
          description="Choose a workflow to configure its triggers."
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-content-primary">Triggers</span>
        <div className="ml-auto flex gap-2">
          {(['webhook', 'cron', 'event'] as TriggerType[]).map((type) => {
            const Icon = typeIcon[type];
            return (
              <Button
                key={type}
                variant="outline"
                size="sm"
                icon={Icon}
                onClick={() => handleAdd(type)}
                loading={createTrigger.isPending}
              >
                {typeLabel[type]}
              </Button>
            );
          })}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {!isLoading && safeTriggers.length === 0 && (
        <EmptyState
          icon={Plus}
          heading="No triggers configured"
          description="Add a webhook, cron schedule, or event trigger to automate this workflow."
        />
      )}

      {!isLoading && safeTriggers.length > 0 && (
        <div className="space-y-3">
          {safeTriggers.map((trigger) => {
            const Icon = typeIcon[trigger.type];
            const isExpanded = expandedId === trigger.id;
            const hasPending = !!pendingConfigs[trigger.id];
            const currentConfig = pendingConfigs[trigger.id] ?? (trigger.config as Record<string, unknown>);

            return (
              <div key={trigger.id} className="border border-surface-border bg-white">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-hover"
                  onClick={() => setExpandedId(isExpanded ? null : trigger.id)}
                >
                  <Icon size={16} className="text-brand-secondary" />
                  <span className="text-sm font-medium text-content-primary">{typeLabel[trigger.type]}</span>
                  <Badge variant={trigger.enabled ? 'success' : 'neutral'} badgeStyle="outline">
                    {trigger.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <div className="ml-auto flex items-center gap-2">
                    {hasPending && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Save}
                        onClick={(e) => { e.stopPropagation(); handleSave(trigger); }}
                        loading={updateTrigger.isPending}
                      >
                        Save
                      </Button>
                    )}
                    <button
                      className="text-content-muted hover:text-status-danger transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleDelete(trigger.id); }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-surface-border">
                    {trigger.type === 'webhook' && (
                      <WebhookConfig config={currentConfig} onChange={(c) => handleConfigChange(trigger.id, c)} />
                    )}
                    {trigger.type === 'cron' && (
                      <CronConfig config={currentConfig} onChange={(c) => handleConfigChange(trigger.id, c)} />
                    )}
                    {trigger.type === 'event' && (
                      <EventTriggerConfig config={currentConfig} onChange={(c) => handleConfigChange(trigger.id, c)} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

TriggersConfig.displayName = 'TriggersConfig';
export default TriggersConfig;

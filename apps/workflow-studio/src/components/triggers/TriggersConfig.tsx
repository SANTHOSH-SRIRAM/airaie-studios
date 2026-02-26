import React, { useState } from 'react';
import { cn, Button, Badge, EmptyState } from '@airaie/ui';
import { Plus, Webhook, Clock, Zap, Trash2 } from 'lucide-react';
import WebhookConfig from './WebhookConfig';
import CronConfig from './CronConfig';
import EventTriggerConfig from './EventTriggerConfig';

type TriggerType = 'webhook' | 'cron' | 'event';

interface TriggerItem {
  id: string;
  type: TriggerType;
  config: Record<string, unknown>;
}

export interface TriggersConfigProps {
  className?: string;
}

const TriggersConfig: React.FC<TriggersConfigProps> = ({ className }) => {
  const [triggers, setTriggers] = useState<TriggerItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addTrigger = (type: TriggerType) => {
    const id = `trig_${Date.now()}`;
    setTriggers((prev) => [...prev, { id, type, config: {} }]);
    setExpandedId(id);
  };

  const removeTrigger = (id: string) => {
    setTriggers((prev) => prev.filter((t) => t.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const updateConfig = (id: string, config: Record<string, unknown>) => {
    setTriggers((prev) => prev.map((t) => (t.id === id ? { ...t, config } : t)));
  };

  const typeIcon = { webhook: Webhook, cron: Clock, event: Zap };
  const typeLabel = { webhook: 'Webhook', cron: 'Cron Schedule', event: 'Event' };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-content-primary">Triggers</span>
        <div className="ml-auto flex gap-2">
          {(['webhook', 'cron', 'event'] as TriggerType[]).map((type) => {
            const Icon = typeIcon[type];
            return (
              <Button key={type} variant="outline" size="sm" icon={Icon} onClick={() => addTrigger(type)}>
                {typeLabel[type]}
              </Button>
            );
          })}
        </div>
      </div>

      {triggers.length === 0 ? (
        <EmptyState
          icon={Plus}
          heading="No triggers configured"
          description="Add a webhook, cron schedule, or event trigger to automate this workflow."
        />
      ) : (
        <div className="space-y-3">
          {triggers.map((trigger) => {
            const Icon = typeIcon[trigger.type];
            const isExpanded = expandedId === trigger.id;
            return (
              <div key={trigger.id} className="border border-surface-border bg-white">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-hover"
                  onClick={() => setExpandedId(isExpanded ? null : trigger.id)}
                >
                  <Icon size={16} className="text-brand-secondary" />
                  <span className="text-sm font-medium text-content-primary">{typeLabel[trigger.type]}</span>
                  <Badge variant="neutral" badgeStyle="outline">{trigger.id.slice(0, 12)}</Badge>
                  <button
                    className="ml-auto text-content-muted hover:text-status-danger transition-colors"
                    onClick={(e) => { e.stopPropagation(); removeTrigger(trigger.id); }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-surface-border">
                    {trigger.type === 'webhook' && (
                      <WebhookConfig config={trigger.config} onChange={(c) => updateConfig(trigger.id, c)} />
                    )}
                    {trigger.type === 'cron' && (
                      <CronConfig config={trigger.config} onChange={(c) => updateConfig(trigger.id, c)} />
                    )}
                    {trigger.type === 'event' && (
                      <EventTriggerConfig config={trigger.config} onChange={(c) => updateConfig(trigger.id, c)} />
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

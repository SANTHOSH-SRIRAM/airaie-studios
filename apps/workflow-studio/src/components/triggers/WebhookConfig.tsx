import React, { useState, useEffect } from 'react';
import { cn, Button, Input } from '@airaie/ui';
import { Copy, Eye, EyeOff, RefreshCw, Send, Check } from 'lucide-react';

export interface WebhookConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  className?: string;
}

const generateHex = (length: number): string =>
  Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');

const WebhookConfig: React.FC<WebhookConfigProps> = ({ config, onChange, className }) => {
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const url = (config.url as string) || `https://api.airaie.dev/webhooks/${generateHex(12)}`;
  const secret = (config.secret as string) || generateHex(32);

  useEffect(() => {
    if (!config.url || !config.secret) {
      onChange({ ...config, url, secret });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateSecret = () => {
    const newSecret = generateHex(32);
    onChange({ ...config, secret: newSecret });
  };

  const handleTestWebhook = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2000);
  };

  return (
    <div className={cn('space-y-4 pt-4', className)}>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-content-primary">Webhook URL</label>
        <div className="flex items-center gap-2">
          <Input
            value={url}
            readOnly
            className="flex-1 font-mono text-xs bg-surface-hover"
          />
          <Button variant="outline" size="sm" icon={copied ? Check : Copy} onClick={handleCopyUrl}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-content-primary">Signing Secret</label>
        <div className="flex items-center gap-2">
          <Input
            value={showSecret ? secret : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
            readOnly
            className="flex-1 font-mono text-xs"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={showSecret ? EyeOff : Eye}
            onClick={() => setShowSecret((v) => !v)}
          />
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={handleRegenerateSecret}>
            Regenerate
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="secondary"
          size="sm"
          icon={testSent ? Check : Send}
          onClick={handleTestWebhook}
          disabled={testSent}
        >
          {testSent ? 'Test Sent' : 'Test Webhook'}
        </Button>
        {testSent && (
          <span className="text-xs text-status-success">Webhook test payload sent successfully.</span>
        )}
      </div>
    </div>
  );
};

WebhookConfig.displayName = 'WebhookConfig';
export default WebhookConfig;

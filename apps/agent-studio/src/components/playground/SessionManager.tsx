import React from 'react';
import { cn, Button, Select } from '@airaie/ui';
import { Plus, XCircle } from 'lucide-react';
import { usePlaygroundStore } from '@store/playgroundStore';
import { useUIStore } from '@store/uiStore';
import { useSessions, useCreateSession, useCloseSession } from '@hooks/useSessions';

const SessionManager: React.FC<{ className?: string }> = ({ className }) => {
  const agentId = useUIStore((s) => s.agentId);
  const activeSessionId = usePlaygroundStore((s) => s.activeSessionId);
  const setActiveSession = usePlaygroundStore((s) => s.setActiveSession);
  const clearMessages = usePlaygroundStore((s) => s.clearMessages);
  const clearProposals = usePlaygroundStore((s) => s.clearProposals);

  const { data: sessions } = useSessions(agentId);
  const createSession = useCreateSession();
  const closeSession = useCloseSession();

  const activeSessions = (sessions ?? []).filter((s) => s.status === 'active');

  const sessionOptions = [
    { value: '', label: 'Select session...' },
    ...activeSessions.map((s) => ({
      value: s.id,
      label: `${s.id.slice(0, 12)}... (${new Date(s.created_at).toLocaleTimeString()})`,
    })),
  ];

  const handleNewSession = () => {
    createSession.mutate(
      { agentId },
      {
        onSuccess: (session) => {
          clearMessages();
          clearProposals();
          setActiveSession(session.id);
        },
      }
    );
  };

  const handleCloseSession = () => {
    if (!activeSessionId) return;
    closeSession.mutate(
      { agentId, sessionId: activeSessionId },
      {
        onSuccess: () => {
          clearMessages();
          clearProposals();
          setActiveSession(null);
        },
      }
    );
  };

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sid = e.target.value;
    clearMessages();
    clearProposals();
    setActiveSession(sid || null);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
        Session
      </span>

      {activeSessions.length > 0 ? (
        <Select
          options={sessionOptions}
          value={activeSessionId ?? ''}
          onChange={handleSessionChange}
          className="w-56"
        />
      ) : (
        <span className="text-xs text-content-muted">No active sessions</span>
      )}

      {activeSessionId && (
        <button
          onClick={handleCloseSession}
          disabled={closeSession.isPending}
          className="p-1 text-content-muted hover:text-status-danger transition-colors"
          title="Close session"
        >
          <XCircle size={14} />
        </button>
      )}

      <Button
        variant="ghost"
        size="sm"
        icon={Plus}
        onClick={handleNewSession}
        loading={createSession.isPending}
      >
        New Session
      </Button>
    </div>
  );
};

SessionManager.displayName = 'SessionManager';

export default SessionManager;

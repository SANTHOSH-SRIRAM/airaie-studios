import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn, Button } from '@airaie/ui';
import { Send } from 'lucide-react';
import { usePlaygroundStore } from '@store/playgroundStore';
import { useSpecStore } from '@store/specStore';
import { useUIStore } from '@store/uiStore';
import { useSendMessage, useApproveAction, useRunInSession } from '@hooks/useSessions';
import { useRunStream } from '@hooks/useAgentRun';
import type { RunEvent } from '@airaie/shared';
import ChatMessage from './ChatMessage';
import ProposalCard from './ProposalCard';
import InputForm from './InputForm';

export interface AgentChatProps {
  selectedProposalId: string | null;
  onSelectProposal: (id: string) => void;
  className?: string;
}

const AgentChat: React.FC<AgentChatProps> = ({ selectedProposalId, onSelectProposal, className }) => {
  const msgCounterRef = useRef(0);
  const nextMsgId = () => `msg_${Date.now()}_${++msgCounterRef.current}`;
  const agentId = useUIStore((s) => s.agentId);
  const messages = usePlaygroundStore((s) => s.messages);
  const proposals = usePlaygroundStore((s) => s.proposals);
  const activeSessionId = usePlaygroundStore((s) => s.activeSessionId);
  const addMessage = usePlaygroundStore((s) => s.addMessage);
  const addProposal = usePlaygroundStore((s) => s.addProposal);
  const isRunning = usePlaygroundStore((s) => s.isRunning);
  const setRunning = usePlaygroundStore((s) => s.setRunning);
  const dryRun = usePlaygroundStore((s) => s.dryRun);
  const activeRunId = usePlaygroundStore((s) => s.activeRunId);
  const setActiveRunId = usePlaygroundStore((s) => s.setActiveRunId);
  const contextSchema = useSpecStore((s) => s.contextSchema);

  const sendMessage = useSendMessage();
  const runInSession = useRunInSession();
  const approveAction = useApproveAction();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, proposals]);

  // Stream events from active run
  const handleRunEvent = useCallback(
    (event: RunEvent) => {
      if (event.event_type === 'RUN_COMPLETED') {
        const payload = event.payload as Record<string, unknown>;
        const outputs = payload.outputs as Record<string, unknown> | undefined;
        const response = outputs?.response ?? outputs?.result ?? outputs?.content;
        if (response) {
          addMessage({
            id: nextMsgId(),
            role: 'agent',
            content: typeof response === 'string' ? response : JSON.stringify(response, null, 2),
            timestamp: event.timestamp,
          });
        }
        setRunning(false);
        setActiveRunId(null);
      } else if (event.event_type === 'RUN_FAILED') {
        const payload = event.payload as Record<string, unknown>;
        addMessage({
          id: nextMsgId(),
          role: 'system',
          content: `Run failed: ${payload.error ?? 'Unknown error'}`,
          timestamp: event.timestamp,
        });
        setRunning(false);
        setActiveRunId(null);
      } else if (event.event_type === 'RUN_CANCELED') {
        setRunning(false);
        setActiveRunId(null);
      }
    },
    [addMessage, setRunning, setActiveRunId]
  );

  useRunStream(activeRunId, handleRunEvent);

  const handleSend = useCallback(() => {
    if (!input.trim() || !activeSessionId) return;
    const content = input.trim();
    const msg = {
      id: nextMsgId(),
      role: 'user' as const,
      content,
      timestamp: new Date().toISOString(),
    };
    addMessage(msg);
    setInput('');
    setRunning(true);

    if (dryRun) {
      // Dry run: use sendMessage (synchronous response with session update)
      sendMessage.mutate(
        { agentId, sessionId: activeSessionId, content },
        {
          onSuccess: (session) => {
            // Extract agent reply from updated session history
            const history = session.history as Array<{ role: string; content: string }> | undefined;
            if (history?.length) {
              const lastEntry = history[history.length - 1];
              if (lastEntry.role === 'agent' || lastEntry.role === 'assistant') {
                addMessage({
                  id: nextMsgId(),
                  role: 'agent',
                  content: lastEntry.content,
                  timestamp: new Date().toISOString(),
                });
              }
            }
            setRunning(false);
          },
          onError: (err) => {
            addMessage({
              id: nextMsgId(),
              role: 'system',
              content: `Error: ${(err as Error).message}`,
              timestamp: new Date().toISOString(),
            });
            setRunning(false);
          },
        }
      );
    } else {
      // Live execution: use runInSession to get a streamable run
      runInSession.mutate(
        { agentId, sessionId: activeSessionId, inputs: { message: content } },
        {
          onSuccess: (run) => {
            // Set the active run ID — useRunStream will pick it up
            setActiveRunId(run.id);
          },
          onError: (err) => {
            addMessage({
              id: nextMsgId(),
              role: 'system',
              content: `Error starting run: ${(err as Error).message}`,
              timestamp: new Date().toISOString(),
            });
            setRunning(false);
          },
        }
      );
    }
  }, [input, activeSessionId, agentId, dryRun, addMessage, setRunning, setActiveRunId, sendMessage, runInSession]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputFormSubmit = (values: Record<string, unknown>) => {
    const msg = {
      id: nextMsgId(),
      role: 'user' as const,
      content: JSON.stringify(values, null, 2),
      timestamp: new Date().toISOString(),
    };
    addMessage(msg);
    setRunning(true);

    if (activeSessionId) {
      if (dryRun) {
        sendMessage.mutate(
          { agentId, sessionId: activeSessionId, content: msg.content },
          {
            onSuccess: (session) => {
              const history = session.history as Array<{ role: string; content: string }> | undefined;
              if (history?.length) {
                const lastEntry = history[history.length - 1];
                if (lastEntry.role === 'agent' || lastEntry.role === 'assistant') {
                  addMessage({
                    id: nextMsgId(),
                    role: 'agent',
                    content: lastEntry.content,
                    timestamp: new Date().toISOString(),
                  });
                }
              }
              setRunning(false);
            },
            onError: () => setRunning(false),
          }
        );
      } else {
        runInSession.mutate(
          { agentId, sessionId: activeSessionId, inputs: values },
          {
            onSuccess: (run) => setActiveRunId(run.id),
            onError: () => setRunning(false),
          }
        );
      }
    }
  };

  const handleApproveAction = (proposalId: string) => {
    if (!activeSessionId) return;
    approveAction.mutate({ agentId, sessionId: activeSessionId, actionId: proposalId, decision: 'approve' });
  };

  const handleRejectAction = (proposalId: string) => {
    if (!activeSessionId) return;
    approveAction.mutate({ agentId, sessionId: activeSessionId, actionId: proposalId, decision: 'reject' });
  };

  if (!activeSessionId) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-content-muted">
        Create a session to start chatting.
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Context input form */}
      {messages.length === 0 && (
        <InputForm schema={contextSchema} onSubmit={handleInputFormSubmit} disabled={isRunning} />
      )}

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <React.Fragment key={msg.id}>
            <ChatMessage message={msg} />
            {msg.proposalId && (() => {
              const proposal = proposals.find((p) => p.id === msg.proposalId);
              return proposal ? (
                <ProposalCard
                  proposal={proposal}
                  isSelected={selectedProposalId === proposal.id}
                  onSelect={() => onSelectProposal(proposal.id)}
                  onApprove={() => handleApproveAction(proposal.id)}
                  onReject={() => handleRejectAction(proposal.id)}
                />
              ) : null;
            })()}
          </React.Fragment>
        ))}
        {isRunning && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-content-muted">
            <div className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse" />
            Agent is thinking...
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-surface-border p-3 bg-white flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className={cn(
            'flex-1 px-3 py-2 text-sm border border-surface-border rounded-none resize-none',
            'focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-1',
            'text-content-primary placeholder:text-content-muted'
          )}
          disabled={isRunning}
        />
        <Button
          variant="primary"
          size="md"
          icon={Send}
          onClick={handleSend}
          disabled={!input.trim() || isRunning}
        />
      </div>
    </div>
  );
};

AgentChat.displayName = 'AgentChat';

export default AgentChat;

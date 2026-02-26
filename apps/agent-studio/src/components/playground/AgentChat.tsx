import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn, Button } from '@airaie/ui';
import { Send } from 'lucide-react';
import { usePlaygroundStore } from '@store/playgroundStore';
import { useSpecStore } from '@store/specStore';
import { useUIStore } from '@store/uiStore';
import { useSendMessage, useApproveAction } from '@hooks/useSessions';
import ChatMessage from './ChatMessage';
import ProposalCard from './ProposalCard';
import InputForm from './InputForm';

export interface AgentChatProps {
  selectedProposalId: string | null;
  onSelectProposal: (id: string) => void;
  className?: string;
}

let msgCounter = 0;

const AgentChat: React.FC<AgentChatProps> = ({ selectedProposalId, onSelectProposal, className }) => {
  const agentId = useUIStore((s) => s.agentId);
  const messages = usePlaygroundStore((s) => s.messages);
  const proposals = usePlaygroundStore((s) => s.proposals);
  const activeSessionId = usePlaygroundStore((s) => s.activeSessionId);
  const addMessage = usePlaygroundStore((s) => s.addMessage);
  const isRunning = usePlaygroundStore((s) => s.isRunning);
  const contextSchema = useSpecStore((s) => s.contextSchema);

  const sendMessage = useSendMessage();
  const approveAction = useApproveAction();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, proposals]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !activeSessionId) return;
    const msg = {
      id: `msg_${Date.now()}_${++msgCounter}`,
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    addMessage(msg);
    setInput('');
    sendMessage.mutate({ agentId, sessionId: activeSessionId, content: msg.content });
  }, [input, activeSessionId, agentId, addMessage, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputFormSubmit = (values: Record<string, unknown>) => {
    const msg = {
      id: `msg_${Date.now()}_${++msgCounter}`,
      role: 'user' as const,
      content: JSON.stringify(values, null, 2),
      timestamp: new Date().toISOString(),
    };
    addMessage(msg);
    if (activeSessionId) {
      sendMessage.mutate({ agentId, sessionId: activeSessionId, content: msg.content });
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

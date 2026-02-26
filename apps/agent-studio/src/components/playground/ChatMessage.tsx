import React from 'react';
import { cn } from '@airaie/ui';
import type { ChatMessage as ChatMessageType } from '@store/playgroundStore';

const ChatMessage: React.FC<{ message: ChatMessageType }> = ({ message }) => {
  if (message.role === 'system') {
    return (
      <div className="text-center py-2">
        <span className="text-xs text-content-muted">{message.content}</span>
      </div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] px-4 py-2.5 text-sm',
          isUser
            ? 'bg-[#eff6ff] text-content-primary'
            : 'bg-white border border-surface-border text-content-primary'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <span className="block mt-1 text-xs text-content-muted">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;

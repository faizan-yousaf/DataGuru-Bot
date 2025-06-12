import React from 'react';
import { ChatMessage } from '@/types/chat';
import { MessageActions } from './MessageActions';
import { MessageContent } from './MessageContent';
import { MessageAttachments } from './MessageAttachments';

interface MessageBubbleProps {
  message: ChatMessage;
  onReaction: (messageId: string, type: 'like' | 'dislike') => void;
  onRegenerate: (messageId: string) => void;
  onUpdateAttachment: (messageId: string, attachmentId: string, updates: any) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onReaction,
  onRegenerate,
  onUpdateAttachment
}) => {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-lg p-4`}>
        <MessageContent content={message.content} />
        {message.attachments && (
          <MessageAttachments 
            attachments={message.attachments}
            onUpdate={(attachmentId, updates) => onUpdateAttachment(message.id, attachmentId, updates)}
          />
        )}
        <MessageActions 
          message={message}
          onReaction={onReaction}
          onRegenerate={onRegenerate}
        />
      </div>
    </div>
  );
};
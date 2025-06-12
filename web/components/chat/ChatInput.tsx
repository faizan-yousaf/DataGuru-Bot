import React, { useState } from 'react';
import { MessageAttachment } from '@/types/chat';
import { AttachmentButton } from './AttachmentButton';
import { VoiceButton } from './VoiceButton';

interface ChatInputProps {
  onSendMessage: (content: string, attachments: MessageAttachment[]) => void;
  isTyping: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isTyping }) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || attachments.length > 0) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2 p-4 border-t">
      <AttachmentButton onAttachment={(attachment) => setAttachments([...attachments, attachment])} />
      <VoiceButton onVoiceAttachment={(attachment) => setAttachments([...attachments, attachment])} />
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 p-2 border rounded-lg"
        disabled={isTyping}
      />
      <button
        type="submit"
        disabled={isTyping || (!input.trim() && attachments.length === 0)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
};
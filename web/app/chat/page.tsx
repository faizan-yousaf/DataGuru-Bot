'use client';
import React from 'react';
import { useGeminiChat } from '@/hooks/useGeminiChat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { WelcomeScreen } from '@/components/chat/WelcomeScreen';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

export default function ChatPage() {
  const {
    messages,
    isTyping,
    error,
    sendMessage,
    updateReaction,
    regenerateMessage,
    updateMessageAttachment,
    clearMessages
  } = useGeminiChat();

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <WelcomeScreen onPromptSelect={(prompt) => sendMessage(prompt)} />
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onReaction={updateReaction}
                onRegenerate={regenerateMessage}
                onUpdateAttachment={updateMessageAttachment}
              />
            ))}
            {isTyping && <TypingIndicator />}
          </>
        )}
      </div>
      <ChatInput onSendMessage={sendMessage} isTyping={isTyping} />
    </div>
  );
}
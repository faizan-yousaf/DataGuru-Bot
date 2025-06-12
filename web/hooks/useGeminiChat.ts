import { useState, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatState, ChatMessage, MessageAttachment } from '@/types/chat';
import { SYSTEM_PROMPT } from '@/data/prompt';
import { generateId } from '@/utils/chat';

export const useGeminiChat = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isTyping: false,
    error: null
  });

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  const model = genAI?.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const sendMessage = useCallback(async (
    content: string, 
    attachments: MessageAttachment[] = [], 
    extractedText?: string, 
    isErrorImage?: boolean
  ) => {
    // ... existing implementation
  }, [model, state.messages]);

  const updateReaction = useCallback((messageId: string, type: 'like' | 'dislike') => {
    // ... existing implementation
  }, []);

  const regenerateMessage = useCallback(async (messageId: string) => {
    // ... existing implementation
  }, [state.messages, model]);

  const updateMessageAttachment = useCallback((
    messageId: string, 
    attachmentId: string, 
    updates: Partial<MessageAttachment>
  ) => {
    // ... existing implementation
  }, []);

  const clearMessages = useCallback(() => {
    setState({
      messages: [],
      isTyping: false,
      error: null
    });
  }, []);

  return {
    messages: state.messages,
    isTyping: state.isTyping,
    error: state.error,
    sendMessage,
    updateReaction,
    regenerateMessage,
    updateMessageAttachment,
    isConfigured: !!apiKey,
    clearMessages
  };
};
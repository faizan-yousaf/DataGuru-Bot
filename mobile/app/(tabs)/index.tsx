import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Ionicons } from '@expo/vector-icons';
import { SYSTEM_PROMPT } from '../../data/prompt';

// Types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: MessageAttachment[];
}

interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'audio' | 'voice' | 'link';
  url: string;
  name: string;
  size?: number;
}

interface SuggestedPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: 'rag' | 'agentic' | 'neural' | 'advanced';
}

const { width, height } = Dimensions.get('window');

// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyASW4HYUah4pTETcNhBdvYfnQ6nN7LH9Co';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const WELCOME_PROMPTS: SuggestedPrompt[] = [
  {
    id: '1',
    title: 'Implementing RAG Systems',
    description: 'Learn about Retrieval-Augmented Generation architecture',
    prompt: 'Explain how to implement a RAG (Retrieval-Augmented Generation) system for document Q&A. Include the key components, vector databases, and best practices.',
    category: 'rag'
  },
  {
    id: '2',
    title: 'Understanding Agentic AI',
    description: 'Explore autonomous AI agents and their capabilities',
    prompt: 'What is Agentic AI and how does it differ from traditional AI? Explain the key components of AI agents and their real-world applications.',
    category: 'agentic'
  },
  {
    id: '3',
    title: 'Neural Network Architectures',
    description: 'Deep dive into modern neural network designs',
    prompt: 'Compare different neural network architectures like Transformers, CNNs, and RNNs. When should I use each one for different types of problems?',
    category: 'neural'
  },
  {
    id: '4',
    title: 'Latest AI Trends 2024',
    description: 'Discover cutting-edge developments in AI',
    prompt: 'What are the most significant AI breakthroughs and trends in 2024? Focus on practical applications in data science and machine learning.',
    category: 'advanced'
  }
];

const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const sendMessage = useCallback(async (content: string, messageAttachments: MessageAttachment[] = []) => {
    if (!content.trim() && messageAttachments.length === 0) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      content: content.trim() || 'Shared attachments',
      role: 'user',
      timestamp: Date.now(),
      attachments: messageAttachments
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Create chat session with system prompt
      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: SYSTEM_PROMPT }]
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I am DataGuru, your specialized AI assistant for Data Science, Machine Learning, AI, Cloud Engineering, and Data Engineering. I\'m ready to help you with any questions or challenges in these domains. How can I assist you today?' }]
          },
          // Add previous messages for context
          ...messages.slice(-10).flatMap(msg => [
            {
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }]
            }
          ])
        ]
      });

      const result = await chat.sendMessage(content);
      const response = await result.response;
      const responseText = response.text();

      const assistantMessage: ChatMessage = {
        id: generateId(),
        content: responseText || 'I apologize, but I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        content: 'I apologize, but I encountered an error connecting to the AI service. Please check your internet connection and try again.',
        role: 'assistant',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    sendMessage(inputValue, attachments);
    setInputValue('');
    setAttachments([]);
  }, [inputValue, attachments, sendMessage]);

  const handlePromptSelect = useCallback((prompt: string) => {
    setInputValue(prompt);
    setTimeout(() => {
      sendMessage(prompt, []);
    }, 100);
  }, [sendMessage]);

  const handleVoiceToggle = useCallback(() => {
    setIsRecording(!isRecording);
    // Implement voice recording logic here
    Alert.alert('Voice Recording', 'Voice recording feature will be implemented');
  }, [isRecording]);

  const handleAttachment = useCallback(() => {
    setShowAttachmentMenu(!showAttachmentMenu);
    // Implement attachment logic here
    Alert.alert('Attachments', 'Attachment feature will be implemented');
  }, [showAttachmentMenu]);

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    return (
      <View key={message.id} style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {message.content}
          </Text>
          <Text style={[styles.messageTime, isUser ? styles.userTime : styles.assistantTime]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const renderWelcomePrompts = () => {
    if (messages.length > 0) return null;

    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeHeader}>
          <Ionicons name="sparkles" size={32} color="#6366f1" />
          <Text style={styles.welcomeTitle}>Welcome to DataGuru AI</Text>
          <Text style={styles.welcomeSubtitle}>
            Your specialized Data Science AI assistant. Choose a topic to get started:
          </Text>
        </View>
        
        <View style={styles.promptsGrid}>
          {WELCOME_PROMPTS.map((prompt) => (
            <TouchableOpacity
              key={prompt.id}
              style={styles.promptCard}
              onPress={() => handlePromptSelect(prompt.prompt)}
            >
              <View style={styles.promptHeader}>
                <Ionicons 
                  name={prompt.category === 'rag' ? 'library' :
                        prompt.category === 'agentic' ? 'robot' :
                        prompt.category === 'neural' ? 'brain' : 'trending-up'} 
                  size={20} 
                  color="#6366f1" 
                />
                <Text style={styles.promptTitle}>{prompt.title}</Text>
              </View>
              <Text style={styles.promptDescription}>{prompt.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/40x40/6366f1/ffffff?text=DG' }} 
            style={styles.logo} 
          />
          <View>
            <Text style={styles.headerTitle}>DataGuru AI</Text>
            <Text style={styles.headerSubtitle}>AI Assistant</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {renderWelcomePrompts()}
          {messages.map(renderMessage)}
          
          {isTyping && (
            <View style={[styles.messageContainer, styles.assistantMessage]}>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <ActivityIndicator size="small" color="#6366f1" />
                <Text style={styles.typingText}>DataGuru is typing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          {attachments.length > 0 && (
            <ScrollView horizontal style={styles.attachmentsContainer}>
              {attachments.map((attachment) => (
                <View key={attachment.id} style={styles.attachmentPreview}>
                  <Text style={styles.attachmentName}>{attachment.name}</Text>
                  <TouchableOpacity 
                    onPress={() => setAttachments(prev => prev.filter(a => a.id !== attachment.id))}
                  >
                    <Ionicons name="close-circle" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          
          <View style={styles.inputRow}>
            <TouchableOpacity 
              style={styles.attachmentButton}
              onPress={handleAttachment}
            >
              <Ionicons name="attach" size={20} color="#6b7280" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Type your message..."
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={1000}
              editable={!isTyping}
            />
            
            <TouchableOpacity 
              style={[styles.voiceButton, isRecording && styles.recordingButton]}
              onPress={handleVoiceToggle}
            >
              <Ionicons 
                name={isRecording ? "mic-off" : "mic"} 
                size={20} 
                color={isRecording ? "#ef4444" : "#6b7280"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sendButton, (!inputValue.trim() && attachments.length === 0) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={isTyping || (!inputValue.trim() && attachments.length === 0)}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  headerButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  welcomeContainer: {
    paddingVertical: 32,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  promptsGrid: {
    gap: 12,
  },
  promptCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  promptDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userTime: {
    color: '#e0e7ff',
  },
  assistantTime: {
    color: '#6b7280',
  },
  typingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  attachmentsContainer: {
    marginBottom: 12,
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  attachmentName: {
    fontSize: 12,
    color: '#374151',
    marginRight: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachmentButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#ffffff',
  },
  voiceButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
  },
  recordingButton: {
    backgroundColor: '#fee2e2',
  },
  sendButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
});
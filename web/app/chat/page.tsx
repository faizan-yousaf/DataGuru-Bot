'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  Send, Paperclip, Mic, MicOff, Link, Upload, X, Copy, 
  ThumbsUp, ThumbsDown, Share2, RefreshCw, Loader2, 
  Brain, Sparkles, Image as ImageIcon, FileText, ArrowRight,
  Zap, Database, Bot, TrendingUp
} from 'lucide-react';
import ReactMarkdown, { Components } from 'react-markdown';
import { SYSTEM_PROMPT } from '@/data/prompt';


// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  attachments?: MessageAttachment[];
  reactions?: MessageReactions;
}

interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'audio' | 'link';
  url: string;
  name: string;
  size?: number;
}

interface MessageReactions {
  likes: number;
  dislikes: number;
  userLiked: boolean;
  userDisliked: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  error: string | null;
}

interface ImageProcessingState {
  isProcessing: boolean;
  extractedText: string | null;
  error: string | null;
}

interface SuggestedPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>; // Fixed: Replace 'any' with proper type
  category: 'rag' | 'agentic' | 'neural' | 'advanced';
}


// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const WELCOME_PROMPTS: SuggestedPrompt[] = [
  {
    id: '1',
    title: 'Implementing RAG Systems',
    description: 'Learn about Retrieval-Augmented Generation architecture',
    prompt: 'Explain how to implement a RAG (Retrieval-Augmented Generation) system for document Q&A. Include the key components, vector databases, and best practices.',
    icon: Database,
    category: 'rag'
  },
  {
    id: '2', 
    title: 'Understanding Agentic AI',
    description: 'Explore autonomous AI agents and their capabilities',
    prompt: 'What is Agentic AI and how does it differ from traditional AI? Explain the key components of AI agents and their real-world applications.',
    icon: Bot,
    category: 'agentic'
  },
  {
    id: '3',
    title: 'Neural Network Architectures',
    description: 'Deep dive into modern neural network designs',
    prompt: 'Compare different neural network architectures like Transformers, CNNs, and RNNs. When should I use each one for different types of problems?',
    icon: Brain,
    category: 'neural'
  },
  {
    id: '4',
    title: 'Latest AI Trends 2024',
    description: 'Discover cutting-edge developments in AI',
    prompt: 'What are the most significant AI breakthroughs and trends in 2024? Focus on practical applications in data science and machine learning.',
    icon: TrendingUp,
    category: 'advanced'
  }
];

const generateRelatedPrompts = (userQuery: string): SuggestedPrompt[] => {
  const query = userQuery.toLowerCase();
  
  const relatedPrompts: SuggestedPrompt[] = [];
  
  if (query.includes('rag') || query.includes('retrieval') || query.includes('vector')) {
    relatedPrompts.push(
      {
        id: 'r1',
        title: 'Vector Database Optimization',
        description: 'Improve RAG performance with better embeddings',
        prompt: 'How can I optimize vector database performance for RAG systems? What are the best embedding models and indexing strategies?',
        icon: Database,
        category: 'rag'
      },
      {
        id: 'r2',
        title: 'RAG Evaluation Metrics',
        description: 'Measure and improve RAG system quality',
        prompt: 'What metrics should I use to evaluate RAG system performance? How do I measure retrieval accuracy and generation quality?',
        icon: TrendingUp,
        category: 'rag'
      }
    );
  }
  
  if (query.includes('neural') || query.includes('network') || query.includes('deep learning')) {
    relatedPrompts.push(
      {
        id: 'r3',
        title: 'Transfer Learning Strategies',
        description: 'Leverage pre-trained models effectively',
        prompt: 'What are the best practices for transfer learning with neural networks? How do I fine-tune pre-trained models for my specific use case?',
        icon: Brain,
        category: 'neural'
      },
      {
        id: 'r4',
        title: 'Neural Architecture Search',
        description: 'Automate neural network design',
        prompt: 'How does Neural Architecture Search (NAS) work? Can you explain different NAS methods and when to use them?',
        icon: Zap,
        category: 'neural'
      }
    );
  }
  
  if (query.includes('agent') || query.includes('autonomous') || query.includes('llm')) {
    relatedPrompts.push(
      {
        id: 'r5',
        title: 'Multi-Agent Systems',
        description: 'Coordinate multiple AI agents',
        prompt: 'How do I design and implement multi-agent systems? What are the communication patterns and coordination strategies?',
        icon: Bot,
        category: 'agentic'
      },
      {
        id: 'r6',
        title: 'Agent Tool Integration',
        description: 'Connect agents with external tools',
        prompt: 'How can I integrate external tools and APIs with AI agents? What are the best practices for tool calling and function execution?',
        icon: Zap,
        category: 'agentic'
      }
    );
  }
  
  // Default suggestions if no specific matches
  if (relatedPrompts.length === 0) {
    relatedPrompts.push(
      {
        id: 'r7',
        title: 'Data Preprocessing Best Practices',
        description: 'Clean and prepare data for ML models',
        prompt: 'What are the essential data preprocessing steps for machine learning? How do I handle missing data, outliers, and feature scaling?',
        icon: Database,
        category: 'advanced'
      },
      {
        id: 'r8',
        title: 'Model Deployment Strategies',
        description: 'Deploy ML models to production',
        prompt: 'What are the best practices for deploying machine learning models to production? How do I handle model versioning and monitoring?',
        icon: TrendingUp,
        category: 'advanced'
      }
    );
  }
  
  return relatedPrompts.slice(0, 3); // Return max 3 suggestions
};

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

// =============================================================================
// CUSTOM HOOKS
// =============================================================================

const useGeminiChat = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isTyping: false,
    error: null
  });

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  const model = genAI?.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const sendMessage = useCallback(async (content: string, attachments: MessageAttachment[] = [], extractedText?: string) => {
    if (!model) {
      setState(prev => ({ ...prev, error: 'API key not configured' }));
      return;
    }

    // If there's extracted text from an image, prepend it to the content
    let finalContent = content;
    if (extractedText) {
      finalContent = `I uploaded an image containing code/error content. Here's what was extracted:

\`\`\`
${extractedText}
\`\`\`

Please help me analyze this: ${content || 'Please analyze this code/error and provide solutions'}`;
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      content: finalContent,
      role: 'user',
      timestamp: Date.now(),
      attachments
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true,
      error: null
    }));



    try {
      // Create conversation history with system prompt
      const conversationHistory = [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Understood! I am DataGuru, your specialized Data Science AI assistant. I will validate the scope of all queries and respond only to data science, ML, AI, and related technical topics. I\'m ready to help with a friendly mentor approach unless you specify a different tone. What would you like to work on?' }] }
      ];

      // Add previous messages to history (last 10 to avoid token limits)
      const recentMessages = state.messages.slice(-10);
      recentMessages.forEach(msg => {
        conversationHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });

      // Add current message
      conversationHistory.push({
        role: 'user',
        parts: [{ text: content }]
      });

      // Start chat with history
      const chat = model.startChat({
        history: conversationHistory.slice(0, -1), // All except the last message
      });

      const result = await chat.sendMessage(content);
      const response = await result.response;
      const text = response.text();

      const assistantMessage: ChatMessage = {
        id: generateId(),
        content: text,
        role: 'assistant',
        timestamp: Date.now(),
        reactions: { likes: 0, dislikes: 0, userLiked: false, userDisliked: false }
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isTyping: false
      }));
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        content: 'I apologize, but I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: Date.now(),
        reactions: { likes: 0, dislikes: 0, userLiked: false, userDisliked: false }
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isTyping: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  }, [model, state.messages]); // Add state.messages to dependencies

  const updateReaction = useCallback((messageId: string, type: 'like' | 'dislike') => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(message => {
        if (message.id !== messageId || !message.reactions) return message;

        const reactions = { ...message.reactions };
        
        if (type === 'like') {
          if (reactions.userLiked) {
            reactions.likes--;
            reactions.userLiked = false;
          } else {
            reactions.likes++;
            reactions.userLiked = true;
            if (reactions.userDisliked) {
              reactions.dislikes--;
              reactions.userDisliked = false;
            }
          }
        } else {
          if (reactions.userDisliked) {
            reactions.dislikes--;
            reactions.userDisliked = false;
          } else {
            reactions.dislikes++;
            reactions.userDisliked = true;
            if (reactions.userLiked) {
              reactions.likes--;
              reactions.userLiked = false;
            }
          }
        }

        return { ...message, reactions };
      })
    }));
  }, []);

  const regenerateMessage = useCallback(async (messageId: string) => {
    const messageIndex = state.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;

    const previousMessage = state.messages[messageIndex - 1];
    if (previousMessage.role !== 'user') return;

    setState(prev => ({ ...prev, isTyping: true }));

    try {
      if (!model) throw new Error('API key not configured');
      
      // Create conversation history for regeneration
      const conversationHistory = [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Understood! I am DataGuru, your specialized Data Science AI assistant. I will validate the scope of all queries and respond only to data science, ML, AI, and related technical topics. I\'m ready to help with a friendly mentor approach unless you specify a different tone. What would you like to work on?' }] }
      ];

      // Add messages up to the one being regenerated
      const messagesUpToRegenerate = state.messages.slice(0, messageIndex);
      messagesUpToRegenerate.forEach(msg => {
        conversationHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });

      const chat = model.startChat({
        history: conversationHistory,
      });

      const result = await chat.sendMessage(previousMessage.content);
      const response = result.response;
      const text = response.text();

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(message =>
          message.id === messageId
            ? { ...message, content: text, timestamp: Date.now() }
            : message
        ),
        isTyping: false
      }));
    } catch {
      setState(prev => ({ ...prev, isTyping: false }));
    }
  }, [state.messages, model]);

  return {
    messages: state.messages,
    isTyping: state.isTyping,
    error: state.error,
    sendMessage,
    updateReaction,
    regenerateMessage,
    isConfigured: !!apiKey
  };
};

const useAssemblyAIVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus' // Better compression
      });
      
      setMediaRecorder(recorder);
      setIsRecording(true);
      recorder.start();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, []);

  const stopRecordingAndTranscribe = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorder) {
        resolve(null);
        return;
      }

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          setIsTranscribing(true);
          
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
          
          // Send to AssemblyAI for transcription
          const formData = new FormData();
          formData.append('audio', audioFile);
          
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Transcription failed');
          }
          
          const result = await response.json();
          resolve(result.text || null);
          
        } catch (error) {
          console.error('Transcription error:', error);
          resolve(null);
        } finally {
          setIsTranscribing(false);
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          setMediaRecorder(null);
        }
      };

      mediaRecorder.stop();
    });
  }, [mediaRecorder]);

  return { 
    isRecording, 
    isTranscribing, 
    startRecording, 
    stopRecordingAndTranscribe 
  };
};

const useClickOutside = (callback: () => void) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [callback]);

  return ref;
};

// =============================================================================
// UI COMPONENTS
// =============================================================================

const WelcomeScreen: React.FC<{
  onPromptSelect: (prompt: string) => void;
}> = ({ onPromptSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <Brain className="w-16 h-16 text-blue-500" />
            <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-blue-600">DataGuru</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Your AI-powered data science assistant. Explore the latest in AI, machine learning, 
          and data science with expert guidance and cutting-edge insights.
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-4xl"
      >
        <h2 className="text-2xl font-semibold text-gray-800 mb-8 text-center">
          Explore Latest AI Technologies
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {WELCOME_PROMPTS.map((prompt, index) => {
            const Icon = prompt.icon;
            return (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="group cursor-pointer"
                onClick={() => onPromptSelect(prompt.prompt)}
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {prompt.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-3">
                        {prompt.description}
                      </p>
                      <div className="flex items-center text-blue-500 text-sm font-medium group-hover:text-blue-600">
                        <span>Explore this topic</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

const RelatedPrompts: React.FC<{
  prompts: SuggestedPrompt[];
  onPromptSelect: (prompt: string) => void;
}> = ({ prompts, onPromptSelect }) => {
  if (prompts.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100"
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-500" />
        Related Topics You Might Find Interesting
      </h3>
      <div className="space-y-2">
        {prompts.map((prompt) => {
          const Icon = prompt.icon;
          return (
            <motion.button
              key={prompt.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onPromptSelect(prompt.prompt)}
              className="w-full text-left p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                    {prompt.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {prompt.description}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

const InlineCode: React.FC<{ children: string }> = ({ children }) => (
  <code className="bg-gray-800 text-green-400 px-2 py-1 rounded-md text-sm font-mono border border-gray-700 mx-1 shadow-sm">
    {children}
  </code>
);


const Button: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  className = '',
  onClick 
}) => {
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    ghost: 'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-lg',
    icon: 'h-10 w-10'
  };

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};

const Input: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}> = ({ value, onChange, placeholder, disabled, className = '', onKeyDown }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    onKeyDown={onKeyDown}
    className={`
      w-full px-4 py-3 bg-white border border-gray-200 rounded-xl
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      placeholder-gray-500 transition-all duration-200
      disabled:bg-gray-50 disabled:cursor-not-allowed
      ${className}
    `}
  />
);

const AttachmentPreview: React.FC<{
  attachment: MessageAttachment;
  onRemove: () => void;
}> = ({ attachment, onRemove }) => {
  const getIcon = () => {
    switch (attachment.type) {
      case 'image': return <ImageIcon className="w-4 h-4 text-blue-500" />;
      case 'audio': return <Mic className="w-4 h-4 text-green-500" />;
      case 'link': return <Link className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
        {attachment.size && (
          <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove} className="h-6 w-6">
        <X className="w-3 h-3" />
      </Button>
    </motion.div>
  );
};

const AttachmentMenu: React.FC<{
  onFileSelect: (file: File) => void;
  onLinkAdd: () => void;
  onClose: () => void;
}> = ({ onFileSelect, onLinkAdd, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
      onClose();
    }
  };

  const menuItems = [
    {
      icon: Upload,
      label: 'Upload File',
      action: () => fileInputRef.current?.click()
    },
    {
      icon: Link,
      label: 'Add Link',
      action: onLinkAdd
    }
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute bottom-full mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 min-w-48 z-50"
      >
        {menuItems.map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
          >
            <Icon className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </button>
        ))}
      </motion.div>
      
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="*/*"
      />
    </>
  );
};

const ChatMessage: React.FC<{
  message: ChatMessage;
  onAction: (action: string, messageId: string) => void;
}> = ({ message, onAction }) => {
  const isUser = message.role === 'user';
  
  const components: Components = {
    code: ({ inline, className, children, ...props }: any) => {
      if (inline) {
        return (
          <code className="bg-gray-800 text-green-400 px-2 py-1 rounded-md text-sm font-mono border border-gray-700 mx-1 shadow-sm">
            {String(children)}
          </code>
        );
      }
      
      // Extract language from className (e.g., "language-javascript")
      const language = className?.replace('language-', '') || 'text';
      
      return (
        <div className="my-6 rounded-xl overflow-hidden shadow-lg border border-gray-700">
          {/* Code block header */}
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-gray-400 text-sm font-medium ml-2">
                {language.toUpperCase()}
              </span>
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(String(children))}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
              title="Copy code"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          
          {/* Code content */}
        <pre className="bg-gray-900 text-black p-4 overflow-x-auto" {...props}>
          <code className={`${className} block text-sm leading-relaxed`}>
            {children}
          </code>
        </pre>
        </div>
      );
    },
    
    // Enhanced blockquote styling
    blockquote: ({ children, ...props }) => (
      <blockquote 
        className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-2 my-4 italic text-gray-700 rounded-r-lg"
        {...props}
      >
        {children}
      </blockquote>
    ),
    
    // Enhanced heading styles
    h1: ({ children, ...props }) => (
      <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4 pb-2 border-b border-gray-200" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-xl font-semibold text-gray-800 mt-5 mb-3" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2" {...props}>
        {children}
      </h3>
    ),
    
    // Enhanced list styling
    ul: ({ children, ...props }) => (
      <ul className="list-disc list-inside space-y-1 my-3 text-gray-700" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal list-inside space-y-1 my-3 text-gray-700" {...props}>
        {children}
      </ol>
    ),
    
    // Enhanced table styling
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden" {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th className="bg-gray-100 border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border border-gray-300 px-4 py-2 text-gray-700" {...props}>
        {children}
      </td>
    ),
    
    // Enhanced paragraph styling
    p: ({ children, ...props }) => (
      <p className="text-gray-700 leading-relaxed my-2" {...props}>
        {children}
      </p>
    ),
    
    // Enhanced link styling
    a: ({ children, href, ...props }) => (
      <a 
        href={href} 
        className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-500 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    
    // Enhanced strong/bold styling
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-gray-900" {...props}>
        {children}
      </strong>
    ),
    
    // Enhanced emphasis/italic styling
    em: ({ children, ...props }) => (
      <em className="italic text-gray-800" {...props}>
        {children}
      </em>
    )
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
    >
      <div className={`max-w-3xl px-6 py-4 rounded-2xl ${
        isUser 
          ? 'bg-blue-600 text-white ml-12' 
          : 'bg-white text-gray-900 mr-12 shadow-lg border border-gray-200'
      }`}>
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-3 space-y-2">
            {message.attachments.map(attachment => (
              <div key={attachment.id} className="flex items-center gap-2 text-sm opacity-80">
                {attachment.type === 'image' && <ImageIcon className="w-4 h-4" />}
                {attachment.type === 'link' && <Link className="w-4 h-4" />}
                {attachment.type === 'document' && <FileText className="w-4 h-4" />}
                <span>{attachment.name}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown components={components}>
            {message.content}
          </ReactMarkdown>
        </div>
        
        {!isUser && (
          <MessageActions message={message} onAction={onAction} />
        )}
      </div>
    </motion.div>
  );
};

const MessageActions: React.FC<{
  message: ChatMessage;
  onAction: (action: string, messageId: string) => void;
}> = ({ message, onAction }) => {
  const actions = [
    { icon: Copy, key: 'copy', label: 'Copy' },
    { 
      icon: ThumbsUp, 
      key: 'like', 
      label: 'Like',
      active: message.reactions?.userLiked,
      count: message.reactions?.likes
    },
    { 
      icon: ThumbsDown, 
      key: 'dislike', 
      label: 'Dislike',
      active: message.reactions?.userDisliked,
      count: message.reactions?.dislikes
    },
    { icon: Share2, key: 'share', label: 'Share' },
    { icon: RefreshCw, key: 'regenerate', label: 'Regenerate' }
  ];

  return (
    <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
      {actions.map(({ icon: Icon, key, active, count }) => (
        <Button
          key={key}
          variant="ghost"
          size="icon"
          onClick={() => onAction(key, message.id)}
          className={`h-7 w-7 ${active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <div className="flex items-center gap-1">
            <Icon className="w-3 h-3" />
            {count !== undefined && count > 0 && (
              <span className="text-xs">{count}</span>
            )}
          </div>
        </Button>
      ))}
    </div>
  );
};

const ConfigurationError: React.FC = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-lg border border-gray-200">
      <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration Required</h2>
      <p className="text-gray-600">Please set your GEMINI_API_KEY environment variable to continue.</p>
    </div>
  </div>
);

// =============================================================================
// MAIN CHAT COMPONENT
// =============================================================================

const ChatApplication: React.FC<{}> = () => {
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [relatedPrompts, setRelatedPrompts] = useState<SuggestedPrompt[]>([]);
  
  // Add image processing state
  const [imageProcessing, setImageProcessing] = useState<ImageProcessingState>({
    isProcessing: false,
    extractedText: null,
    error: null
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useClickOutside(() => setShowAttachmentMenu(false));

  const { messages, isTyping, sendMessage, updateReaction, regenerateMessage, isConfigured } = useGeminiChat();
  const { isRecording, isTranscribing, startRecording, stopRecordingAndTranscribe } = useAssemblyAIVoiceRecorder();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Add function to process image through Hugging Face
  const processImageForText = useCallback(async (file: File): Promise<string | null> => {
    setImageProcessing(prev => ({ ...prev, isProcessing: true, error: null }));
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setImageProcessing(prev => ({
          ...prev,
          isProcessing: false,
          extractedText: data.extractedText,
          error: null
        }));
        return data.extractedText;
      } else {
        setImageProcessing(prev => ({
          ...prev,
          isProcessing: false,
          error: data.error || 'Failed to extract text from image'
        }));
        return null;
      }
    } catch (error) {
      setImageProcessing(prev => ({
        ...prev,
        isProcessing: false,
        error: 'Network error occurred while processing image'
      }));
      return null;
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    let extractedText: string | null = null;
    
    // Check if there are any image attachments to process
    const imageAttachments = attachments.filter(att => att.type === 'image');
    
    if (imageAttachments.length > 0) {
      // Process the first image attachment for text extraction
      const imageFile = await fetch(imageAttachments[0].url).then(r => r.blob());
      const file = new File([imageFile], imageAttachments[0].name, { type: 'image/*' });
      extractedText = await processImageForText(file);
      
      if (!extractedText && imageProcessing.error) {
        // If image processing failed, show error and don't send message
        return;
      }
    }

    const messageContent = inputValue.trim() || (extractedText ? 'Please analyze this image content' : 'Shared attachments');
    await sendMessage(messageContent, attachments, extractedText || undefined);
    
    // Generate related prompts based on user query
    if (messageContent !== 'Shared attachments') {
      const related = generateRelatedPrompts(messageContent);
      setRelatedPrompts(related);
    }
    
    setInputValue('');
    setAttachments([]);
    setImageProcessing({ isProcessing: false, extractedText: null, error: null });
  }, [inputValue, attachments, sendMessage, processImageForText, imageProcessing.error]);
  
  const handlePromptSelect = useCallback((prompt: string) => {
    setInputValue(prompt);
    // Auto-send the selected prompt
    setTimeout(() => {
      sendMessage(prompt, []);
      const related = generateRelatedPrompts(prompt);
      setRelatedPrompts(related);
    }, 100);
  }, [sendMessage]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleFileSelect = useCallback((file: File) => {
    const attachment: MessageAttachment = {
      id: generateId(),
      type: file.type.startsWith('image/') ? 'image' : 
            file.type.startsWith('audio/') ? 'audio' : 'document',
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    };
    setAttachments(prev => [...prev, attachment]);
    
    // Reset image processing state when new file is selected
    if (file.type.startsWith('image/')) {
      setImageProcessing({ isProcessing: false, extractedText: null, error: null });
    }
  }, []);

  const handleLinkSubmit = useCallback(() => {
    if (!linkInput.trim() || !isValidUrl(linkInput)) return;

    const linkAttachment: MessageAttachment = {
      id: generateId(),
      type: 'link',
      url: linkInput,
      name: linkInput
    };
    
    setAttachments(prev => [...prev, linkAttachment]);
    setLinkInput('');
    setShowLinkInput(false);
  }, [linkInput]);

  const handleVoiceToggle = useCallback(async () => {
    if (isRecording) {
      const transcribedText = await stopRecordingAndTranscribe();
      if (transcribedText) {
        // Directly send the transcribed text to the chat
        setInputValue(transcribedText);
        // Optionally auto-send the message
        // handleSendMessage(transcribedText);
      }
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecordingAndTranscribe]);

  const handleMessageAction = useCallback(async (action: string, messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    switch (action) {
      case 'copy':
        await navigator.clipboard.writeText(message.content);
        break;
      case 'like':
        updateReaction(messageId, 'like');
        break;
      case 'dislike':
        updateReaction(messageId, 'dislike');
        break;
      case 'share':
        if (navigator.share) {
          await navigator.share({ title: 'AI Chat', text: message.content });
        } else {
          await navigator.clipboard.writeText(message.content);
        }
        break;
      case 'regenerate':
        await regenerateMessage(messageId);
        break;
    }
  }, [messages, updateReaction, regenerateMessage]);

  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  }, []);

  if (!isConfigured) {
    return <ConfigurationError />;
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-blue-500" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">DataGuru Chat</h1>
            <p className="text-sm text-gray-500">Your AI Data Science Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-medium text-gray-600">AI Powered</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <WelcomeScreen onPromptSelect={handlePromptSelect} />
          ) : (
            <>
              <AnimatePresence>
                {messages.map(message => (
                  <ChatMessage
                    key={message.id} 
                    message={message} 
                    onAction={handleMessageAction} 
                  />
                ))}
              </AnimatePresence>
              
              {isTyping && (
                <div className="flex items-center gap-2 p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              )}
              
              {/* Add image processing status */}
              {imageProcessing.isProcessing && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-blue-700">Processing image with Idefics2 for code/error extraction...</span>
                </div>
              )}

              {imageProcessing.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <X className="w-5 h-5 text-red-500" />
                  <span className="text-red-700">{imageProcessing.error}</span>
                </div>
              )}

              {imageProcessing.extractedText && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <ImageIcon className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-green-700">Code/Error extracted from image:</span>
                  </div>
                  <pre className="text-sm text-gray-700 bg-white p-2 rounded border overflow-x-auto">
                    {imageProcessing.extractedText}
                  </pre>
                </div>
              )}
              
              {/* Show related prompts after the last assistant message */}
              {messages.length > 0 && 
               messages[messages.length - 1].role === 'assistant' && 
               !isTyping && (
                <RelatedPrompts 
                  prompts={relatedPrompts} 
                  onPromptSelect={handlePromptSelect} 
                />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 space-y-2"
              >
                {attachments.map(attachment => (
                  <AttachmentPreview
                    key={attachment.id}
                    attachment={attachment}
                    onRemove={() => removeAttachment(attachment.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {showLinkInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 flex gap-2"
              >
                <Input
                  value={linkInput}
                  onChange={setLinkInput}
                  placeholder="Enter URL..."
                  onKeyDown={(e) => e.key === 'Enter' && handleLinkSubmit()}
                />
                <Button onClick={handleLinkSubmit} disabled={!linkInput.trim()}>
                  Add
                </Button>
                <Button variant="secondary" onClick={() => setShowLinkInput(false)}>
                  Cancel
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-end gap-3">
            <div className="relative" ref={attachmentMenuRef}>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              <AnimatePresence>
                {showAttachmentMenu && (
                  <AttachmentMenu
                    onFileSelect={handleFileSelect}
                    onLinkAdd={() => {
                      setShowLinkInput(true);
                      setShowAttachmentMenu(false);
                    }}
                    onClose={() => setShowAttachmentMenu(false)}
                  />
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex-1">
              <Input
                value={inputValue}
                onChange={setInputValue}
                placeholder="Type your message..."
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />
            </div>
            
            <Button
              variant={isRecording ? 'danger' : 'secondary'}
              size="icon"
              onClick={handleVoiceToggle}
              className={isRecording || isTranscribing ? 'animate-pulse' : ''}
              disabled={isTranscribing}
            >
              {isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              onClick={handleSendMessage}
              disabled={isTyping || imageProcessing.isProcessing || (!inputValue.trim() && attachments.length === 0)}
              className="shadow-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatApplication;

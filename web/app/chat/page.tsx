"use client"
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  Send, Paperclip, Mic, MicOff, Link, Upload, X, Copy, 
  ThumbsUp, ThumbsDown, Share2, RefreshCw, Loader2, 
  Brain, Sparkles, Image as ImageIcon, FileText
} from 'lucide-react';

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

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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

  const sendMessage = useCallback(async (content: string, attachments: MessageAttachment[] = []) => {
    if (!model) {
      setState(prev => ({ ...prev, error: 'API key not configured' }));
      return;
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      content,
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
      const result = await model.generateContent(content);
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
  }, [model]);

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
      
      const result = await model.generateContent(previousMessage.content);
      const response = await result.response;
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
    } catch (error) {
      setState(prev => ({ ...prev, isTyping: false }));
    }
  }, [state.messages, model]);

  return {
    ...state,
    sendMessage,
    updateReaction,
    regenerateMessage,
    isConfigured: !!apiKey
  };
};

const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      setMediaRecorder(recorder);
      setIsRecording(true);
      recorder.start();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, []);

  const stopRecording = useCallback((): Promise<File | null> => {
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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.wav`, { type: 'audio/wav' });
        resolve(audioFile);
        
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setMediaRecorder(null);
      };

      mediaRecorder.stop();
    });
  }, [mediaRecorder]);

  return { isRecording, startRecording, stopRecording };
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

const MessageBubble: React.FC<{
  message: ChatMessage;
  onAction: (action: string, messageId: string) => void;
}> = ({ message, onAction }) => {
  const isUser = message.role === 'user';

  const renderAttachment = (attachment: MessageAttachment) => {
    switch (attachment.type) {
      case 'image':
        return (
          <img 
            src={attachment.url} 
            alt={attachment.name}
            className="max-w-sm rounded-lg border border-gray-200 mt-2"
          />
        );
      case 'link':
        return (
          <a 
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <Link className="w-3 h-3" />
            <span className="text-sm underline">{attachment.name}</span>
          </a>
        );
      default:
        return (
          <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-lg">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">{attachment.name}</span>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
    >
      <div className={`
        max-w-[75%] p-4 rounded-2xl shadow-sm
        ${isUser 
          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white ml-12' 
          : 'bg-white border border-gray-200 mr-12'
        }
      `}>
        <div className="whitespace-pre-wrap leading-relaxed text-sm">
          {message.content}
        </div>
        
        {message.attachments?.map((attachment) => (
          <div key={attachment.id}>
            {renderAttachment(attachment)}
          </div>
        ))}
        
        {!isUser && (
          <MessageActions message={message} onAction={onAction} />
        )}
      </div>
    </motion.div>
  );
};

const ChatHeader: React.FC = () => (
  <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
        <Brain className="w-5 h-5 text-white" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Powered by Gemini
        </p>
      </div>
    </div>
  </header>
);

const LoadingIndicator: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex justify-start"
  >
    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mr-12">
      <div className="flex items-center gap-3 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Thinking...</span>
      </div>
    </div>
  </motion.div>
);

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

const ChatApplication: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInput, setLinkInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useClickOutside(() => setShowAttachmentMenu(false));

  const { messages, isTyping, sendMessage, updateReaction, regenerateMessage, isConfigured } = useGeminiChat();
  const { isRecording, startRecording, stopRecording } = useVoiceRecorder();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    await sendMessage(inputValue.trim() || 'Shared attachments', attachments);
    setInputValue('');
    setAttachments([]);
  }, [inputValue, attachments, sendMessage]);

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
      const audioFile = await stopRecording();
      if (audioFile) {
        handleFileSelect(audioFile);
      }
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording, handleFileSelect]);

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
      <ChatHeader />
      
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence>
            {messages.map(message => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                onAction={handleMessageAction} 
              />
            ))}
          </AnimatePresence>
          
          {isTyping && <LoadingIndicator />}
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
              className={isRecording ? 'animate-pulse' : ''}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            
            <Button
              onClick={handleSendMessage}
              disabled={isTyping || (!inputValue.trim() && attachments.length === 0)}
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
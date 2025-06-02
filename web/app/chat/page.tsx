'use client';

// First install the package:
// npm install @google/generative-ai
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  RefreshCw,
  Paperclip,
  Link,
  Mic,
  Send,
  Brain,
  Upload,
  MicOff
} from 'lucide-react';

// Message type definition
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  attachments?: AttachmentProp[];
  likes?: number;
  dislikes?: number;
  isLiked?: boolean;
  isDisliked?: boolean;
}

interface AttachmentProp {
  type: 'image' | 'code' | 'voice' | 'document' | 'link';
  url: string;
  preview?: string;
  name?: string;
  mimeType?: string;
}

// Button component props interface
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'ghost' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'icon';
  className?: string;
}

// Input component props interface
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

// Card component props interface
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

// Custom components
const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'default', 
  size = 'default', 
  className = '', 
  onClick, 
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantClasses = {
    default: 'bg-black text-white hover:bg-gray-800',
    ghost: 'hover:bg-gray-100 hover:text-gray-900',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  };

  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-sm',
    icon: 'h-10 w-10'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Input: React.FC<InputProps> = ({ className = '', ...props }) => (
  <input
    className={`border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 ${className}`}
    {...props}
  />
);

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`rounded-lg border p-4 ${className}`} {...props}>
    {children}
  </div>
);

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => (
  <div className="prose max-w-none whitespace-pre-wrap">
    {content}
  </div>
);

// Chat component
export default function ChatPage() {
  // State declarations
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [webLink, setWebLink] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini with safety check
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Effect for scrolling to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect for handling clicks outside attachment menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add this function to validate API key
  const isValidApiKey = () => {
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY && process.env.NEXT_PUBLIC_GEMINI_API_KEY.length > 0;
  };

  // Update the message handling
  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedFile && !webLink) return;

    setIsLoading(true);
    const messageId = Date.now().toString();
    const userMessage: Message = {
      id: messageId,
      content: inputMessage.trim() || 'Shared an attachment',
      sender: 'user',
      timestamp: new Date(),
      attachments: [],
    };

    // Add attachments if any
    if (selectedFile) {
      const fileType = selectedFile.type.startsWith('image/') ? 'image' : 
                    selectedFile.type.startsWith('audio/') ? 'voice' :
                    'document';
      userMessage.attachments?.push({
        type: fileType,
        url: URL.createObjectURL(selectedFile),
        name: selectedFile.name,
        mimeType: selectedFile.type
      });
    }

    if (webLink) {
      userMessage.attachments?.push({
        type: 'link',
        url: webLink,
        preview: webLink,
      });
    }

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    
    // Clear inputs
    setInputMessage('');
    setSelectedFile(null);
    setWebLink('');
    setShowAttachmentMenu(false);
    setShowLinkInput(false);

    try {
      // Validate API key first
      if (!isValidApiKey()) {
        throw new Error('Invalid or missing API key');
      }

      // Generate response using Gemini with proper error handling
      const result = await model.generateContent(userMessage.content);
      if (!result) {
        throw new Error('No response from Gemini API');
      }

      const response = await result.response;
      if (!response) {
        throw new Error('Empty response from Gemini API');
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Empty text from Gemini API');
      }
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: text,
        sender: 'ai',
        timestamp: new Date(),
        likes: 0,
        dislikes: 0,
        isLiked: false,
        isDisliked: false,
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error details:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}. Please try again.`,
        sender: 'ai',
        timestamp: new Date(),
        likes: 0,
        dislikes: 0,
        isLiked: false,
        isDisliked: false,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleLike = (messageId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          likes: (msg.likes || 0) + (msg.isLiked ? -1 : 1),
          isLiked: !msg.isLiked,
          isDisliked: false,
          dislikes: msg.isDisliked ? (msg.dislikes || 0) - 1 : msg.dislikes,
        };
      }
      return msg;
    }));
  };

  const handleDislike = (messageId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          dislikes: (msg.dislikes || 0) + (msg.isDisliked ? -1 : 1),
          isDisliked: !msg.isDisliked,
          isLiked: false,
          likes: msg.isLiked ? (msg.likes || 0) - 1 : msg.likes,
        };
      }
      return msg;
    }));
  };

  const handleShare = async (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Shared from Data Guru',
            text: message.content,
          });
        } else {
          // Fallback to clipboard
          await handleCopy(message.content);
        }
      } catch (error) {
        console.error('Error sharing message:', error);
      }
    }
  };

  // Fix for handleRegenerate function
  const handleRegenerate = async (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message && message.sender === 'ai') {
      setIsLoading(true);
      try {
        const userMessageIndex = messages.findIndex(msg => msg.id === messageId) - 1;
        const userMessage = messages[userMessageIndex];
        
        if (!userMessage) {
          throw new Error('Could not find the original user message');
        }
        
        const result = await model.generateContent(userMessage.content);
        const response = await result.response;
        const text = await response.text();
        
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              content: text,
              timestamp: new Date(),
            };
          }
          return msg;
        }));
      } catch (error) {
        console.error('Error regenerating response:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        setSelectedFile(new File([audioBlob], 'voice-message.wav', { type: 'audio/wav' }));
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setShowAttachmentMenu(false);
    }
  };

  const handleLinkSubmit = () => {
    if (webLink.trim()) {
      setShowLinkInput(false);
      setShowAttachmentMenu(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setWebLink(text);
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  const renderAttachment = (attachment: AttachmentProp) => {
    switch (attachment.type) {
      case 'image':
        return (
          <div className="mt-2">
            <img 
              src={attachment.url} 
              alt={attachment.name || 'Uploaded image'} 
              className="max-w-xs rounded-lg border"
            />
          </div>
        );
      case 'link':
        return (
          <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <a 
              href={attachment.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              {attachment.preview || attachment.url}
            </a>
          </div>
        );
      case 'document':
      case 'voice':
        return (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Paperclip className="h-4 w-4" />
              <span>{attachment.name}</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="bg-black text-white py-4 px-6 border-b border-yellow-400">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-black" />
          </div>
          <h1 className="text-xl font-bold">Data Guru Chat</h1>
        </div>
      </header>
      
      {/* Messages Container */}
      <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-[80%] p-4 ${message.sender === 'user' 
                  ? 'bg-black text-white border-yellow-400' 
                  : 'bg-white text-gray-800 border-gray-200'}`}
                >
                  <MarkdownRenderer content={message.content} />
                  
                  {/* Render attachments */}
                  {message.attachments?.map((attachment, index) => (
                    <div key={index}>
                      {renderAttachment(attachment)}
                    </div>
                  ))}
                  
                  {/* Message actions */}
                  {message.sender === 'ai' && (
                    <div className="flex items-center justify-end mt-3 space-x-2 opacity-70 hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCopy(message.content)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleLike(message.id)}
                        className={`h-8 w-8 p-0 ${message.isLiked ? 'text-yellow-400' : ''}`}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDislike(message.id)}
                        className={`h-8 w-8 p-0 ${message.isDisliked ? 'text-red-400' : ''}`}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleShare(message.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Share2 className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRegenerate(message.id)}
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <Card className="max-w-[80%] p-4 bg-white text-gray-800 border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  <span>Thinking...</span>
                </div>
              </Card>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        {/* File/Link preview */}
        {(selectedFile || webLink) && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg border flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {selectedFile && (
                <>
                  <Paperclip className="h-4 w-4" />
                  <span>{selectedFile.name}</span>
                </>
              )}
              {webLink && (
                <>
                  <Link className="h-4 w-4" />
                  <span>{webLink}</span>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedFile(null);
                setWebLink('');
              }}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        )}

        {/* Link input */}
        {showLinkInput && (
          <div className="mb-3 flex gap-2">
            <Input
              type="text"
              value={webLink}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebLink(e.target.value)}
              placeholder="Enter web link..."
              className="flex-1"
            />
            <Button onClick={handlePaste} variant="outline" size="sm">
              Paste
            </Button>
            <Button onClick={handleLinkSubmit} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              Add
            </Button>
            <Button 
              onClick={() => setShowLinkInput(false)} 
              variant="outline" 
              size="sm"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Main input */}
        <div className="flex items-center gap-2">
          {/* Attachment menu */}
          <div className="relative" ref={attachmentMenuRef}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="h-10 w-10"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            {showAttachmentMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full mb-2 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[160px] z-10"
              >
                <div className="p-1">
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowAttachmentMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-sm flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload File
                  </button>
                  <button
                    onClick={() => {
                      setShowLinkInput(true);
                      setShowAttachmentMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-sm flex items-center gap-2"
                  >
                    <Link className="h-4 w-4" />
                    Add Link
                  </button>
                </div>
              </motion.div>
            )}
          </div>
          
          <Input
            type="text"
            value={inputMessage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={isLoading}
          />
          
          <Button 
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? 'destructive' : 'outline'}
            size="icon"
            className="h-10 w-10"
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          
          <Button 
            onClick={handleSendMessage}
            disabled={isLoading || (!inputMessage.trim() && !selectedFile && !webLink)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black h-10 w-10"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="*/*"
      />
    </div>
  );
}
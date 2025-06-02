'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { FiCopy, FiThumbsUp, FiThumbsDown, FiShare2, FiRefreshCw } from 'react-icons/fi';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';


interface AttachmentProp {
  type: 'image' | 'code' | 'voice' | 'document' | 'link';
  url: string;
  preview?: string;
  name?: string;
  mimeType?: string;
}

// Message type definition
type Message = {
  id: any;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  attachments?: AttachmentProp[]
  likes?: number;
  dislikes?: number;
  isLiked?: boolean;
  isDisliked?: boolean;
};

export default function ChatPageWrapper() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <ChatPage />
    </GoogleOAuthProvider>
  );
}

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm Data Guru, your AI assistant for data science. How can I help you today?",
      sender: 'ai',
      timestamp: new Date(),
      likes: 0,
      dislikes: 0,
      isLiked: false,
      isDisliked: false,
    },
  ]);

  const OnMessage = (message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() || selectedFile || webLink) {
      setIsLoading(true);
      const messageId = Date.now().toString();
      const userMessage: Message = {
        id: messageId,
        content: inputMessage.trim(),
        sender: 'user',
        timestamp: new Date(),
        attachments: [],
      };

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('message', inputMessage.trim());
      
      if (selectedFile) {
        formData.append('file', selectedFile);
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
        formData.append('web_link', webLink);
        userMessage.attachments?.push({
          type: 'link',
          url: webLink,
          preview: webLink,
        });
      }

      OnMessage(userMessage);
      setInputMessage('');
      setSelectedFile(null);
      setWebLink('');
      setShowAttachmentMenu(false);

      try {
        const response = await fetch('http://localhost:8000/chat/message', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          sender: 'ai',
          timestamp: new Date(),
          likes: 0,
          dislikes: 0,
          isLiked: false,
          isDisliked: false,
        };
        OnMessage(aiResponse);
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleLike = (messageId: string) => {
    setMessages(messages.map(msg => {
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
    setMessages(messages.map(msg => {
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
        await navigator.share({
          title: 'Shared from Data Guru',
          text: message.content,
        });
      } catch (error) {
        console.error('Error sharing message:', error);
      }
    }
  };

  const handleRegenerate = async (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message && message.sender === 'ai') {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:8000/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: message.content }),
        });
        
        if (!response.ok) throw new Error('Failed to regenerate response');
        
        const data = await response.json();
        setMessages(messages.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              content: data.response,
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
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [webLink, setWebLink] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Voice recording functionality
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  // Initialize voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      recorder.ondataavailable = (e) => {
        setAudioChunks((chunks) => [...chunks, e.data]);
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setSelectedFile(new File([audioBlob], 'voice-message.wav', { type: 'audio/wav' }));
        setAudioChunks([]);
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
      // Stop all audio tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
        setShowLinkInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Reset progress when a new file is selected
      setUploadProgress(0);
    }
  };

  // Handle web link submission
  const handleLinkSubmit = () => {
    if (webLink.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: 'Shared a link',
        sender: 'user',
        timestamp: new Date(),
        attachments: [{
          type: 'link',
          url: webLink,
          preview: webLink
        }]
      };
      const updatedMessages = [...messages, newMessage] as any;
      OnMessage(updatedMessages);
      setWebLink('');
      setShowLinkInput(false);
      setShowAttachmentMenu(false);
    }
  };

  // Handle paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setWebLink(text);
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  // Render attachment menu
  const renderAttachmentMenu = () => (
    <motion.div
      ref={attachmentMenuRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full mb-3 bg-white rounded-lg shadow-xl p-3 min-w-[220px] border border-gray-200 z-10"
    >
      {showLinkInput ? (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={webLink}
            onChange={(e) => setWebLink(e.target.value)}
            placeholder="Enter web link"
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            <button
              onClick={handlePaste}
              className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200"
            >
              Paste
            </button>
            <button
              onClick={handleLinkSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <button
            onClick={() => login()}
            className="text-left px-4 py-3 hover:bg-blue-50 rounded-md text-blue-700 font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2.917 16.083c-2.258 0-4.083-1.825-4.083-4.083s1.825-4.083 4.083-4.083c1.103 0 2.024.402 2.735 1.067l-1.107 1.068c-.304-.292-.834-.63-1.628-.63-1.394 0-2.531 1.155-2.531 2.579 0 1.424 1.138 2.579 2.531 2.579 1.616 0 2.224-1.162 2.316-1.762h-2.316v-1.4h3.855c.036.204.064.408.064.677.001 2.332-1.563 3.988-3.919 3.988zm9.917-3.5h-1.75v1.75h-1.167v-1.75h-1.75v-1.166h1.75v-1.75h1.167v1.75h1.75v1.166z"/>
            </svg>
            Google Drive
          </button>
          <button
            onClick={() => setShowLinkInput(true)}
            className="text-left px-4 py-3 hover:bg-blue-50 rounded-md text-blue-700 font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            Web Link
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-left px-4 py-3 hover:bg-blue-50 rounded-md text-blue-700 font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Upload File
          </button>
        </div>
      )}
    </motion.div>
  );

  // Move Google Drive integration before return statement
  const login = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        const result = await fetch('https://www.googleapis.com/drive/v3/files', {
          headers: {
            Authorization: `Bearer ${response.access_token}`,
          },
        });
        const data = await result.json();
        // Handle the Google Drive files data
        console.log(data);
      } catch (error) {
        console.error('Error accessing Google Drive:', error);
      }
    },
  });
  
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 px-6 shadow-md">
        <h1 className="text-xl font-bold">Data Guru Chat</h1>
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
        <AnimatePresence>
          {messages && messages.length > 0 ? messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl p-4 shadow-lg ${message.sender === 'user' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                  : 'bg-white border border-gray-100 text-gray-800'}`}
              >
                <div className="prose max-w-none break-words text-base">
                  {message.content && (
                    <ReactMarkdown
                      components={{

                      code({node, inline, className, children, ...props}: {
                        node: any;
                        inline: boolean;
                        className: string;
                        children: React.ReactNode;
                        [key: string]: any;
                      }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        return !inline ? (
                          <div className="relative group my-4">
                            <button
                              onClick={() => handleCopy(String(children))}
                              className="absolute top-2 right-2 p-2 bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              title="Copy code"
                            >
                              <FiCopy className="text-white w-4 h-4" />
                            </button>
                            <SyntaxHighlighter
                              style={dracula}
                              language={language}
                              PreTag="div"
                              customStyle={{
                                margin: 0,
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                fontSize: '0.875rem',
                                lineHeight: '1.5'
                              }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className={`${className || ''} bg-gray-100 text-gray-800 rounded px-1.5 py-0.5 text-sm font-mono`} {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-4 last:mb-0 space-y-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-4 last:mb-0 space-y-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1 last:mb-0 pl-1">{children}</li>,
                      a: ({ href, children }) => (
                        <a 
                          href={href} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  )}
                </div>
                {message.attachments?.map((attachment, index) => (
                  <div key={index} className="mt-4 first:mt-2 rounded-lg overflow-hidden">
                    {attachment.type === 'image' && (
                      <div className="border rounded-lg overflow-hidden bg-gray-50">
                        <Image
                          src={attachment.url}
                          alt={attachment.name || 'Uploaded image'}
                          width={300}
                          height={200}
                          className="max-w-full max-h-[300px] object-contain mx-auto"
                          style={{ width: 'auto', height: 'auto' }}
                        />
                        {attachment.name && (
                          <div className="px-3 py-2 text-sm text-gray-600 border-t">
                            {attachment.name}
                          </div>
                        )}
                      </div>
                    )}
                    {attachment.type === 'document' && (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-blue-50 text-blue-700 p-4 rounded-lg hover:bg-blue-100 transition-colors duration-200 group"
                      >
                        <div className="shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate group-hover:text-blue-800">
                            {attachment.name || 'Document'}
                          </p>
                          {attachment.preview && (
                            <p className="text-sm text-blue-600/80 truncate">
                              {attachment.preview}
                            </p>
                          )}
                        </div>
                      </a>
                    )}
                    {attachment.type === 'link' && (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 ${message.sender === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-blue-50 text-blue-700'} p-4 rounded-lg hover:bg-opacity-90 transition-colors duration-200 group`}
                      >
                        <div className="shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate group-hover:underline">
                            {attachment.preview || attachment.url}
                          </p>
                        </div>
                      </a>
                    )}
                    {attachment.type === 'voice' && (
                      <div className="bg-gray-50 rounded-lg p-4 border">
                        <audio 
                          controls 
                          className="w-full" 
                          preload="metadata"
                        >
                          <source src={attachment.url} type={attachment.mimeType || 'audio/wav'} />
                          Your browser does not support the audio element.
                        </audio>
                        {attachment.name && (
                          <p className="mt-2 text-sm text-gray-600">{attachment.name}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div className={`text-xs mt-2 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'} flex justify-between items-center`} suppressHydrationWarning>
                  <span suppressHydrationWarning>{new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                  {message.sender === 'ai' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopy(message.content)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Copy message"
                      >
                        <FiCopy className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleLike(message.id)}
                        className={`p-1 hover:bg-gray-200 rounded transition-colors ${message.isLiked ? 'text-green-500' : 'text-gray-500'}`}
                        title="Like"
                      >
                        <FiThumbsUp />
                        {message.likes !== undefined && message.likes > 0 && (
                          <span className="ml-1">{message.likes}</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleDislike(message.id)}
                        className={`p-1 hover:bg-gray-200 rounded transition-colors ${
                          message.isDisliked ? 'text-red-500' : 'text-gray-500'
                        }`}
                        title="Dislike"
                      >
                        <FiThumbsDown />
                        {message.dislikes !== undefined && message.dislikes > 0 && (
                          <span className="ml-1">{message.dislikes}</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleShare(message.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Share"
                      >
                        <FiShare2 className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleRegenerate(message.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Regenerate response"
                        disabled={isLoading}
                      >
                        <FiRefreshCw className={`text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No messages yet. Start a conversation!
            </div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex items-center gap-2 w-full px-4 py-2 bg-white border-t border-gray-200">
        <div className="relative">
          <button
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
              />
            </svg>
          </button>

          {showAttachmentMenu && renderAttachmentMenu()}
        </div>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${isRecording ? 'text-red-500' : 'text-gray-500'}`}
          title={isRecording ? 'Stop recording' : 'Start recording'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
            />
          </svg>
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Type a message..."
          className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleSendMessage}
          disabled={(!inputMessage.trim() && !selectedFile) || isLoading}
          className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${(!inputMessage.trim() && !selectedFile) || isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            />
          </svg>
        </button>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    </div>
);
}
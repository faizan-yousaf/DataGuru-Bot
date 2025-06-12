export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: MessageAttachment[];
  reactions?: MessageReactions;
  isEdited?: boolean;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'audio' | 'voice' | 'link';
  url: string;
  name: string;
  size?: number;
  transcription?: string;
  isTranscribed?: boolean;
  showTranscription?: boolean;
  extractedText?: string;
  isExtracted?: boolean;
  linkAnalysis?: LinkAnalysisResult;
  isAnalyzing?: boolean;
  error?: string;
}

export interface LinkAnalysisResult {
  title: string;
  description: string;
  content: string;
  url: string;
  domain: string;
  error?: string;
}

export interface MessageReactions {
  likes: number;
  dislikes: number;
  userLiked: boolean;
  userDisliked: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  error: string | null;
}

export interface ImageProcessingState {
  isProcessing: boolean;
  extractedText: string | null;
  error: string | null;
}

export interface SuggestedPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'rag' | 'agentic' | 'neural' | 'advanced';
}
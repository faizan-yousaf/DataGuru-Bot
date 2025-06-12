import { SuggestedPrompt, ChatMessage } from '@/types/chat';
import { Database, Bot, Brain, TrendingUp, Zap } from 'lucide-react';

export const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

export const generateRelatedPrompts = (userQuery: string): SuggestedPrompt[] => {
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

export const generateContextualRelatedPrompts = (
  currentQuery: string, 
  chatHistory: ChatMessage[]
): SuggestedPrompt[] => {
  const query = currentQuery.toLowerCase();
  const relatedPrompts: SuggestedPrompt[] = [];
  
  // Analyze recent conversation context (last 3 messages)
  const recentMessages = chatHistory.slice(-6); // Last 3 exchanges (user + assistant)
  const conversationContext = recentMessages.map(msg => msg.content.toLowerCase()).join(' ');
  
  // Context-aware suggestions based on conversation history
  if (conversationContext.includes('error') || conversationContext.includes('debug') || query.includes('error')) {
    relatedPrompts.push(
      {
        id: 'ctx1',
        title: 'Error Prevention Strategies',
        description: 'Learn how to prevent similar errors',
        prompt: 'What are the best practices to prevent this type of error in the future? Include code review guidelines and testing strategies.',
        icon: Brain,
        category: 'advanced'
      },
      {
        id: 'ctx2',
        title: 'Debugging Techniques',
        description: 'Advanced debugging methodologies',
        prompt: 'What are the most effective debugging techniques for this type of issue? Include tools and systematic approaches.',
        icon: Zap,
        category: 'advanced'
      }
    );
  }
  
  if (conversationContext.includes('rag') || conversationContext.includes('vector') || conversationContext.includes('embedding')) {
    relatedPrompts.push(
      {
        id: 'ctx3',
        title: 'RAG Performance Optimization',
        description: 'Improve your RAG system based on our discussion',
        prompt: 'Based on our conversation about RAG, how can I optimize the retrieval accuracy and reduce hallucinations?',
        icon: Database,
        category: 'rag'
      }
    );
  }
  
  if (conversationContext.includes('model') || conversationContext.includes('training') || conversationContext.includes('neural')) {
    relatedPrompts.push(
      {
        id: 'ctx4',
        title: 'Model Fine-tuning',
        description: 'Customize models for your specific use case',
        prompt: 'How can I fine-tune the model we discussed for my specific dataset and requirements?',
        icon: Brain,
        category: 'neural'
      }
    );
  }
  
  // If no context-specific suggestions, fall back to query-based suggestions
  if (relatedPrompts.length === 0) {
    return generateRelatedPrompts(currentQuery);
  }
  
  // Add one general suggestion based on current query
  const queryBasedSuggestions = generateRelatedPrompts(currentQuery);
  if (queryBasedSuggestions.length > 0) {
    relatedPrompts.push(queryBasedSuggestions[0]);
  }
  
  return relatedPrompts.slice(0, 3);
};
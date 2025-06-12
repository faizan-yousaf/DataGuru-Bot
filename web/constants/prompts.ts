import { Database, Bot, Brain, TrendingUp } from 'lucide-react';
import { SuggestedPrompt } from '@/types/chat';

export const WELCOME_PROMPTS: SuggestedPrompt[] = [
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
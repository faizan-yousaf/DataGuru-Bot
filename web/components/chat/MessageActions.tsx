import React from 'react';
import { ThumbsUp, ThumbsDown, RefreshCw, Copy } from 'lucide-react';
import { ChatMessage } from '@/types/chat';

interface MessageActionsProps {
  message: ChatMessage;
  onReaction: (messageId: string, type: 'like' | 'dislike') => void;
  onRegenerate: (messageId: string) => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  onReaction,
  onRegenerate
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  if (message.role === 'user') {
    return (
      <div className="flex items-center justify-end mt-2 space-x-1">
        <button
          onClick={handleCopy}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
          title="Copy message"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between mt-2">
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onReaction(message.id, 'like')}
          className={`p-1 rounded transition-colors ${
            message.reactions?.userLiked 
              ? 'text-blue-500 bg-blue-50' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
          title="Like"
        >
          <ThumbsUp className="w-4 h-4" />
          {message.reactions && message.reactions.likes > 0 && (
            <span className="ml-1 text-xs">{message.reactions.likes}</span>
          )}
        </button>
        
        <button
          onClick={() => onReaction(message.id, 'dislike')}
          className={`p-1 rounded transition-colors ${
            message.reactions?.userDisliked 
              ? 'text-red-500 bg-red-50' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
          title="Dislike"
        >
          <ThumbsDown className="w-4 h-4" />
          {message.reactions && message.reactions.dislikes > 0 && (
            <span className="ml-1 text-xs">{message.reactions.dislikes}</span>
          )}
        </button>
        
        <button
          onClick={() => onRegenerate(message.id)}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
          title="Regenerate response"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      <button
        onClick={handleCopy}
        className="p-1 text-gray-400 hover:text-gray-600 rounded"
        title="Copy message"
      >
        <Copy className="w-4 h-4" />
      </button>
    </div>
  );
};
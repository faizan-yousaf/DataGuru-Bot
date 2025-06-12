import React from 'react';
import { MessageAttachment } from '@/types/chat';
import { FileText, Image as ImageIcon, Mic, Link } from 'lucide-react';
import { formatFileSize } from '@/utils/chat';
import Image from 'next/image';

interface MessageAttachmentsProps {
  attachments: MessageAttachment[];
  onUpdate: (attachmentId: string, updates: Partial<MessageAttachment>) => void;
}

export const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
  attachments,
  onUpdate
}) => {
  const renderAttachment = (attachment: MessageAttachment) => {
    switch (attachment.type) {
      case 'image':
        return (
          <div key={attachment.id} className="mb-2">
            <div className="relative w-48 h-32 rounded-lg overflow-hidden">
              <Image
                src={attachment.url}
                alt={attachment.name}
                fill
                className="object-cover"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{attachment.name}</p>
          </div>
        );
      
      case 'voice':
        return (
          <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg mb-2">
            <Mic className="w-4 h-4 text-gray-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">{attachment.name}</p>
              {attachment.transcription && (
                <p className="text-xs text-gray-600 mt-1">
                  Transcription: {attachment.transcription}
                </p>
              )}
            </div>
          </div>
        );
      
      case 'link':
        return (
          <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg mb-2">
            <Link className="w-4 h-4 text-blue-500" />
            <div className="flex-1">
              <a 
                href={attachment.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {attachment.name}
              </a>
              {attachment.linkAnalysis && (
                <p className="text-xs text-gray-600 mt-1">
                  {attachment.linkAnalysis.description}
                </p>
              )}
            </div>
          </div>
        );
      
      default:
        return (
          <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg mb-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">{attachment.name}</p>
              {attachment.size && (
                <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="mt-2">
      {attachments.map(renderAttachment)}
    </div>
  );
};
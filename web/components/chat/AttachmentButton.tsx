import React, { useRef } from 'react';
import { Paperclip, Upload, Link } from 'lucide-react';
import { MessageAttachment } from '@/types/chat';
import { generateId } from '@/utils/chat';

interface AttachmentButtonProps {
  onAttachment: (attachment: MessageAttachment) => void;
}

export const AttachmentButton: React.FC<AttachmentButtonProps> = ({ onAttachment }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const attachment: MessageAttachment = {
      id: generateId(),
      type: file.type.startsWith('image/') ? 'image' : 'document',
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    };

    onAttachment(attachment);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Attach file"
      >
        <Paperclip className="w-5 h-5" />
      </button>
    </>
  );
};
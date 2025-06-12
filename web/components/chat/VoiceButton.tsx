import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { MessageAttachment } from '@/types/chat';
import { useAssemblyAIVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface VoiceButtonProps {
  onVoiceAttachment: (attachment: MessageAttachment) => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ onVoiceAttachment }) => {
  const { isRecording, isTranscribing, startRecording, stopRecordingAndCreateAttachment } = useAssemblyAIVoiceRecorder();

  const handleVoiceToggle = async () => {
    if (isRecording) {
      const attachment = await stopRecordingAndCreateAttachment();
      if (attachment) {
        onVoiceAttachment(attachment);
      }
    } else {
      await startRecording();
    }
  };

  return (
    <button
      type="button"
      onClick={handleVoiceToggle}
      disabled={isTranscribing}
      className={`p-2 rounded-lg transition-colors ${
        isRecording 
          ? 'text-red-500 bg-red-50 hover:bg-red-100' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      } ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isRecording ? 'Stop recording' : 'Start voice recording'}
    >
      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  );
};
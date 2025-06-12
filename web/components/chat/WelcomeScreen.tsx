import React from 'react';
import { WELCOME_PROMPTS } from '@/constants/prompts';
import { Bot, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onPromptSelect: (prompt: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPromptSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
          <Bot className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to DataGuru
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Your AI-powered data science assistant. Ask me anything about machine learning, 
          data analysis, or AI development.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full">
        {WELCOME_PROMPTS.map((prompt) => {
          const IconComponent = prompt.icon;
          return (
            <button
              key={prompt.id}
              onClick={() => onPromptSelect(prompt.prompt)}
              className="p-4 text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <IconComponent className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {prompt.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {prompt.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-8 flex items-center text-sm text-gray-500">
        <Sparkles className="w-4 h-4 mr-2" />
        Start by selecting a prompt above or type your own question
      </div>
    </div>
  );
};
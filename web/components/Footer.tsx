import { Brain } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold">Data Guru</span>
            </div>
            <p className="text-gray-400">
              Empowering data scientists with AI-driven tools and insights for
              the future of data science.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-gray-400">
              <li>AI Chatbot</li>
              <li>Trend Analysis</li>
              <li>Smart Filters</li>
              <li>User Profiles</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Artificial Intelligence</li>
              <li>Data Science</li>
              <li>Machine Learning</li>
              <li>Deep Learning</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Data Guru. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
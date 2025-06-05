import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
            <Logo className="w-5 h-5" width={20} height={20} />
          </div>
          <span className="text-lg font-semibold text-gray-900">Data Guru</span>
        </div>
        <p className="text-center text-gray-600 mt-4">
          © 2024 Data Guru. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
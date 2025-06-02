import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Brain, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export function Navbar() {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-yellow-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-black" />
            </div>
            <span className="text-2xl font-bold text-black">Data Guru</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-black hover:text-yellow-600 transition-colors font-medium">
              Features
            </Link>
            <Link href="#chatbot" className="text-black hover:text-yellow-600 transition-colors font-medium">
              Chatbot
            </Link>
            <Link href="#trends" className="text-black hover:text-yellow-600 transition-colors font-medium">
              Trends
            </Link>
            <SignedOut>
              <Link href="/sign-in" className="mr-4">Sign In</Link>
              <Link href="/sign-up" className="px-4 py-2 bg-blue-500 text-white rounded">Sign Up</Link>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}
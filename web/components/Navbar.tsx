import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Logo } from './Logo';

export function Navbar() {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-yellow-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Logo className="w-10 h-10" width={40} height={40} />
            <Link href="/" className="text-2xl font-bold text-black hover:text-yellow-600 transition-colors">
              Data Guru
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#features" className="text-black hover:text-yellow-600 transition-colors font-medium">
              Features
            </Link>
            <Link href="/chat" className="text-black hover:text-yellow-600 transition-colors font-medium">
              Chatbot
            </Link>
            <Link href="/trends" className="text-black hover:text-yellow-600 transition-colors font-medium">
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
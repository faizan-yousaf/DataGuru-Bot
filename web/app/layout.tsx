import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { GoogleOAuthProvider } from '@react-oauth/google';
import localFont from "next/font/local";
import { Metadata } from "next";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Data Guru",
  description: "Your AI-powered data science assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body>
          <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID || ''} children={undefined}></GoogleOAuthProvider>
            <nav className="flex justify-end items-center p-4 bg-white shadow-sm">
              <SignedOut>
                <a href="/sign-in" className="mr-4">Sign In</a>
                <a href="/sign-up" className="px-4 py-2 bg-blue-500 text-white rounded">Sign Up</a>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </nav>
            {children}
          {/* </GoogleOAuthProvider> */}
        </body>
      </html>
    </ClerkProvider>
  );
}

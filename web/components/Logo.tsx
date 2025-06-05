import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = '', width = 24, height = 24 }: LogoProps) {
  return (
    <Image
      src="/chatbot-logo.png"
      alt="Data Guru Logo"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
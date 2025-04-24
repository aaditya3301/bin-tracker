import { ReactNode } from 'react';

interface HomeLayoutProps {
  children: ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#edf7f2]">
      {children}
    </div>
  );
}
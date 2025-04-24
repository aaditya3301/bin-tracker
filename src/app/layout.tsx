import type { Metadata } from "next";
import { ReactNode } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import '../app/globals.css';

interface RootLayoutProps {
  children: ReactNode;
}

export const metadata = {
  title: 'Smart Waste Management System',
  description: 'Making waste disposal more responsible, accessible, and rewarding',
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html >
      <body>
        {children}
      </body>
    </html>
  );
}

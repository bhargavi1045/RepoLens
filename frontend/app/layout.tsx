import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RepoLens — Understand GitHub repositories in seconds',
  description: 'Instantly analyze, understand, and improve any GitHub project with AI-powered insights.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
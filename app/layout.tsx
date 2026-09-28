import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Kalam } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const kalam = Kalam({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  variable: '--font-kalam',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DecisionIQ — Research less. Decide better.',
  description:
    'DecisionIQ is a general-purpose AI Decision Intelligence Platform that researches, verifies, compares options, and helps you decide with total confidence.',
  keywords: [
    'AI Decision Intelligence',
    'DecisionIQ',
    'AI Research Platform',
    'Option Comparison Engine',
    'Evidence Verification',
    'Decision Science',
  ],
  authors: [{ name: 'DecisionIQ AI Team' }],
  openGraph: {
    title: 'DecisionIQ — Research less. Decide better.',
    description:
      'General-purpose AI Decision Intelligence Platform. Research options, evaluate evidence, and understand why a choice is better.',
    url: 'https://decisioniq.ai',
    siteName: 'DecisionIQ',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DecisionIQ — Research less. Decide better.',
    description: 'General-purpose AI Decision Intelligence Platform.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${kalam.variable} dark scroll-smooth`}
    >
      <body className="bg-background text-slate-100 font-sans min-h-screen relative overflow-x-hidden antialiased bg-cyber-grid">
        <div className="fixed inset-0 bg-radial-ambient pointer-events-none -z-10" />
        <AuthProvider>
          <main className="relative z-10 min-h-screen flex flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
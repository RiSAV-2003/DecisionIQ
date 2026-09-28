'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export function AppShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-x-hidden">
      <div className="fixed inset-0 bg-radial-ambient pointer-events-none -z-10" />
      <Header />
      <main className={`flex-1 w-full mx-auto ${wide ? 'max-w-[1600px] px-4 sm:px-6 lg:px-8' : 'max-w-7xl px-4 sm:px-6 lg:px-8'} py-8`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { RobotAssistant } from '@/components/ui/RobotAssistant';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
        <RobotAssistant size="md" pose="floating" />
        <div className="skeleton w-56 h-4" />
        <div className="skeleton w-40 h-4" />
      </div>
    );
  }

  return <>{children}</>;
}
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DecisionWizard } from '@/components/decision/DecisionWizard';

export default function NewDecisionPage() {
  return (
    <ProtectedRoute>
      <AppShell wide>
        <div className="grid lg:grid-cols-[240px_1fr] gap-6">
          <Sidebar />
          <div className="min-w-0 py-6 lg:py-2">
            <Suspense fallback={null}>
              <WizardWithQuery />
            </Suspense>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function WizardWithQuery() {
  const params = useSearchParams();
  const q = params.get('q') || '';
  return <DecisionWizard initialQuery={q} />;
}
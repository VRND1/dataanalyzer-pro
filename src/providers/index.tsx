import { PropsWithChildren } from 'react';
import { AuthProvider } from './auth';
import { SystemHealthMonitor } from '@/components/monitoring/SystemHealthMonitor';
import { AlertSystem } from '@/components/monitoring/AlertSystem';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <div className="relative">
        <SystemHealthMonitor />
        <AlertSystem data={{ fields: [] }} />
        {children}
      </div>
    </AuthProvider>
  );
}
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/AuthContext';
import { TenantProvider } from '@/features/tenant/TenantContext';
import { ToastProvider } from '@/components/ui/Toast';
import { AppRoutes } from '@/routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <TenantProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

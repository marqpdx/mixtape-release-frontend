// apps/crossroads/src/components/providers.tsx

'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ThemeProvider } from '@contexts/ThemeContext';
import { ColorModeProvider } from '@components/ui/color-mode';
import { Toaster } from '@/components/ui/toaster';
import { system } from '@/theme/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient instance per component tree (SSR-safe)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ChakraProvider value={system}>
      <ColorModeProvider />
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryClientProvider>
        <Toaster />
      </ThemeProvider>
    </ChakraProvider>
  );
}

'use client';

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { AuthProvider } from '@lib/auth/AuthContext';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={defaultSystem}>
      <AuthProvider>
        {children}
      </AuthProvider>
      <Toaster />
    </ChakraProvider>
  );
}

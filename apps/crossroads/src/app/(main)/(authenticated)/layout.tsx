// apps/crossroads/src/app/(main)/(authenticated)/layout.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Spinner } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { useAuth } from '@/lib/auth/AuthContext';
import dynamic from 'next/dynamic';

const UnifiedNavbar = dynamic(() => import('@components/layout/UnifiedNavbar'), {
  ssr: false,
});

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const bgColor = useColorModeValue('white', 'gray.900');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/app/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg={bgColor}>
        <Spinner size="lg" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box minH="100%" bg={bgColor}>
      <UnifiedNavbar extraCompact />
      <Box w="full" maxW="none">
        {children}
      </Box>
    </Box>
  );
}

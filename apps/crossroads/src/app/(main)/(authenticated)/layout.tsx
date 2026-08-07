// apps/crossroads/src/app/(main)/(authenticated)/layout.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, HStack, Spinner, Text } from '@chakra-ui/react';
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
  const { user, isAuthenticated, isLoading, assumeUser, exitAssumeUser } = useAuth();
  const router = useRouter();
  const bgColor = useColorModeValue('white', 'gray.900');
  const impersonation = (
    user as (typeof user & {
      impersonation?: {
        is_impersonating?: boolean;
        impersonated_by?: { username?: string };
      };
    })
  )?.impersonation;
  const isImpersonating = !!impersonation?.is_impersonating;
  const impersonatedBy = impersonation?.impersonated_by;
  const canStartAssume = !!user?.is_superuser && !isImpersonating;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (appUrl) {
        // Hard redirect so tenant subdomains (*.localhost:3010) land on the correct login origin
        window.location.href = `${appUrl}/app/login`;
      } else {
        router.push('/app/login');
      }
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

  const handleAssume = async () => {
    const username = window.prompt("Assume username:");
    if (!username || !username.trim()) return;
    try {
      await assumeUser(username.trim());
      router.refresh();
    } catch (error) {
      console.error("Assume user failed", error);
      window.alert("Failed to assume user.");
    }
  };

  const handleExitAssume = async () => {
    try {
      await exitAssumeUser();
      router.refresh();
    } catch (error) {
      console.error("Exit assume failed", error);
      window.alert("Failed to exit assume mode.");
    }
  };

  return (
    <Box minH="100%" bg={bgColor}>
      <UnifiedNavbar extraCompact />
      {(isImpersonating || canStartAssume) ? (
        <Box px={4} py={2} bg={isImpersonating ? "orange.100" : "blue.100"} borderBottomWidth="1px" borderColor="border">
          <HStack justify="space-between" wrap="wrap" gap={2}>
            <Text fontSize="sm" color="gray.800">
              {isImpersonating
                ? `Assuming @${user?.username}${impersonatedBy?.username ? ` (by @${impersonatedBy.username})` : ""}`
                : "Superuser mode"}
            </Text>
            <HStack gap={2}>
              {canStartAssume ? (
                <Button size="xs" variant="outline" onClick={handleAssume}>
                  Assume user
                </Button>
              ) : null}
              {isImpersonating ? (
                <Button size="xs" colorPalette="orange" variant="solid" onClick={handleExitAssume}>
                  Exit assume
                </Button>
              ) : null}
            </HStack>
          </HStack>
        </Box>
      ) : null}
      <Box w="full" maxW="none">
        {children}
      </Box>
    </Box>
  );
}

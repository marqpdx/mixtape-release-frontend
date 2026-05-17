// src/app/(authenticated)/layout.tsx

// Consolidated layout for all authenticated content

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Box, Button, HStack, Spinner, Text } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePermissions } from "@mixtape/auth/usePermissions";
// import AdminTodoButtonWithModal from "@components/admin-apps/AdminTodoButtonWithModal";
// import AdminSeedButtonWithModal from "@components/writing/AdminSeedButtonWithModal";
import Footer from "@components/layout/Footer";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";
import { HelpProvider } from "@/components/help/HelpProvider";
import { HelpDrawer } from "@/components/help/HelpDrawer";
// import PageContainer from "@components/layout/PageContainer";
import { ChatUnreadProvider } from "@/contexts/ChatUnreadContext";
import { initializeSocket } from "@mixtape/api/lib/socket";
import { ChatRealtimeWire } from "@/components/chat/ChatRealtimeWire";
import { ActivityRealtimeWire } from "@/components/activity/ActivityRealtimeWire";

function AuthenticatedLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading: identityLoading, isAuthenticated, can, canInGroup, assumeUser, exitAssumeUser } = useAuth();
  const { isAdmin } = usePermissions({ user, can, canInGroup });
  const [socketInitialized, setSocketInitialized] = useState(false);
  const [assumeHintActive, setAssumeHintActive] = useState(false);

  // Auth check - redirect to login if not authenticated
  useEffect(() => {
    console.log('[AuthenticatedLayout] Auth check:', {
      identityLoading,
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email
    });

    if (identityLoading) return;

    if (!isAuthenticated || !user) {
      console.log('[AuthenticatedLayout] Not authenticated, redirecting to login');
      const query = searchParams?.toString();
      const redirectTarget = query ? `${pathname}?${query}` : pathname;
      router.replace(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
    }
  }, [user, isAuthenticated, identityLoading, router, pathname, searchParams]);  

  // ✅ Initialize Socket.IO connection when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log('[Layout] Skipping socket init - not authenticated');
      return;
    }

    if (socketInitialized) {
      console.log('[Layout] Socket already initialized');
      return;
    }

    console.log('[Layout] 🔌 Initializing Socket.IO connection for user:', user.username);

    let mounted = true;

    const initSocket = async () => {
      try {
        const socket = await initializeSocket();

        if (!mounted) {
          console.log('[Layout] Component unmounted during init, aborting');
          return;
        }

        if (socket?.connected) {
          console.log('[Layout] ✅ Socket.IO initialized and connected:', socket.id);
          setSocketInitialized(true);
        } else {
          console.warn('[Layout] ⚠️ Socket initialized but not connected, retrying in 2s...');
          setTimeout(() => {
            if (mounted) {
              setSocketInitialized(false); // Trigger retry
            }
          }, 2000);
        }
      } catch (error) {
        console.error('[Layout] ❌ Socket.IO initialization failed:', error);
        if (mounted) {
          // Retry after delay
          setTimeout(() => {
            if (mounted) {
              setSocketInitialized(false); // Trigger retry
            }
          }, 3000);
        }
      }
    };

    initSocket();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user, socketInitialized]);

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
  const canExitAssume = isImpersonating || assumeHintActive;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("mixtape_assume_active") === "true";
    setAssumeHintActive(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isImpersonating) {
      window.localStorage.setItem("mixtape_assume_active", "true");
      setAssumeHintActive(true);
    }
  }, [isImpersonating]);

  // Show loading spinner while checking authentication
  if (identityLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Spinner size="xl" mb={4} />
        <Text fontSize="lg">Loading...</Text>
      </Box>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Text fontSize="lg">Redirecting to login...</Text>
      </Box>
    );
  }

  // Navbar will auto-detect section, so we don't need to pass it
  // Just let it figure out based on pathname
  const isAdminPath = pathname.startsWith("/admin");

  const handleAssume = async () => {
    const username = window.prompt("Assume username:");
    if (!username || !username.trim()) return;
    try {
      await assumeUser(username.trim());
      if (typeof window !== "undefined") {
        window.localStorage.setItem("mixtape_assume_active", "true");
      }
      setAssumeHintActive(true);
      router.refresh();
    } catch (error) {
      console.error("Assume user failed", error);
      window.alert("Failed to assume user.");
    }
  };

  const handleExitAssume = async () => {
    try {
      await exitAssumeUser();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("mixtape_assume_active");
      }
      setAssumeHintActive(false);
      router.refresh();
    } catch (error) {
      console.error("Exit assume failed", error);
      window.alert("Failed to exit assume mode.");
    }
  };

  return (
    <ChatUnreadProvider>
      <HelpProvider>
        <ChatRealtimeWire />
        <ActivityRealtimeWire />

        <Box style={{ "--app-topbar": "80px" } as React.CSSProperties}>
          <UnifiedNavbar compact={isAdminPath} />
          {(canExitAssume || canStartAssume) ? (
            <Box px={4} py={2} bg={canExitAssume ? "orange.100" : "blue.100"} borderBottomWidth="1px" borderColor="border">
              <HStack justify="space-between" wrap="wrap" gap={2}>
                <Text fontSize="sm" color="gray.800">
                  {isImpersonating
                    ? `Assuming @${user?.username}${impersonatedBy?.username ? ` (by @${impersonatedBy.username})` : ""}`
                    : canExitAssume
                      ? "Assume session active. Use Exit assume to return."
                      : "Superuser mode"}
                </Text>
                <HStack gap={2}>
                  {canStartAssume ? (
                    <Button size="xs" variant="outline" onClick={handleAssume}>
                      Assume user
                    </Button>
                  ) : null}
                  {canExitAssume ? (
                    <Button size="xs" colorPalette="orange" variant="solid" onClick={handleExitAssume}>
                      Exit assume
                    </Button>
                  ) : null}
                </HStack>
              </HStack>
            </Box>
          ) : null}

          <Box
            as="main"
            id="main-content"
            role="main"
            className="main-authenticated-layout"
          >
            {children}
          </Box>
        </Box>

        <HelpDrawer />
      </HelpProvider>

      <Footer />

      {isAdmin && (
        <>
          {/* <AdminTodoButtonWithModal isAdmin={true} />
          <AdminSeedButtonWithModal /> */}
        </>
      )}
    </ChatUnreadProvider>
  );
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" mb={4} />
        <Text fontSize="lg">Loading...</Text>
      </Box>
    }>
      <AuthenticatedLayoutInner>{children}</AuthenticatedLayoutInner>
    </Suspense>
  );
}

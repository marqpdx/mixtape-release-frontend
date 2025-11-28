// src/app/(authenticated)/layout.tsx

// Consolidated layout for all authenticated content

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box, Spinner, Text } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePermissions } from "@/lib/auth/usePermissions";
// import AdminTodoButtonWithModal from "@components/admin-apps/AdminTodoButtonWithModal";
// import AdminSeedButtonWithModal from "@components/writing/AdminSeedButtonWithModal";
// import Footer from "@components/layout/Footer";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";
// import PageContainer from "@components/layout/PageContainer";
import { ChatUnreadProvider } from "@/contexts/ChatUnreadContext";
import { initializeSocket } from "@/lib/socket";
import { ChatRealtimeWire } from "@/components/chat/ChatRealtimeWire";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: identityLoading, isAuthenticated } = useAuth();
  const { isAdmin } = usePermissions();
  const [socketInitialized, setSocketInitialized] = useState(false);

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
      router.replace("/login");
    }
  }, [user, isAuthenticated, identityLoading, router]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <ChatUnreadProvider>
      <ChatRealtimeWire />

      <Box style={{ "--app-topbar": "80px" } as React.CSSProperties}>
        <UnifiedNavbar compact={isAdminPath} />

        <Box
          as="main"
          id="main-content"
          role="main"
          className="main-authenticated-layout"
        >
          {/* <PageContainer> */}
            {children}
          {/* </PageContainer> */}
        </Box>
      </Box>

      {/* <Footer /> */}

      {isAdmin && (
        <>
          {/* <AdminTodoButtonWithModal isAdmin={true} />
          <AdminSeedButtonWithModal /> */}
        </>
      )}
    </ChatUnreadProvider>
  );
}
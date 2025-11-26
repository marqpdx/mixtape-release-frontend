// src/app/(authenticated)/layout.tsx

// Consolidated layout for all authenticated content

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box, Spinner, Text } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePermissions } from "@/lib/auth/usePermissions";
import { getAccessToken } from "@/lib/auth/tokenStorage";
import { useColorModeValue } from "@components/ui/color-mode";
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
  const { isAdmin, isSteward, isMember } = usePermissions();
  const [socketInitialized, setSocketInitialized] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_ROOT_API_URL || '';
  const permUrl = `${apiUrl}/admin/dashboard`;
  const bgColor = useColorModeValue("background.light", "background.dark");
  const textColor = useColorModeValue("text.light", "text.dark");

  // ✅ NEW: Track admin validation state separately
  const [adminValidated, setAdminValidated] = useState(false);
  const [adminAccessDenied, setAdminAccessDenied] = useState(false);

  // ✅ Check backend for admin/steward access (simplified - no caching for now)
  const validateAdminAccess = async () => {
    try {
      // Skip for regular members
      if (isMember && !isAdmin && !isSteward) {
        setAdminValidated(true);
        return;
      }

      // Only validate if user claims to be admin/steward
      if (!isAdmin && !isSteward) {
        setAdminValidated(true);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        setAdminAccessDenied(true);
        return;
      }

      const response = await fetch(permUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setAdminAccessDenied(true);
        return;
      }

      setAdminValidated(true);
    } catch (error) {
      console.error("[AuthenticatedLayout] Admin validation error:", error);
      setAdminAccessDenied(true);
    }
  };

  // ✅ Main auth effect - now properly awaits validation
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
      return;
    }

    // For members, skip admin validation
    if (isMember && !isAdmin && !isSteward) {
      setAdminValidated(true);
      return;
    }

    // For admins/stewards, validate before rendering
    validateAdminAccess();
  }, [user, isAuthenticated, identityLoading, isAdmin, isSteward, isMember]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ Redirect if admin validation failed
  useEffect(() => {
    if (adminAccessDenied) {
      router.replace("/login");
    }
  }, [adminAccessDenied]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ✅ Loading state - show until identity loads AND admin validation completes
  const isStillLoading = identityLoading || (!isMember && !adminValidated);

  if (isStillLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Spinner size="xl" mb={4} />
        <Text fontSize="lg">Checking authentication status...</Text>
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
// apps/mixtape/src/components/layout/UnifiedNavbar.tsx

"use client";

import {
  Box,
  Container,
  Flex,
  HStack,
  VStack,
  Link,
  Button,
  Drawer,
  useDisclosure,
  IconButton,
  Text,
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
  MenuSeparator,
  Avatar,
  AvatarGroup,
  MenuPositioner,
  Badge,
  Stack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePermissions } from "@mixtape/auth/usePermissions";
import { useDefaultGroup } from "@mixtape/api/hooks/groups/useGroups";
import { ThemeSelector } from "@components/common/ThemeSelector";
import { IconMenu2, IconX, IconUser, IconSettings, IconLogout, IconBell } from "@tabler/icons-react";
import { CrossroadsLogo } from "@components/common/CrossroadsLogo";
import { Divider } from "@components/common/Divider";
import { toaster } from "@mixtape/core/lib/toaster";
import { useNotificationMutations, useNotificationSummary, useNotificationsPage } from "@mixtape/api/hooks/activity";

// Navigation item types
type NavSection = "public" | "about" | "authenticated" | "admin" | "protected";

interface NavItem {
  key: string;
  label: string;
  href: string;
  section: NavSection;
  adminOnly?: boolean;
  stewardOnly?: boolean;
  memberOnly?: boolean;
  shortLabel?: string;
}

// Define all navigation items
const NAV_ITEMS: NavItem[] = [
  // Public section
  { key: "home", label: "Home", href: "/", section: "public" },

  // About section
  { key: "about", label: "About", href: "/about", section: "about" },
  { key: "join", label: "Join", href: "/about/join", section: "about" },
  { key: "explore", label: "Explore", href: "/about/public", section: "about" },
  { key: "how-it-works", label: "How It Works", href: "/about/how-it-works", section: "about" },

  // Authenticated section (members + admins)
  { key: "my-crossroads", label: "My Crossroads", href: "/member/{username}", section: "authenticated", memberOnly: true, shortLabel: "My" },
  { key: "our-community", label: "Community", href: "/{defaultGroupSlug}", section: "authenticated", memberOnly: true, shortLabel: "Community" },
  { key: "dashboard", label: "_dbrd", href: "/dashboard", section: "authenticated", adminOnly: true, shortLabel: "Dash" },
  { key: "workbench", label: "_wrkb", href: "/member/{username}/workbench", section: "authenticated", memberOnly: true, shortLabel: "Bench" },
  { key: "puddlejump", label: "_pdlj", href: "/puddlejump", section: "authenticated", adminOnly: true, shortLabel: "Bench" },
  // { key: "puddlejump", label: "Puddlejump", href: "/puddlejump", section: "authenticated", memberOnly: true, shortLabel: "PDL" },
  // { key: "stackroom", label: "Stackroom", href: "/stackroom", section: "authenticated", memberOnly: true, shortLabel: "Stack" },
  // { key: "constellation", label: "Constellation", href: "/demos/constellation", section: "authenticated", memberOnly: true, shortLabel: "Cons" },
  // { key: "threadworks", label: "Threadworks", href: "/app/threadworks", section: "authenticated", memberOnly: true, shortLabel: "Threads" },
  // { key: "loom-codex", label: "Loom & Codex", href: "/loom-and-codex", section: "authenticated", memberOnly: true, shortLabel: "Codex" },
  // { key: "map", label: "Map", href: "/demos/map", section: "authenticated", memberOnly: true },
  // { key: "bazaar", label: "Bazaar", href: "/bazaar", section: "authenticated", memberOnly: true },
  { key: "admin-panel", label: "Admin", href: "/admin", section: "authenticated", adminOnly: true, shortLabel: "Admin" },
];

interface UnifiedNavbarProps {
  section?: NavSection;
  sticky?: boolean;
  showLogo?: boolean;
  compact?: boolean;
  extraCompact?: boolean;
}

export default function UnifiedNavbar({
  section,
  sticky = true,
  showLogo = true,
  compact = false,
  extraCompact = true,
}: UnifiedNavbarProps) {
  const pathname = usePathname();
  const { user: identity, logout, isLoading, can, canInGroup } = useAuth();
  const { isAdmin, isSteward } = usePermissions({ user: identity, can, canInGroup });
  // const { groups: userGroups = [] } = useUserGroups();
  const { group: defaultGroup } = useDefaultGroup();
  const { open, onOpen, onClose } = useDisclosure();
  const {
    open: notificationsOpen,
    onOpen: onNotificationsOpen,
    onClose: onNotificationsClose,
  } = useDisclosure();
  const logoColor = useColorModeValue('black', 'white');
  const homeHref =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "/");
  const myCrossroadsLabel = defaultGroup?.title
    ? `My ${defaultGroup.title}`
    : "My Crossroads";
  const defaultGroupSlug =
    defaultGroup?.slug ||
    process.env.NEXT_PUBLIC_DEFAULT_GROUP_SLUG ||
    "crossroads";

  const avatarUrl = identity?.profile?.avatar_url?.trim() || undefined;
  const { summary } = useNotificationSummary({ enabled: Boolean(identity) });
  const { page: notificationsPage, isLoading: isNotificationsLoading } = useNotificationsPage({
    enabled: Boolean(identity),
  });
  const { markRead, dismiss } = useNotificationMutations();
  const unreadCount = summary?.notifications_unread_count ?? 0;
  const notificationsPreview = notificationsPage?.results?.slice(0, 6) ?? [];

  // Auto-detect section if not provided
  const detectedSection: NavSection =
    section ||
    (pathname.startsWith("/about") ? "about" :
     identity && (pathname.startsWith("/dashboard") ||
                  pathname.startsWith("/groups") ||
                  pathname.startsWith("/constellation") ||
                  pathname.startsWith("/threadworks") ||
                  pathname.startsWith("/loom-and-codex") ||
                  pathname.startsWith("/puddlejump") ||
                  pathname.startsWith("/stackroom") ||
                  pathname.startsWith("/bazaar") ||
                  pathname.startsWith("/member") ||
                  pathname.startsWith("/map") ||
                  pathname.startsWith("/admin")) ? "authenticated" :
     "public");

  // For rendering purposes, both /admin and /dashboard use authenticated nav
  const navSection: NavSection = detectedSection;


  // Helper to resolve dynamic hrefs (e.g., {username} placeholder)
  const resolveHref = (href: string) => {
    if (identity?.username) {
      return href
        .replace('{username}', identity.username)
        .replace('{defaultGroupSlug}', defaultGroupSlug);
    }
    return href.replace('{defaultGroupSlug}', defaultGroupSlug);
  };

  // Filter items based on current section and permissions
  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.section !== navSection) return false;
    if (item.adminOnly && !isAdmin) return false;
    if (item.stewardOnly && !isSteward) return false;
    if (item.memberOnly && !identity) return false;
    return true;
  }).map(item => ({
    ...item,
    label: item.key === "my-crossroads" ? myCrossroadsLabel : item.label,
    href: resolveHref(item.href),
  }));

  // Determine active item
  const activeItem = visibleItems.find(item =>
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(item.href))
  );

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
      toaster.create({
        title: "Logout Failed",
        description: "Please try again or refresh the page",
        type: "error",
        duration: 5000,
      });
    }
  };

  const horizontalPadding = extraCompact ? 2 : (compact ? 3 : 4);

  // Loading state - show skeleton while checking auth
  if (isLoading) {
    return (
      <Box
        bg="theme.surface"
        borderBottom="1px solid"
        borderColor="theme.border"
        py={0}
        px={horizontalPadding}
        position={sticky ? "sticky" : "relative"}
        top={sticky ? 0 : "auto"}
        zIndex={1000}
      >
        <Container maxW="7xl">
          <Flex justify="space-between" align="center" minHeight="40px">
            {/* Logo skeleton */}
            {showLogo && (
              <Box w="200px" h="30px" bg="gray.200" borderRadius="md" />
            )}
            {/* Nav items skeleton */}
            <HStack gap={4} display={{ base: "none", lg: "flex" }}>
              <Box w="60px" h="20px" bg="gray.200" borderRadius="sm" />
              <Box w="80px" h="20px" bg="gray.200" borderRadius="sm" />
              <Box w="70px" h="20px" bg="gray.200" borderRadius="sm" />
            </HStack>
            {/* Auth button skeleton */}
            <Box w="70px" h="32px" bg="gray.200" borderRadius="md" />
          </Flex>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      as="nav"
      id="navigation"
      role="navigation"
      aria-label="Main navigation"
      bg="theme.surface"
      borderBottom="1px solid"
      borderColor="theme.border"
      py={0}
      px={horizontalPadding}
      position={sticky ? "sticky" : "relative"}
      top={sticky ? 0 : "auto"}
      zIndex={1000}
      backdropFilter="blur(10px)"
      transition="all 0.3s ease"
    >
      <Container maxW="7xl">
        <Flex justify="space-between" align="center" minHeight="40px">

          {/* Left: Logo or Menu Button */}
          <Flex align="center" gap={extraCompact ? 2 : 4}>
            {/* Mobile Menu Button - Show if there are nav items to display */}
            {visibleItems.length > 0 && (
              <Box display={{ base: "block", lg: "none" }}>
                <IconButton
                  aria-label="Menu"
                  variant="ghost"
                  onClick={onOpen}
                  size="sm"
                >
                  <IconMenu2 size={18} />
                </IconButton>
              </Box>
            )}

            {/* Logo */}
            {showLogo && (
              <Link href={homeHref} _hover={{ textDecoration: "none" }}>
                <Box transform="translateY(-15px)">
                  <CrossroadsLogo
                    size={extraCompact ? 248 : (compact ? 280 : 320)}
                    color={logoColor}
                  />
                </Box>
              </Link>
            )}
          </Flex>

          {/* Center: Navigation Items (Desktop) */}
          <HStack
            gap={extraCompact ? 3 : (compact ? 4 : 6)}
            display={{ base: "none", lg: "flex" }}
            fontSize={extraCompact ? "sm" : (compact ? "sm" : "md")}
          >
            {visibleItems.map((item) => (
              <Box key={item.key} position="relative">
                <NavItem
                  href={item.href}
                  isActive={activeItem?.key === item.key}
                  extraCompact={extraCompact}
                >
                  {item.label}
                </NavItem>
              </Box>
            ))}
          </HStack>

          {/* Right: Theme Selector + Auth Actions */}
          <HStack className="zippy" gap={extraCompact ? 1 : 3}>
            {identity && (
              <Button
                variant="ghost"
                size="sm"
                position="relative"
                aria-label="Notifications"
                onClick={onNotificationsOpen}
              >
                <IconBell size={18} />
                {unreadCount > 0 && (
                  <Badge
                    position="absolute"
                    top="-4px"
                    right="-4px"
                    colorScheme="red"
                    borderRadius="full"
                    px={1.5}
                    fontSize="10px"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            )}
            <Box transform={extraCompact ? "scale(0.85)" : "scale(1)"}>
              <ThemeSelector />
            </Box>

            {/* Auth Actions */}
            {identity ? (


              <MenuRoot positioning={{ placement: "bottom-end" }} >
                <MenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    display={{ base: "none", md: "flex" }}
                    gap={2}
                  >
                    <AvatarGroup size="xs">
                      <Avatar.Root>
                        <Avatar.Fallback>
                          {(identity.username || identity.email || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </Avatar.Fallback>
                        {avatarUrl && (
                          <Avatar.Image
                            src={avatarUrl}
                            alt={identity.username || identity.email || "User avatar"}
                          />
                        )}
                      </Avatar.Root>
                    </AvatarGroup>
                    <Text fontSize={extraCompact ? "xs" : "sm"}>
                      {identity.username || identity.email}
                    </Text>
                  </Button>
                </MenuTrigger>

                <MenuPositioner zIndex={1100}>
                  <MenuContent>
                    <MenuItem value="profile" asChild>
                      <Link as={NextLink} href="/profile" display="flex" gap={2}>
                        <IconUser size={16} />
                        Profile
                      </Link>
                    </MenuItem>
                    <MenuItem value="settings" asChild>
                      <Link as={NextLink} href={resolveHref('/member/{username}/settings')} display="flex" gap={2}>
                        <IconSettings size={16} />
                        Settings
                      </Link>
                    </MenuItem>
                    <MenuSeparator />
                    <MenuItem
                      value="logout"
                      onClick={handleLogout}
                      color="red.500"
                      _hover={{ bg: "red.50" }}
                    >
                      <Flex gap={2} align="center">
                        <IconLogout size={16} />
                        Logout
                      </Flex>
                    </MenuItem>
                  </MenuContent>
                </MenuPositioner>
              </MenuRoot>


            ) : (
              navSection === "public" && (
                <Link as={NextLink} href="/app/login">
                  <Button
                    size="sm"
                    variant="solid"
                    fontSize={extraCompact ? "xs" : "sm"}
                  >
                    Login
                  </Button>
                </Link>
              )
            )}
          </HStack>
        </Flex>
      </Container>

      {/* Mobile Drawer */}
      <Drawer.Root open={open} onOpenChange={({ open }) => (open ? onOpen() : onClose())} placement="start">
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxW="xs" bg="theme.surface" borderColor="theme.border">
            <Drawer.Header borderBottom="1px solid" borderColor="theme.border">
              <Flex justify="space-between" align="center" w="full">
                <Drawer.Title color="theme.text">Navigation</Drawer.Title>
                <IconButton
                  aria-label="Close menu"
                  variant="ghost"
                  onClick={onClose}
                  size="sm"
                >
                  <IconX size={16} />
                </IconButton>
              </Flex>
            </Drawer.Header>

            <Drawer.Body>
              <VStack gap={4} align="stretch" pt={4}>
                {visibleItems.map((item) => (
                  <Link
                    key={item.key}
                    as={NextLink}
                    href={item.href}
                    onClick={onClose}
                    color={activeItem?.key === item.key ? "theme.accent" : "theme.text"}
                    fontWeight={activeItem?.key === item.key ? "bold" : "medium"}
                    fontSize="md"
                    _hover={{ color: "theme.accent" }}
                  >
                    {item.shortLabel || item.label}
                  </Link>
                ))}

                {identity && (
                  <>
                    <Divider borderColor="theme.border" />
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      colorScheme="red"
                      justifyContent="flex-start"
                      w="full"
                    >
                      Logout
                    </Button>
                  </>
                )}

                {!identity && navSection === "public" && (
                  <>
                    <Divider borderColor="theme.border" />
                    <Link as={NextLink} href="/login" onClick={onClose}>
                      <Button variant="solid" w="full">
                        Login
                      </Button>
                    </Link>
                  </>
                )}
              </VStack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>

      {/* Notifications Drawer */}
      <Drawer.Root
        open={notificationsOpen}
        onOpenChange={({ open }) => (open ? onNotificationsOpen() : onNotificationsClose())}
        placement="end"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxW="sm" bg="theme.surface" borderColor="theme.border">
            <Drawer.Header borderBottom="1px solid" borderColor="theme.border">
              <Flex justify="space-between" align="center" w="full">
                <Drawer.Title color="theme.text">Notifications</Drawer.Title>
                <IconButton
                  aria-label="Close notifications"
                  variant="ghost"
                  onClick={onNotificationsClose}
                  size="sm"
                >
                  <IconX size={16} />
                </IconButton>
              </Flex>
            </Drawer.Header>

            <Drawer.Body>
              <Stack gap={4}>
                <Text color="fg.muted" fontSize="sm">
                  {unreadCount} unread
                </Text>

                {isNotificationsLoading && (
                  <Text color="fg.muted">Loading notifications...</Text>
                )}

                {!isNotificationsLoading && notificationsPreview.length === 0 && (
                  <Text color="fg.muted">No notifications yet.</Text>
                )}

                {!isNotificationsLoading && notificationsPreview.length > 0 && (
                  <Stack gap={3}>
                    {notificationsPreview.map((n) => (
                      <Box
                        key={n.id}
                        border="1px solid"
                        borderColor="theme.border"
                        borderRadius="md"
                        p={3}
                      >
                        <Stack gap={2}>
                          <Text fontSize="sm" color="fg.muted">
                            {n.bucket} · {n.priority}
                          </Text>
                          <Text fontWeight="semibold">
                            {n.actor_name ? `${n.actor_name} ` : ""}
                            {n.verb || "updated"}
                            {n.object_name ? ` ${n.object_name}` : ""}
                            {n.aggregate_count > 1 ? ` (${n.aggregate_count})` : ""}
                          </Text>
                          {n.action_url && (
                            <Link as={NextLink} href={n.action_url}>
                              Open
                            </Link>
                          )}
                          <HStack gap={2}>
                            {!n.is_read && (
                              <Button size="xs" variant="outline" onClick={() => markRead.mutate([n.id])}>
                                Mark read
                              </Button>
                            )}
                            <Button size="xs" variant="ghost" onClick={() => dismiss.mutate(n.id)}>
                              Dismiss
                            </Button>
                          </HStack>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}

                <Link as={NextLink} href="/notifications" onClick={onNotificationsClose}>
                  <Button variant="outline" size="sm" w="full">
                    View all notifications
                  </Button>
                </Link>
              </Stack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Box>
  );
}

// NavItem component
function NavItem({
  children,
  href,
  isActive = false,
  extraCompact = false,
}: {
  children: React.ReactNode;
  href: string;
  isActive?: boolean;
  extraCompact?: boolean;
}) {
  const label = String(children);

  return (
    <Link as={NextLink} href={href} _hover={{ textDecoration: "none" }}>
      <Box as="span" position="relative" display="inline-block">
        {/* Width spacer */}
        <Box
          as="span"
          fontWeight="700"
          visibility="hidden"
          whiteSpace="nowrap"
          fontSize={extraCompact ? "sm" : "inherit"}
        >
          {label}
        </Box>

        {/* Visible label */}
        <Box
          as="span"
          position="absolute"
          inset={0}
          display="inline-flex"
          alignItems="center"
          color={isActive ? "theme.text" : "theme.textSecondary"}
          fontWeight={isActive ? "700" : "400"}
          transition="color 0.2s ease, transform 0.2s ease"
          _hover={{
            color: "theme.accent",
            transform: extraCompact ? "translateY(-0.5px)" : "translateY(-1px)",
          }}
          pointerEvents="none"
          fontSize={extraCompact ? "sm" : "inherit"}
        >
          {label}
        </Box>
      </Box>
    </Link>
  );
}

// apps/crossroads/src/components/layout/UnifiedNavbar.tsx

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
} from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePermissions } from "@mixtape/auth/usePermissions";
import { ThemeSelector } from "@components/common/ThemeSelector";
import { IconMenu2, IconX, IconUser, IconSettings, IconLogout } from "@tabler/icons-react";
import { CrossroadsLogo } from "@components/common/CrossroadsLogo";
import { Divider } from "@components/common/Divider";
import { toaster } from "@mixtape/core/lib/toaster";

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
  { key: "about", label: "About", href: "/about", section: "public" },
  { key: "contact", label: "Contact", href: "/contact", section: "public" },

  // About section
  { key: "about", label: "About", href: "/about", section: "about" },
  { key: "join", label: "Join", href: "/about/join", section: "about" },
  { key: "explore", label: "Explore", href: "/about/public", section: "about" },
  { key: "how-it-works", label: "How It Works", href: "/about/how-it-works", section: "about" },

  // Authenticated section (members + admins)
  { key: "dashboard", label: "Dashboard", href: "/dashboard", section: "authenticated", memberOnly: true, shortLabel: "Dash" },
  { key: "constellation", label: "Constellation", href: "/demos/constellation", section: "authenticated", memberOnly: true, shortLabel: "Cons" },
  // { key: "threadworks", label: "Threadworks", href: "/threadworks", section: "authenticated", memberOnly: true, shortLabel: "Threads" },
  { key: "loom-codex", label: "Loom & Codex", href: "/loom-and-codex", section: "authenticated", memberOnly: true, shortLabel: "Codex" },
  { key: "dispatch", label: "Dispatch", href: "/dispatch", section: "authenticated", memberOnly: true, shortLabel: "Dispatch" },
  { key: "map", label: "Map", href: "/demos/map", section: "authenticated", memberOnly: true },
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
  const router = useRouter();
  const { user: identity, logout, isLoading } = useAuth();
  // const { isAdmin, isSteward, isMember } = usePermissions();
  // const { isAdmin, isSteward, isMember } = usePermissions({ user: identity });
  const { open, onOpen, onClose } = useDisclosure();
  const logoColor = useColorModeValue('black', 'white');
  const navBackground = useColorModeValue("rgba(255, 255, 255, 0.75)", "rgba(17, 24, 39, 0.75)");

  const avatarUrl = identity?.profile?.avatar_url?.trim() || undefined;

  // Auto-detect section if not provided
  const detectedSection: NavSection =
    section ||
    (pathname.startsWith("/about") ? "about" :
     identity && (pathname.startsWith("/dashboard") ||
                  pathname.startsWith("/groups") ||
                  pathname.startsWith("/constellation") ||
                  pathname.startsWith("/threadworks") ||
                  pathname.startsWith("/loom-and-codex") ||
                  pathname.startsWith("/dispatch") ||
                  pathname.startsWith("/map") ||
                  pathname.startsWith("/admin")) ? "authenticated" :
     "public");

  // For rendering purposes, both /admin and /dashboard use authenticated nav
  const navSection: NavSection = detectedSection;

  const { isAdmin, isSteward } = { isAdmin: false, isSteward: false };

  // Filter items based on current section and permissions
  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.section !== navSection) return false;
    if (item.adminOnly && !isAdmin) return false;
    if (item.stewardOnly && !isSteward) return false;
    if (item.memberOnly && !identity) return false;
    return true;
  });

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

  const verticalPadding = extraCompact ? 1 : (compact ? 2 : 3);
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
      bg={navBackground}
      borderBottom="1px solid"
      borderColor="theme.border"
      py={0}
      px={horizontalPadding}
      position={sticky ? "sticky" : "relative"}
      top={sticky ? 0 : "auto"}
      zIndex={1000}
      backdropFilter="blur(5px)"
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
              <Link as={NextLink} href="/" _hover={{ textDecoration: "none" }}>
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
          <HStack gap={extraCompact ? 1 : 3}>
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
                      <Link as={NextLink} href="/settings" display="flex" gap={2}>
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
                <Link as={NextLink} href="/login">
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
      <Drawer.Root open={open} onOpenChange={({ open }: { open: boolean }) => (open ? onOpen() : onClose())} placement="start">
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

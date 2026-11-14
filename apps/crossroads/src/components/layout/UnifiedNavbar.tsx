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
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ThemeSelector } from "@components/common/ThemeSelector";
import { IconChevronDown, IconMenu2, IconX, IconUser, IconLogout, IconLayoutDashboard } from "@tabler/icons-react";
import { CrossroadsLogo } from "@components/common/CrossroadsLogo";
import { Divider } from "@components/common/Divider";
import { toaster } from "@mixtape/core/lib/toaster";

// Keep navigation link focus readable independently of the theme accent.
const navLinkFocus = {
  _focusVisible: { outline: "3px solid", outlineColor: "ui.borderControl", outlineOffset: "2px" },
};

// Navigation item types
type NavSection = "public" | "authenticated" | "admin" | "protected";

interface NavChildItem {
  key: string;
  label: string;
  href: string;
}

interface NavItem {
  key: string;
  label: string;
  href: string;
  section: NavSection;
  adminOnly?: boolean;
  stewardOnly?: boolean;
  memberOnly?: boolean;
  shortLabel?: string;
  children?: NavChildItem[];
}

// Define all navigation items
const NAV_ITEMS: NavItem[] = [
  // Public section
  { key: "home", label: "Home", href: "/", section: "public" },
  {
    key: "products",
    label: "Products",
    href: "/products",
    section: "public",
    children: [
      { key: "products-overview", label: "Overview", href: "/products" },
      { key: "products-flow", label: "Catalyst Flow", href: "/products/flow" },
      { key: "products-principles", label: "Why Catalyst Works", href: "/products/principles" },
      { key: "products-rings", label: "Product B: Rings", href: "/products/rings" },
    ],
  },
  {
    key: "about",
    label: "About",
    href: "/about",
    section: "public",
    children: [
      { key: "about-overview", label: "Overview", href: "/about" },
      { key: "about-crossroads", label: "Crossroads", href: "/about/crossroads" },
      { key: "about-backstory", label: "Backstory", href: "/about/backstory" },
    ],
  },
  {
    key: "membership",
    label: "Membership",
    href: "/membership",
    section: "public",
    children: [
      { key: "membership-participation", label: "Participation", href: "/membership/levels" },
      { key: "membership-pricing", label: "Pricing", href: "/membership/pricing" },
      { key: "membership-joining", label: "Joining", href: "/membership/joining" },
      { key: "membership-reciprocity", label: "Reciprocity", href: "/membership/reciprocity" },
    ],
  },
  { key: "contact", label: "Contact", href: "/contact", section: "public" },

  // Authenticated section (members + admins)
  { key: "my-landing", label: "Storyline", href: "/members/{username}", section: "authenticated", memberOnly: true, shortLabel: "Story" },
  { key: "dashboard", label: "Dashboard", href: "/app/dashboard", section: "authenticated", memberOnly: true, shortLabel: "Dash" },
  { key: "help", label: "Help", href: "/app/help", section: "authenticated", memberOnly: true, shortLabel: "Help" },
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
  shrinkOnScroll?: boolean;
}

export default function UnifiedNavbar({
  section,
  sticky = true,
  showLogo = true,
  compact = false,
  extraCompact = true,
  shrinkOnScroll = true,
}: UnifiedNavbarProps) {
  const pathname = usePathname();
  const { user: identity, logout, isLoading } = useAuth();
  const { open, onOpen, onClose } = useDisclosure();

  const avatarUrl = identity?.profile?.avatar_url?.trim() || undefined;
  const publicSiteBase = process.env.NEXT_PUBLIC_SITE_URL || "https://www.crossroads.place";
  const loginHref =
    process.env.NODE_ENV === "development"
      ? "http://127.0.0.1:3011/app/login"
      : "/app/login";

  const isAdmin = !!(identity?.is_staff || identity?.is_superuser);
  const isSteward = !!(identity?.roles?.includes('steward')) || isAdmin;

  // Auto-detect section if not provided.
  // Straddle paths (/members/, /group/) show authenticated nav for logged-in users
  // so they can navigate back to their home base without losing context.
  const detectedSection: NavSection =
    section ||
    (identity && (pathname.startsWith("/dashboard") ||
                  pathname.startsWith("/groups") ||
                  pathname.startsWith("/members/") ||
                  pathname.startsWith("/member/") ||
                  pathname.startsWith("/group/") ||
                  pathname.startsWith("/constellation") ||
                  pathname.startsWith("/threadworks") ||
                  pathname.startsWith("/loom-and-codex") ||
                  pathname.startsWith("/dispatch") ||
                  pathname.startsWith("/map") ||
                  pathname.startsWith("/admin")) ? "authenticated" :
     "public");

  // For rendering purposes, both /admin and /dashboard use authenticated nav
  const navSection: NavSection = detectedSection;
  const getMemberProfileHref = () => {
    if (!identity?.username) return resolveHref('/members/{username}');
    let href = resolveHref('/members/{username}');
    if (typeof window !== 'undefined') {
      const storedTab = window.localStorage.getItem(`member_profile_last_tab:${identity.username}`);
      if (storedTab) {
        href = `${href}?tab=${encodeURIComponent(storedTab)}`;
      }
    }
    return href;
  };

  const resolveHref = (href: string) => {
    const resolved = identity?.username
      ? href.replace('{username}', identity.username)
      : href;
    if (resolved.startsWith('/members/')) {
      return `${publicSiteBase}${resolved}`;
    }
    return resolved;
  };

  const navPath = (href: string) => {
    if (href.startsWith('http')) {
      try {
        return new URL(href).pathname;
      } catch {
        return href;
      }
    }
    return href;
  };

  // Filter items based on current section and permissions
  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.section !== navSection) return false;
    if (item.adminOnly && !isAdmin) return false;
    if (item.stewardOnly && !isSteward) return false;
    if (item.memberOnly && !identity) return false;
    return true;
  }).map((item) => ({
    ...item,
    href: resolveHref(item.href),
    children: item.children?.map((child) => ({
      ...child,
      href: resolveHref(child.href),
    })),
  }));

  // Determine active item
  const activeItem = visibleItems.find(item =>
    pathname === navPath(item.href) ||
    (navPath(item.href) !== "/" && pathname.startsWith(navPath(item.href))) ||
    item.children?.some(child =>
      pathname === navPath(child.href) ||
      (navPath(child.href) !== "/" && pathname.startsWith(navPath(child.href)))
    )
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

  const [isShrunk, setIsShrunk] = useState(false);

  useEffect(() => {
    if (!shrinkOnScroll || typeof window === "undefined") return;

    const onScroll = () => setIsShrunk(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [shrinkOnScroll]);

  const shrink = shrinkOnScroll && isShrunk;
  const navMinHeight = shrink ? "38px" : "48px";
  const horizontalPadding = shrink ? 1 : (extraCompact ? 2 : (compact ? 3 : 4));
  const navFontSize = shrink ? "sm" : (extraCompact ? "md" : (compact ? "md" : "lg"));
  const navGap = shrink ? 3 : (extraCompact ? 6 : (compact ? 7 : 9));
  const themeScale = shrink ? "scale(0.85)" : (extraCompact ? "scale(0.95)" : "scale(1.05)");
  const logoSize = shrink
    ? (extraCompact ? 230 : (compact ? 260 : 300))
    : (extraCompact ? 272 : (compact ? 304 : 344));
  const logoOffset = shrink ? "translateY(-10px)" : "translateY(-15px)";

  // Loading state - show skeleton while checking auth
  if (isLoading) {
    return (
      <Box
        className="unav-loading"
        bg="theme.surface"
        borderBottom="1px solid"
        borderColor="ui.borderSubtle"
        py={0}
        px={horizontalPadding}
        position={sticky ? "sticky" : "relative"}
        top={sticky ? 0 : "auto"}
        zIndex={1000}
      >
        <Container className="unav-container" maxW="7xl">
          <Flex className="unav-bar" justify="space-between" align="center" minHeight={navMinHeight}>
            {/* Logo skeleton */}
            {showLogo && (
              <Box className="unav-placeholder" w="200px" h="30px" bg="ui.surfaceSubtle" borderRadius="md" />
            )}
            {/* Nav items skeleton */}
            <HStack gap={4} display={{ base: "none", lg: "flex" }}>
              <Box className="unav-placeholder" w="60px" h="20px" bg="ui.surfaceSubtle" borderRadius="sm" />
              <Box className="unav-placeholder" w="80px" h="20px" bg="ui.surfaceSubtle" borderRadius="sm" />
              <Box className="unav-placeholder" w="70px" h="20px" bg="ui.surfaceSubtle" borderRadius="sm" />
            </HStack>
            {/* Auth button skeleton */}
            <Box className="unav-placeholder" w="70px" h="32px" bg="ui.surfaceSubtle" borderRadius="md" />
          </Flex>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      className="unav-root"
      as="nav"
      id="navigation"
      role="navigation"
      aria-label="Main navigation"
      bg="theme.surface"
      color="theme.text"
      borderBottom="1px solid"
      borderColor="ui.borderSubtle"
      py={0}
      px={horizontalPadding}
      position={sticky ? "sticky" : "relative"}
      top={sticky ? 0 : "auto"}
      zIndex={1000}
      transition="all 0.3s ease"
    >
      <Container className="unav-container" maxW="7xl">
        <Flex className="unav-bar" justify="space-between" align="center" minHeight={navMinHeight}>

          {/* Left: Logo or Menu Button */}
          <Flex align="center" gap={shrink ? 2 : (extraCompact ? 2 : 4)}>
            {/* Mobile Menu Button - Show if there are nav items to display */}
            {visibleItems.length > 0 && (
              <Box display={{ base: "block", lg: "none" }}>
                <IconButton
                  aria-label="Menu"
                  variant="ghost"
                  onClick={onOpen}
                  size="md"
                >
                  <IconMenu2 size={18} />
                </IconButton>
              </Box>
            )}

            {/* Logo */}
            {showLogo && (
              <Link {...navLinkFocus} as={NextLink} href="/" aria-label="Crossroads home" _hover={{ textDecoration: "none" }}>
                <Box transform={logoOffset} aria-hidden="true">
                  <CrossroadsLogo
                    size={logoSize}
                    color="var(--theme-text)"
                  />
                </Box>
              </Link>
            )}
          </Flex>

          {/* Center: Navigation Items (Desktop) */}
          <HStack
            className="unav-desktop-links"
            gap={navGap}
            display={{ base: "none", lg: "flex" }}
            fontSize={navFontSize}
          >
            {visibleItems.map((item) => {
              const isActive = activeItem?.key === item.key;
              if (item.children?.length) {
                return (
                  <DesktopNavDropdown
                    key={item.key}
                    item={item}
                    isActive={isActive}
                    extraCompact={extraCompact || shrink}
                    compact={compact}
                  />
                );
              }

              return (
                <Box key={item.key} position="relative">
                  <NavItem
                    href={item.href}
                    isActive={isActive}
                    extraCompact={extraCompact || shrink}
                  >
                    {item.label}
                  </NavItem>
                </Box>
              );
            })}
          </HStack>

          {/* Right: Theme Selector + Auth Actions */}
          <HStack className="unav-actions" gap={shrink ? 1 : (extraCompact ? 1 : 3)}>
            <Box transform={themeScale}>
              <ThemeSelector />
            </Box>

            {/* Auth Actions */}
            {identity ? (


              <MenuRoot positioning={{ placement: "bottom-end" }} >
                <MenuTrigger asChild>
                  <Button
                    size={shrink ? "sm" : "md"}
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
                    <Text fontSize={shrink ? "sm" : (extraCompact ? "sm" : "md")}>
                      {identity.username || identity.email}
                    </Text>
                  </Button>
                </MenuTrigger>

                <MenuPositioner zIndex={1100}>
                  <MenuContent className="unav-menu" bg="theme.surface" color="theme.text" borderColor="ui.borderControl">
                    <MenuItem value="profile" asChild _highlighted={{ bg: "ui.surfaceSubtle", color: "theme.text" }}>
                      <Link {...navLinkFocus} as={NextLink} href={getMemberProfileHref()} display="flex" gap={2}>
                        <IconUser size={16} />
                        Profile
                      </Link>
                    </MenuItem>
                    <MenuItem value="settings" asChild _highlighted={{ bg: "ui.surfaceSubtle", color: "theme.text" }}>
                      <Link {...navLinkFocus} as={NextLink} href="/app/dashboard" display="flex" gap={2}>
                        <IconLayoutDashboard size={16} />
                        Dashboard
                      </Link>
                    </MenuItem>
                    <MenuSeparator />
                    <MenuItem
                      value="logout"
                      onClick={handleLogout}
                      color="status.danger.fg"
                      _hover={{ bg: "status.danger.bg", color: "status.danger.fg" }}
                      _highlighted={{ bg: "status.danger.bg", color: "status.danger.fg" }}
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
                <Link {...navLinkFocus} as={NextLink} href={loginHref}>
                  <Button
                    size={shrink ? "sm" : "md"}
                    variant="solid"
                    fontSize={shrink ? "sm" : (extraCompact ? "sm" : "md")}
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
        <Drawer.Backdrop className="unav-scrim" bg="ui.overlayScrim" />
        <Drawer.Positioner>
          <Drawer.Content className="unav-drawer" maxW="xs" bg="theme.surface" color="theme.text" borderColor="ui.borderControl">
            <Drawer.Header className="unav-drawer-header" borderBottom="1px solid" borderColor="ui.borderSubtle">
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

            <Drawer.Body className="unav-drawer-body">
              <VStack className="unav-drawer-links" gap={4} align="stretch" pt={4}>
                {visibleItems.map((item) => {
                  const isActive = activeItem?.key === item.key;
                  return (
                    <Box key={item.key}>
                      <Link {...navLinkFocus}
                        {...(item.href.startsWith('http')
                          ? { href: item.href }
                          : { as: NextLink, href: item.href })}
                        onClick={onClose}
                        aria-current={isActive ? "location" : undefined}
                        color="theme.text"
                        fontWeight={isActive ? "bold" : "medium"}
                        fontSize="md"
                        _hover={{ color: "theme.text" }}
                      >
                        {item.shortLabel || item.label}
                      </Link>
                      {item.children?.length && (
                        <VStack align="start" gap={2} pt={2} pl={4}>
                          {item.children.map((child) => {
                            const isChildActive = pathname === child.href;
                            return (
                            <Link {...navLinkFocus}
                              key={child.key}
                              {...(child.href.startsWith('http')
                                ? { href: child.href }
                                : { as: NextLink, href: child.href })}
                              onClick={onClose}
                              aria-current={isChildActive ? "page" : undefined}
                              color={isChildActive ? "theme.text" : "theme.textMuted"}
                              fontWeight={isChildActive ? "bold" : "medium"}
                              fontSize="sm"
                              _hover={{ color: "theme.text" }}
                            >
                              {child.label}
                            </Link>
                          );
                          })}
                        </VStack>
                      )}
                    </Box>
                  );
                })}

                {identity && (
                  <>
                    <Divider borderColor="ui.borderSubtle" />
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      color="status.danger.fg"
                      _hover={{ bg: "status.danger.bg", color: "status.danger.fg" }}
                      justifyContent="flex-start"
                      w="full"
                    >
                      Logout
                    </Button>
                  </>
                )}

                {!identity && navSection === "public" && (
                  <>
                    <Divider borderColor="ui.borderSubtle" />
                    <Link {...navLinkFocus} as={NextLink} href={loginHref} onClick={onClose}>
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
    <Link {...navLinkFocus} as={NextLink} href={href} aria-current={isActive ? "page" : undefined} _hover={{ textDecoration: "none" }}>
      <Box as="span" position="relative" display="inline-block">
        {/* Width spacer */}
        <Box
          as="span"
          fontWeight="700"
          visibility="hidden"
          whiteSpace="nowrap"
          fontSize={extraCompact ? "md" : "inherit"}
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
          color={isActive ? "theme.text" : "theme.textMuted"}
          fontWeight={isActive ? "700" : "400"}
          transition="color 0.2s ease, transform 0.2s ease"
          _hover={{
            color: "theme.text",
            transform: extraCompact ? "translateY(-0.5px)" : "translateY(-1px)",
          }}
          pointerEvents="none"
          fontSize={extraCompact ? "md" : "inherit"}
        >
          {label}
        </Box>
      </Box>
    </Link>
  );
}

function DesktopNavDropdown({
  item,
  isActive,
  extraCompact,
  compact,
}: {
  item: NavItem;
  isActive: boolean;
  extraCompact: boolean;
  compact: boolean;
}) {
  const [open, setOpen] = useState(false);
  const openDelayMs = 120;
  const closeDelayMs = 220;
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const scheduleOpen = () => {
    clearTimers();
    openTimer.current = setTimeout(() => setOpen(true), openDelayMs);
  };

  const scheduleClose = () => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), closeDelayMs);
  };

  return (
    <Box className="unav-dropdown" onMouseEnter={scheduleOpen} onMouseLeave={scheduleClose}>
      <MenuRoot
        open={open}
        onOpenChange={({ open }) => setOpen(open)}
        positioning={{ placement: "bottom-start" }}
      >
        <MenuTrigger asChild>
          <Button
            variant="ghost"
            size={extraCompact || compact ? "sm" : "md"}
            px={0}
            py={1}
            height="auto"
            fontWeight={isActive ? "700" : "400"}
            color={isActive ? "theme.text" : "theme.textMuted"}
            _hover={{ color: "theme.text" }}
            _active={{ bg: "transparent" }}
            _focusVisible={{ boxShadow: "none" }}
          >
            {item.label}
            <Box as="span" display="inline-flex" ml={0}>
              <IconChevronDown size={14} />
            </Box>
          </Button>
        </MenuTrigger>
        <MenuPositioner zIndex={1100}>
          <MenuContent className="unav-menu" bg="theme.surface" color="theme.text" borderColor="ui.borderControl">
            {item.children?.map((child) => (
              <MenuItem key={child.key} value={child.key} asChild _highlighted={{ bg: "ui.surfaceSubtle", color: "theme.text" }}>
                <Link {...navLinkFocus} as={NextLink} href={child.href} display="flex" gap={2}>
                  {child.label}
                </Link>
              </MenuItem>
            ))}
          </MenuContent>
        </MenuPositioner>
      </MenuRoot>
    </Box>
  );
}

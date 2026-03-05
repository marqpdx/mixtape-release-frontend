// apps/mixtape/src/components/common/DashboardLayout.tsx

"use client";

import {
  Box,
  Flex,
  VStack,
  Text,
  Tabs,
  Popover,
  Collapsible,
  useDisclosure,
  useBreakpointValue,
  Stack,
  HStack,
  IconButton,
  Button,
} from "@chakra-ui/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
// import { IconChevronRight } from "@tabler/icons-react";
// import { Button } from "@theme/recipes/button.recipe";
// import { ChevronIcon } from "@components/icons/IconMap";

// Import shared types
import {
  MenuItem,
  WorkAreaProps,
  DashboardLayoutProps
} from "@components/dashboard/shared/types";
import { IconArrowForward, IconChevronRight, IconFold } from "@tabler/icons-react";
import { openParentForSection } from "@components/groups/navigationUtils";

export default function DashboardLayout({
  title,
  header,
  menuItems,
  defaultSection,
  defaultOpenParentMap = {},
  userRoles = [],
  WorkAreaComponent,
  workAreaProps = {},
  loading = false,
  localStorageKey = "dashboardActiveSection",
}: DashboardLayoutProps) {
  void title;
  void defaultOpenParentMap;
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [allExpanded, setAllExpanded] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidth = sidebarCollapsed ? "50px" : "230px";
  const [showBubbleNote, setShowBubbleNote] = useState(false);
  const [bubbleFading, setBubbleFading] = useState(false);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasCollapsedByOutline = useRef(false);

  // Listen for outline panel open/close events from WriteComposer
  useEffect(() => {
    const handleOutlineOpened = () => {
      if (!sidebarCollapsed) {
        wasCollapsedByOutline.current = true;
        setSidebarCollapsed(true);
        // Show bubble note after sidebar finishes collapsing
        setTimeout(() => {
          setShowBubbleNote(true);
          setBubbleFading(false);
          // Start fade after 3.5s
          bubbleTimerRef.current = setTimeout(() => {
            setBubbleFading(true);
            // Remove from DOM after fade animation
            setTimeout(() => setShowBubbleNote(false), 400);
          }, 3500);
        }, 250);
      }
    };
    const handleOutlineClosed = () => {
      if (wasCollapsedByOutline.current) {
        wasCollapsedByOutline.current = false;
        setSidebarCollapsed(false);
        setShowBubbleNote(false);
        if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      }
    };
    window.addEventListener('outline-panel-opened', handleOutlineOpened);
    window.addEventListener('outline-panel-closed', handleOutlineClosed);
    return () => {
      window.removeEventListener('outline-panel-opened', handleOutlineOpened);
      window.removeEventListener('outline-panel-closed', handleOutlineClosed);
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    };
  }, [sidebarCollapsed]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const isMobile = useBreakpointValue({ base: true, md: false });

  const textColor = "theme.text";
  const borderColor = "theme.border";
  const subtleTextColor = "theme.textSecondary";
  void expandedSections;
  void subtleTextColor;
  const sidebarBg = "theme.bgSecondary";

  // Load active section from localStorage with custom key
  const [activeSection, setActiveSection] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(localStorageKey);
      return stored || defaultSection;
    }
    return defaultSection;
  });

  const [sectionParams, setSectionParams] = useState<Record<string, string>>({});
  const searchParams = useSearchParams();
  const urlSection = searchParams?.get("section");

  // Update the handler to accept parameters
  const handleSetActiveSection = useCallback((section: string, params?: Record<string, string>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(localStorageKey, section);
      // Optionally store params in localStorage too, or just keep in state
      if (params) {
        localStorage.setItem(`${localStorageKey}_params`, JSON.stringify(params));
      }
    }
    setActiveSection(section);
    setSectionParams(params || {});
  }, [localStorageKey]);

  useEffect(() => {
    if (!urlSection) return;
    const params: Record<string, string> = {};
    if (searchParams) {
      for (const [key, value] of searchParams.entries()) {
        if (key === "section" || key === "view") continue;
        params[key] = value;
      }
    }
    handleSetActiveSection(urlSection, Object.keys(params).length ? params : undefined);
  }, [urlSection, handleSetActiveSection, searchParams]);

  // function handleSetActiveSection(section: string) {
  //   if (typeof window !== 'undefined') {
  //     localStorage.setItem(localStorageKey, section);
  //   }
  //   setActiveSection(section);
  // }

  // Filter menu items based on user roles (if role system is used)
  const isAdmin = userRoles.includes("admin");
  const getVisibleMenuItems = () => {
    return menuItems.filter((item) => {
      if (item.hidden) return false;
      if (item.adminOnly && !isAdmin) return false;
      return true;
    });
  };

  const visibleMenuItems = getVisibleMenuItems();

  const toggleAllAccordions = () => {
    if (allExpanded) {
      setExpandedSections([]);
      setOpenSections({});
    } else {
      const allKeys = menuItems.map(item => item.key);
      setExpandedSections(allKeys);
      const openAll = allKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {});
      setOpenSections(openAll);
    }
    setAllExpanded(!allExpanded);
  };

  // Open parent sections on load
  useEffect(() => {
    if (!activeSection) return;

    openParentForSection(activeSection, setOpenSections, visibleMenuItems);
    const parentKey = findParentKeyForSection(activeSection, visibleMenuItems);

    if (parentKey) {
      setOpenSections(prev => ({
        ...prev,
        [parentKey]: true,
      }));
    }
  }, [activeSection, visibleMenuItems]);

  const findParentKeyForSection = (sectionKey: string, menuItems: MenuItem[]): string | null => {
    for (const item of menuItems) {
      if (item.subItems?.some(sub => sub.key === sectionKey)) {
        return item.key;
      }
    }
    return null;
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  const primaryTabs = visibleMenuItems.slice(0, 3);
  const overflowTabs = visibleMenuItems.slice(3);

  return (
    <Box className="dashboard-layout" bg="theme.bg" minH="100vh">
      {header && <Box>{header}</Box>}
      {isMobile ? (
        <MobileTabs
          activeSection={activeSection}
          setActiveSection={handleSetActiveSection}
          primaryTabs={primaryTabs}
          overflowTabs={overflowTabs}
          WorkAreaComponent={WorkAreaComponent}
          workAreaProps={workAreaProps}
          header={header}
        />
      ) : (
        <Flex h="100vh" position="relative">
          {/* Bubble note — positioned outside sidebar to avoid overflow:hidden clipping */}
          {showBubbleNote && (
            <Box
              position="absolute"
              top="18px"
              left="58px"
              bg="gray.600"
              color="white"
              fontSize="xs"
              px={3}
              py={1.5}
              borderRadius="md"
              whiteSpace="nowrap"
              zIndex={10}
              opacity={bubbleFading ? 0 : 1}
              transition="opacity 0.4s ease"
              pointerEvents="none"
              _after={{
                content: '""',
                position: "absolute",
                top: "50%",
                right: "100%",
                transform: "translateY(-50%)",
                borderWidth: "5px",
                borderStyle: "solid",
                borderColor: "transparent",
                borderRightColor: "gray.700",
              }}
            >
              Click here to expand side nav
            </Box>
          )}
          {/* SINGLE Left Navigation Sidebar */}
          <Box
            w={sidebarWidth}
            bg={sidebarBg}
            borderRight="1px solid"
            borderColor={borderColor}
            transition="width 0.2s"
            overflow="hidden"
            display="flex"
            flexDirection="column"
          >
            {/* Sidebar Header */}
            <Box p={3} borderBottom="1px solid" borderColor={borderColor} minH="60px">
              <HStack justify="space-between" h="full" align="center">
                <HStack
                  cursor="pointer"
                  onClick={() => {
                    const newCollapsed = !sidebarCollapsed;
                    setSidebarCollapsed(newCollapsed);
                    // If user manually expands after auto-collapse, clear the flag
                    if (!newCollapsed && wasCollapsedByOutline.current) {
                      wasCollapsedByOutline.current = false;
                    }
                    // Dismiss bubble on click
                    if (showBubbleNote) {
                      setShowBubbleNote(false);
                      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
                    }
                  }}
                  _hover={{ opacity: 0.7 }}
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  h="full"
                  align="center"
                >
                  <Text fontSize="md" fontWeight="bold" color={textColor} lineHeight="1">
                    📒
                  </Text>
                  {!sidebarCollapsed && (
                    <Text fontSize="lg" fontWeight="bold" color={textColor} lineHeight="1">
                      Details
                    </Text>
                  )}
                </HStack>

                {/* Only show accordion controls when expanded */}
                {!sidebarCollapsed && (
                  <IconButton
                    size="xs"
                    variant="ghost"
                    onClick={toggleAllAccordions}
                    title={allExpanded ? "Collapse all sections" : "Expand all sections"}
                  >
                    {allExpanded ? <IconFold /> : <IconArrowForward />}
                  </IconButton>
                )}
              </HStack>
            </Box>

            {/* Menu Items */}
            <VStack align="stretch" gap={0} flex="1" overflowY="auto" className="zzyz">
              {visibleMenuItems.map((menuItem) => {
                const filteredSubItems = menuItem.subItems?.filter((sub) => {
                  if (sub.hidden) return false;
                  if (sub.adminOnly && !isAdmin) return false;
                  return true;
                });

                if (filteredSubItems?.length === 0) {
                  return null;
                }

                return (
                  <Collapsible.Root
                    key={menuItem.key}
                    open={openSections[menuItem.key]}
                    onOpenChange={(details: { open: boolean } | boolean) => {
                      const openValue = typeof details === "boolean" ? details : details.open ?? false;
                      setOpenSections((prev) => ({
                        ...prev,
                        [menuItem.key]: openValue,
                      }));
                    }}
                  >
                    <Collapsible.Trigger
                      w="100%"
                      px={3}
                      py={2}
                      fontWeight="bold"
                      textAlign="left"
                      _hover={{ bg: "theme.surface" }}
                      borderRadius="none"
                      onClick={(e: React.MouseEvent) => {
                        // If sidebar is collapsed, expand it and open this section
                        if (sidebarCollapsed) {
                          e.stopPropagation(); // Prevent collapsible toggle
                          setSidebarCollapsed(false);
                          setOpenSections((prev) => ({
                            ...prev,
                            [menuItem.key]: true,
                          }));
                        }
                      }}
                    >
                      <HStack>
                        {!sidebarCollapsed && (
                          <>
                            {menuItem.icon && (
                              <Text fontSize="md">{menuItem.icon}</Text>
                            )}
                            <Text>{menuItem.label}</Text>
                            <IconChevronRight />
                          </>
                        )}
                        {sidebarCollapsed && menuItem.icon && (
                          <Text
                            title={`${menuItem.label}, click to expand`}
                            fontSize="md"
                          >
                            {menuItem.icon}
                          </Text>
                        )}
                      </HStack>
                    </Collapsible.Trigger>

                    {!sidebarCollapsed && (
                      <Collapsible.Content>
                        <Stack gap={0} pl={4} py={1}>
                          {filteredSubItems?.map((sub) => (
                            <Button
                              key={sub.key}
                              variant={activeSection === sub.key ? "solid" : "ghost"}
                              colorScheme={activeSection === sub.key ? "green" : undefined}
                              justifyContent="flex-start"
                              w="100%"
                              size="sm"
                              borderRadius="none"
                              onClick={() => handleSetActiveSection(sub.key)}
                            >
                              {sub.label}
                            </Button>
                          ))}
                        </Stack>
                      </Collapsible.Content>
                    )}
                  </Collapsible.Root>
                );
              })}
            </VStack>
          </Box>

          {/* Right Work Area */}
          <Box flex="1" p={0} overflowY="auto">
            <WorkAreaComponent
              section={activeSection}
              sectionParams={sectionParams}
              setActiveSection={handleSetActiveSection}
              {...workAreaProps}
            />
          </Box>
        </Flex>
      )}
    </Box>
  );
}


function MobileTabs({
  activeSection,
  setActiveSection,
  primaryTabs,
  overflowTabs,
  WorkAreaComponent,
  workAreaProps,
  header,
}: {
  activeSection: string;
  setActiveSection: (section: string) => void;
  primaryTabs: MenuItem[];
  overflowTabs: MenuItem[];
  WorkAreaComponent: React.ComponentType<WorkAreaProps>;
  workAreaProps: Record<string, unknown>;
  header?: React.ReactNode;
}) {
  const { open, onOpen, onClose } = useDisclosure();

  // Build map to lookup subitems for top-level menu
  const menuMap: Record<string, MenuItem | undefined> = {};
  [...primaryTabs, ...overflowTabs].forEach((item) => {
    menuMap[item.key] = item;
  });

  // Find parent key for activeSection
  let activeTopLevelKey = null;
  for (const key in menuMap) {
    const item = menuMap[key];
    if (item?.subItems?.some((sub) => sub.key === activeSection)) {
      activeTopLevelKey = key;
      break;
    }
  }

  // Find subitems for currently active top-level tab
  const activeTopLevelItem = menuMap[activeTopLevelKey ?? activeSection];
  const subItems = activeTopLevelItem?.subItems || [];

  return (
    <Box className="dashboard-layout">
      {header && <Box mb={4}>{header}</Box>}
      <Tabs.Root
        value={activeTopLevelKey || activeSection}
        onValueChange={(details) => {
          const selectedKey = details.value;
          const selectedItem = menuMap[selectedKey];
          if (selectedItem?.subItems?.length) {
            const firstSubKey = selectedItem.subItems[0].key;
            setActiveSection(firstSubKey);
          } else {
            setActiveSection(selectedKey);
          }
        }}
      >
        <Tabs.List gap={2} mb={4}>
          {primaryTabs.map((item) => (
            <Tabs.Trigger
              key={item.key}
              value={item.key}
              px={3}
              py={2}
              borderRadius="md"
              _selected={{
                bg: "theme.accent",
                color: "white",
              }}
            >
              {item.icon && <Text mr={2}>{item.icon}</Text>}
              {item.label}
            </Tabs.Trigger>
          ))}

          {overflowTabs.length > 0 && (
            <Popover.Root
              open={open}
              onOpenChange={({ open }: { open: boolean }) => {
                if (open) onOpen();
                else onClose();
              }}
            >
              <Popover.Trigger asChild>
                <Button px={3} py={2}>
                  More ▾
                </Button>
              </Popover.Trigger>

              <Popover.Positioner>
                <Popover.Content borderRadius="md" p={2}>
                  <Popover.CloseTrigger />
                  <Popover.Arrow>
                    <Popover.ArrowTip />
                  </Popover.Arrow>
                  <Popover.Body>
                    <VStack align="stretch" gap={2}>
                      {overflowTabs.map((item) => (
                        <Button
                          key={item.key}
                          justifyContent="flex-start"
                          onClick={() => {
                            const subItems = item.subItems || [];
                            if (subItems.length > 0) {
                              setActiveSection(subItems[0].key);
                            } else {
                              setActiveSection(item.key);
                            }
                            onClose();
                          }}
                        >
                          {item.icon && <Text mr={2}>{item.icon}</Text>}
                          {item.label}
                        </Button>
                      ))}
                    </VStack>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Popover.Root>
          )}
        </Tabs.List>

        {/* Render subitems if they exist */}
        {subItems.length > 0 && (
          <VStack align="stretch" gap={2} mb={4}>
            {subItems.map((sub) => (
              <Button
                key={sub.key}
                variant={activeSection === sub.key ? "solid" : "ghost"}
                colorScheme={activeSection === sub.key ? "green" : undefined}
                justifyContent="flex-start"
                onClick={() => setActiveSection(sub.key)}
              >
                {sub.label}
              </Button>
            ))}
          </VStack>
        )}

        {/* Show content of current section */}
        <WorkAreaComponent
          section={activeSection}
          setActiveSection={setActiveSection}
          {...workAreaProps}
        />
      </Tabs.Root>
    </Box>
  );
}

// Re-export types for convenience
export type { MenuItem, WorkAreaProps, DashboardLayoutProps };

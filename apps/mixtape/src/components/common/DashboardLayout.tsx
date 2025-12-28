// src/components/shared/DashboardLayout.tsx

"use client";

import {
  Box,
  Flex,
  Heading,
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
import { useState, useEffect } from "react";
// import { IconChevronRight } from "@tabler/icons-react";
// import { Button } from "@theme/recipes/button.recipe";
// import { ChevronIcon } from "@components/icons/IconMap";

// Import shared types
import {
  MenuItem,
  WorkAreaProps,
  DashboardLayoutProps
} from "@components/dashboard/shared/types";
import { useColorModeValue } from "@components/ui/color-mode";
import { IconArrowForward, IconChevronLeft, IconChevronRight, IconFold, IconPlaceholder } from "@tabler/icons-react";
import { openParentForSection } from "@components/groups/navigationUtils";

export default function DashboardLayout({
  title,
  menuItems,
  defaultSection,
  defaultOpenParentMap = {},
  userRoles = [],
  WorkAreaComponent,
  workAreaProps = {},
  loading = false,
  localStorageKey = "dashboardActiveSection",
}: DashboardLayoutProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [allExpanded, setAllExpanded] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidth = sidebarCollapsed ? "50px" : "230px";

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const isMobile = useBreakpointValue({ base: true, md: false });

  const textColor = useColorModeValue('gray.800', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const subtleTextColor = useColorModeValue('gray.600', 'gray.400');
  const sidebarBg = useColorModeValue('white', 'gray.800');

  // Load active section from localStorage with custom key
  const [activeSection, setActiveSection] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(localStorageKey);
      return stored || defaultSection;
    }
    return defaultSection;
  });

  const [sectionParams, setSectionParams] = useState<Record<string, string>>({});

  // Update the handler to accept parameters
  function handleSetActiveSection(section: string, params?: Record<string, string>) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(localStorageKey, section);
      // Optionally store params in localStorage too, or just keep in state
      if (params) {
        localStorage.setItem(`${localStorageKey}_params`, JSON.stringify(params));
      }
    }
    setActiveSection(section);
    setSectionParams(params || {});
  }

  // function handleSetActiveSection(section: string) {
  //   if (typeof window !== 'undefined') {
  //     localStorage.setItem(localStorageKey, section);
  //   }
  //   setActiveSection(section);
  // }

  // Filter menu items based on user roles (if role system is used)
  const getVisibleMenuItems = () => {
    if (userRoles.length === 0) return menuItems;
    return menuItems.filter((item) => {
      if (item.hidden) return false;
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
    <Box className="dashboard-layout" bg="bg.main" minH="100vh">
      {isMobile ? (
        <MobileTabs
          activeSection={activeSection}
          setActiveSection={handleSetActiveSection}
          primaryTabs={primaryTabs}
          overflowTabs={overflowTabs}
          WorkAreaComponent={WorkAreaComponent}
          workAreaProps={workAreaProps}
        />
      ) : (
        <Flex h="100vh">
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
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  _hover={{ opacity: 0.7 }}
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  h="full"
                  align="center"
                >
                  <Text fontSize="md" fontWeight="bold" color={textColor} lineHeight="1">
                    🎧
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
                  return true;
                });

                if (filteredSubItems?.length === 0) {
                  return null;
                }

                return (
                  <Collapsible.Root
                    key={menuItem.key}
                    open={openSections[menuItem.key]}
                    onOpenChange={(open) => {
                      const openValue = typeof open === "boolean" ? open : open?.open ?? false;
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
                      _hover={{ bg: "gray.100" }}
                      borderRadius="none"
                      onClick={(e) => {
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
}: {
  activeSection: string;
  setActiveSection: (section: string) => void;
  primaryTabs: MenuItem[];
  overflowTabs: MenuItem[];
  WorkAreaComponent: React.ComponentType<WorkAreaProps>;
  workAreaProps: Record<string, any>;
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
                bg: "blue.500",
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
              onOpenChange={(open) => {
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
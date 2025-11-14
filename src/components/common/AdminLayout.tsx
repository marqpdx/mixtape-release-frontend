// src/components/shared/AdminLayout.tsx

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
} from "@chakra-ui/react";
import { useState, useEffect, ReactNode } from "react";
import { Button } from "@theme/recipes/button.recipe";
import { ChevronIcon } from "@components/icons/IconMap";
import { openParentForSection } from "@components/groups/navigationUtils";

export interface MenuItem {
  key: string;
  label: string;
  minRole?: string;
  hidden?: boolean;
  exclude?: string[];
  subItems?: MenuItem[];
}

export interface AdminLayoutProps {
  title: string;
  menuItems: MenuItem[];
  defaultSection: string;
  defaultOpenParentMap?: Record<string, string>;
  userRoles?: string[];
  WorkAreaComponent: React.ComponentType<WorkAreaProps>;
  workAreaProps?: Record<string, any>;
  loading?: boolean;
  localStorageKey?: string;
}

export interface WorkAreaProps {
  section: string;
  setActiveSection: (section: string) => void;
  [key: string]: any;
}

export default function AdminLayout({
  title,
  menuItems,
  defaultSection,
  defaultOpenParentMap = {},
  userRoles = [],
  WorkAreaComponent,
  workAreaProps = {},
  loading = false,
  localStorageKey = "adminActiveSection",
}: AdminLayoutProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Load active section from localStorage with custom key
  const [activeSection, setActiveSection] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(localStorageKey);
      return stored || defaultSection;
    }
    return defaultSection;
  });

  function handleSetActiveSection(section: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(localStorageKey, section);
    }
    setActiveSection(section);
  }

  // Filter menu items based on user roles (if role system is used)
  const getVisibleMenuItems = () => {
    if (userRoles.length === 0) return menuItems; // No role filtering

    return menuItems.filter((item) => {
      if (item.hidden) return false;
      // Add role-based filtering logic here if needed
      return true;
    });
  };

  const visibleMenuItems = getVisibleMenuItems();

  // Open parent sections on load - ensures the collapsible containing the active section is open
  useEffect(() => {
    if (!activeSection) return;

    console.log("🔍 AdminLayout - trying to open parent for section:", activeSection);
    console.log("🔍 AdminLayout - available menuItems:", visibleMenuItems);

    // Try the existing openParentForSection function first
    openParentForSection(activeSection, setOpenSections, visibleMenuItems);

    // Fallback: manually find and open the parent
    const parentKey = findParentKeyForSection(activeSection, visibleMenuItems);
    console.log("🔍 AdminLayout - found parent key:", parentKey);

    if (parentKey) {
      setOpenSections(prev => {
        console.log("🔍 AdminLayout - setting open sections, prev:", prev);
        const newState = {
          ...prev,
          [parentKey]: true,
        };
        console.log("🔍 AdminLayout - new open sections:", newState);
        return newState;
      });
    }
  }, [activeSection, visibleMenuItems]);

  // Helper function to find which parent menu contains a given section (fallback if openParentForSection doesn't work)
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

  // Mobile tabs logic
  const primaryTabs = visibleMenuItems.slice(0, 3);
  const overflowTabs = visibleMenuItems.slice(3);

  return (
    <Box>
      <Box mb={4}>
        <Heading size="lg">{title}</Heading>
      </Box>

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
        <Flex>
          {/* Left Navigation */}
          <Box
            w="19%"
            borderRight="1px solid #ddd"
            minH="80vh"
            p={0}
          >
            <VStack align="stretch" gap={2}>
              {visibleMenuItems.map((menuItem) => {
                const filteredSubItems = menuItem.subItems?.filter((sub) => {
                  if (sub.hidden) return false;
                  // Add role-based filtering here if needed
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
                      const openValue =
                        typeof open === "boolean" ? open : open?.open ?? false;

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
                      _hover={{ bg: "gray.500" }}
                    >
                      <HStack>
                        {menuItem.label}
                        <ChevronIcon />
                      </HStack>
                    </Collapsible.Trigger>
                    <Collapsible.Content className="admin-menu-content">
                      <Stack gap={0} mt={2} pl={2}>
                        {filteredSubItems?.map((sub) => (
                          <Button
                            key={sub.key}
                            mb={2}
                            // visual={
                            //   activeSection === sub.key
                            //     ? "solidCenter"
                            //     : "outlineMain1"
                            // }
                            justifyContent="flex-start"
                            w="100%"
                            onClick={() => handleSetActiveSection(sub.key)}
                          >
                            {sub.label}
                          </Button>
                        ))}
                      </Stack>
                    </Collapsible.Content>
                  </Collapsible.Root>
                );
              })}
            </VStack>
          </Box>

          {/* Right Work Area */}
          <Box w="85%" p={4}>
            <WorkAreaComponent
              section={activeSection}
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
    <Box>
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
                // visual={activeSection === sub.key ? "solidMain1" : "outlineMain1"}
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
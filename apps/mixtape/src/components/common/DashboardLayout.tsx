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
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  MenuItem,
  WorkAreaProps,
  DashboardLayoutProps,
} from "@components/dashboard/shared/types";
import {
  IconArrowForward,
  IconChevronRight,
  IconFold,
} from "@tabler/icons-react";
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
  constrainToViewport = true,
}: DashboardLayoutProps) {
  void title;
  void defaultOpenParentMap;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidth = sidebarCollapsed ? "50px" : "230px";

  const [showBubbleNote, setShowBubbleNote] = useState(false);
  const [bubbleFading, setBubbleFading] = useState(false);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasCollapsedByOutline = useRef(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const textColor = "theme.text";
  const borderColor = "theme.border";
  const sidebarBg = "theme.bgSecondary";

  const [activeSection, setActiveSection] = useState<string>(() => {
    const isInMenu = (key: string) =>
      menuItems.some(
        (item) => item.key === key || item.subItems?.some((sub) => sub.key === key)
      );

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(localStorageKey);
      if (stored && isInMenu(stored)) return stored;
    }

    // defaultSection may refer to a section the current user can't access
    // (e.g. steward without the required decorator). Fall through to first
    // visible section rather than landing on "Access Denied".
    if (isInMenu(defaultSection)) return defaultSection;

    for (const item of menuItems) {
      if (item.subItems?.length) {
        const visible = item.subItems.find((sub) => !sub.hidden);
        if (visible) return visible.key;
      } else if (!item.hidden) {
        return item.key;
      }
    }
    return defaultSection;
  });

  const [sectionParams, setSectionParams] = useState<Record<string, string>>(
    () => {
      if (typeof window !== "undefined") {
        const storedParams = localStorage.getItem(`${localStorageKey}_params`);
        if (storedParams) {
          try {
            return JSON.parse(storedParams) as Record<string, string>;
          } catch {
            return {};
          }
        }
      }
      return {};
    }
  );

  const searchParams = useSearchParams();
  const urlSection = searchParams?.get("section");

  const isAdmin = useMemo(() => userRoles.includes("admin"), [userRoles]);
  const isSuperuser = useMemo(
    () => userRoles.includes("superuser"),
    [userRoles]
  );

  const isMenuItemVisible = useCallback(
    (item: MenuItem) => {
      if (item.hidden) return false;
      if (item.adminOnly && !isAdmin) return false;
      if (item.superuserOnly && !isSuperuser) return false;
      return true;
    },
    [isAdmin, isSuperuser]
  );

  const visibleMenuItems = useMemo(() => {
    return menuItems
      .filter(isMenuItemVisible)
      .map((item) => ({
        ...item,
        subItems: item.subItems?.filter(isMenuItemVisible),
      }))
      .filter((item) => !item.subItems || item.subItems.length > 0);
  }, [menuItems, isMenuItemVisible]);

  const firstVisibleSection = useMemo(() => {
    for (const item of visibleMenuItems) {
      if (item.subItems?.length) {
        return item.subItems[0].key;
      }
      return item.key;
    }
    return defaultSection;
  }, [visibleMenuItems, defaultSection]);

  const primaryTabs = useMemo(
    () => visibleMenuItems.slice(0, 3),
    [visibleMenuItems]
  );

  const overflowTabs = useMemo(
    () => visibleMenuItems.slice(3),
    [visibleMenuItems]
  );

  const findParentKeyForSection = useCallback(
    (sectionKey: string, items: MenuItem[]): string | null => {
      for (const item of items) {
        if (item.subItems?.some((sub) => sub.key === sectionKey)) {
          return item.key;
        }
      }
      return null;
    },
    []
  );

  const handleSetActiveSection = useCallback(
    (section: string, params?: Record<string, string>) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(localStorageKey, section);
        if (params && Object.keys(params).length > 0) {
          localStorage.setItem(
            `${localStorageKey}_params`,
            JSON.stringify(params)
          );
        } else {
          localStorage.removeItem(`${localStorageKey}_params`);
        }
      }

      setActiveSection((prev) => (prev === section ? prev : section));
      setSectionParams((prev) => {
        const next = params || {};
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(next);

        if (
          prevKeys.length === nextKeys.length &&
          prevKeys.every((key) => prev[key] === next[key])
        ) {
          return prev;
        }

        return next;
      });
    },
    [localStorageKey]
  );

  useEffect(() => {
    const handleOutlineOpened = () => {
      if (!sidebarCollapsed) {
        wasCollapsedByOutline.current = true;
        setSidebarCollapsed(true);

        setTimeout(() => {
          setShowBubbleNote(true);
          setBubbleFading(false);

          bubbleTimerRef.current = setTimeout(() => {
            setBubbleFading(true);
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

        if (bubbleTimerRef.current) {
          clearTimeout(bubbleTimerRef.current);
        }
      }
    };

    window.addEventListener("outline-panel-opened", handleOutlineOpened);
    window.addEventListener("outline-panel-closed", handleOutlineClosed);

    return () => {
      window.removeEventListener("outline-panel-opened", handleOutlineOpened);
      window.removeEventListener("outline-panel-closed", handleOutlineClosed);
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
      }
    };
  }, [sidebarCollapsed]);

  useEffect(() => {
    const handleNavProfile = () => {
      handleSetActiveSection("profile", { returnTo: activeSection });
    };
    window.addEventListener("mixtape:nav-profile", handleNavProfile);
    return () => window.removeEventListener("mixtape:nav-profile", handleNavProfile);
  }, [activeSection, handleSetActiveSection]);

  useEffect(() => {
    if (!urlSection) return;

    const params: Record<string, string> = {};
    if (searchParams) {
      for (const [key, value] of searchParams.entries()) {
        if (key === "section" || key === "view") continue;
        params[key] = value;
      }
    }

    handleSetActiveSection(
      urlSection,
      Object.keys(params).length > 0 ? params : undefined
    );
  }, [urlSection, handleSetActiveSection, searchParams]);

  useEffect(() => {
    if (!activeSection) return;

    const parentKey = findParentKeyForSection(activeSection, visibleMenuItems);

    if (!parentKey) return;

    setOpenSections((prev) => {
      if (prev[parentKey]) return prev;
      return {
        ...prev,
        [parentKey]: true,
      };
    });
  }, [activeSection, visibleMenuItems, findParentKeyForSection]);

  useEffect(() => {
    if (!activeSection) return;

    openParentForSection(activeSection, setOpenSections, visibleMenuItems);
  }, [activeSection, visibleMenuItems]);

  useEffect(() => {
    // Check the full menuItems prop (including hidden ones) so that sections set
    // programmatically (e.g. collection-detail) are not reset to the default.
    const isInMenu = menuItems.some(
      (item) =>
        item.key === activeSection ||
        item.subItems?.some((sub) => sub.key === activeSection)
    );

    if (!isInMenu && firstVisibleSection) {
      handleSetActiveSection(firstVisibleSection);
    }
  }, [
    activeSection,
    menuItems,
    firstVisibleSection,
    handleSetActiveSection,
  ]);

  const toggleAllAccordions = useCallback(() => {
    if (allExpanded) {
      setOpenSections({});
      setAllExpanded(false);
      return;
    }

    const allKeys = visibleMenuItems.map((item) => item.key);
    const openAll = allKeys.reduce<Record<string, boolean>>((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});

    setOpenSections(openAll);
    setAllExpanded(true);
  }, [allExpanded, visibleMenuItems]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <Box
      className="dashboard-layout"
      bg="theme.surface"
      minH={constrainToViewport ? "100vh" : "auto"}
    >
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
        <Flex
          h={constrainToViewport ? "100vh" : "auto"}
          minH={constrainToViewport ? "100vh" : "auto"}
          position="relative"
          overflow={constrainToViewport ? "hidden" : "visible"}
        >
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

          <Box
            w={sidebarWidth}
            flexShrink={0}
            bg={sidebarBg}
            borderRight="1px solid"
            borderColor={borderColor}
            transition="width 0.2s"
            overflow={constrainToViewport ? "hidden" : "visible"}
            display="flex"
            flexDirection="column"
          >
            <Box p={3} borderBottom="1px solid" borderColor={borderColor} minH="60px">
              <HStack justify="space-between" h="full" align="center">
                <HStack
                  cursor="pointer"
                  onClick={() => {
                    const newCollapsed = !sidebarCollapsed;
                    setSidebarCollapsed(newCollapsed);

                    if (!newCollapsed && wasCollapsedByOutline.current) {
                      wasCollapsedByOutline.current = false;
                    }

                    if (showBubbleNote) {
                      setShowBubbleNote(false);
                      if (bubbleTimerRef.current) {
                        clearTimeout(bubbleTimerRef.current);
                      }
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

                {!sidebarCollapsed && (
                  <IconButton
                    size="xs"
                    variant="ghost"
                    onClick={toggleAllAccordions}
                    title={allExpanded ? "Collapse all sections" : "Expand all sections"}
                    aria-label={allExpanded ? "Collapse all sections" : "Expand all sections"}
                  >
                    {allExpanded ? <IconFold /> : <IconArrowForward />}
                  </IconButton>
                )}
              </HStack>
            </Box>

            <VStack
              align="stretch"
              gap={0}
              flex="1"
              overflowY={constrainToViewport ? "auto" : "visible"}
            >
              {visibleMenuItems.map((menuItem) => {
                const filteredSubItems = menuItem.subItems;

                if (filteredSubItems?.length === 0) {
                  return null;
                }

                return (
                  <Collapsible.Root
                    key={menuItem.key}
                    open={!!openSections[menuItem.key]}
                    onOpenChange={(details: { open: boolean } | boolean) => {
                      const openValue =
                        typeof details === "boolean"
                          ? details
                          : details.open ?? false;

                      setOpenSections((prev) => {
                        if (prev[menuItem.key] === openValue) return prev;
                        return {
                          ...prev,
                          [menuItem.key]: openValue,
                        };
                      });
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
                        if (sidebarCollapsed) {
                          e.stopPropagation();
                          setSidebarCollapsed(false);
                          setOpenSections((prev) => {
                            if (prev[menuItem.key]) return prev;
                            return {
                              ...prev,
                              [menuItem.key]: true,
                            };
                          });
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

          <Flex
            flex="1 1 0%"
            minW="0"
            minH="0"
            flexDirection="column"
            overflow="hidden"
          >
            <Box
              flex="1"
              minH="0"
              p={0}
              bg="theme.bgSubtle"
              overflowX="hidden"
              overflowY={constrainToViewport ? "auto" : "visible"}
            >
              <WorkAreaComponent
                section={activeSection}
                sectionParams={sectionParams}
                setActiveSection={handleSetActiveSection}
                {...workAreaProps}
              />
            </Box>
            {/* Footer slot — StickyFormFooter portals into this */}
            <Box id="dashboard-sticky-footer" flexShrink={0} />
          </Flex>
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
  setActiveSection: (section: string, params?: Record<string, string>) => void;
  primaryTabs: MenuItem[];
  overflowTabs: MenuItem[];
  WorkAreaComponent: React.ComponentType<WorkAreaProps>;
  workAreaProps: Record<string, unknown>;
  header?: React.ReactNode;
}) {
  const { open, onOpen, onClose } = useDisclosure();

  const menuMap = useMemo(() => {
    const map: Record<string, MenuItem | undefined> = {};
    [...primaryTabs, ...overflowTabs].forEach((item) => {
      map[item.key] = item;
    });
    return map;
  }, [primaryTabs, overflowTabs]);

  const activeTopLevelKey = useMemo(() => {
    for (const key in menuMap) {
      const item = menuMap[key];
      if (item?.subItems?.some((sub) => sub.key === activeSection)) {
        return key;
      }
    }
    return null;
  }, [menuMap, activeSection]);

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
            setActiveSection(selectedItem.subItems[0].key);
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
                            const itemSubItems = item.subItems || [];
                            if (itemSubItems.length > 0) {
                              setActiveSection(itemSubItems[0].key);
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

        <WorkAreaComponent
          section={activeSection}
          setActiveSection={setActiveSection}
          {...workAreaProps}
        />
      </Tabs.Root>
    </Box>
  );
}

export type { MenuItem, WorkAreaProps, DashboardLayoutProps };

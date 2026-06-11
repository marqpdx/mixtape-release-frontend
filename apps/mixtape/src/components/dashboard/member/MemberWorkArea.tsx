// apps/mixtape/src/components/dashboard/member/MemberWorkArea.tsx

import React, { useMemo } from "react";
import { VStack, Text, Box, Heading, Card, HStack, Button, SimpleGrid, Badge, Link } from "@chakra-ui/react";
import { IconShoppingBag, IconPackage, IconTag, IconShoppingCart } from "@tabler/icons-react";
import NextLink from "next/link";
import { WorkAreaProps } from "@components/dashboard/shared/types";
import WorkAreaWrapper from "@components/dashboard/shared/WorkAreaWrapper";

// Import member-specific components
import { useGroups, useUserGroups } from "@mixtape/api/hooks/groups/useGroups";
import GroupsTable from "@components/groups/GroupsTable";
import { UserIdentity } from "@mixtape/core/types/auth";
import MessageCenter from "../sections/MessageCenter";
import GroupCreateWorkArea from "@/components/groups/create/GroupCreateWorkArea";
import MemberProfileEditWorkArea from "./MemberProfileEditWorkArea";
import MemberProfileViewWorkArea from "./MemberProfileViewWorkArea";
import ProductsWorkArea from "@/components/bazaar/products/ProductsWorkArea";
import OfferingsWorkArea from "@/components/bazaar/offerings/OfferingsWorkArea";
import SeedsWorkArea from "@/components/writing/seeds/SeedsWorkArea";
import SponsorWritingWrapper from "@/components/writing/SponsorWritingWrapper";
import WritingEditorWrapper from "@/components/writing/WritingEditorWrapper";
import DraftRoomWorkArea from "@/components/writing/draft-room/DraftRoomWorkArea";
import DraftRoomV2 from "@/components/writing/draft-room-v2/DraftRoomV2";
import DocxImportWorkArea from "@/components/writing/import/DocxImportWorkArea";
import { ListsTab } from "@/components/workbench/ListsTab";
import { MillWorkArea } from "@/components/gristmill/MillWorkArea";
import { useStall, useOrders } from "@mixtape/api/hooks/useBazaar";
import { formatPrice, getOrderStatusLabel, getOrderStatusColor, Order } from "@mixtape/core/types/bazaarTypes";
import PersonalOverview from "../sections/PersonalOverview";
import { MemberSettings } from "@/components/member/settings/MemberSettings";
import WorkTable from "@components/initiatives/WorkTable";
import MemberPreferencesWorkArea from "./MemberPreferencesWorkArea";
import { DualPanelEditorWorkArea } from "@/components/writing/dual-panel/DualPanelEditorWorkArea";

interface MemberWorkAreaProps extends WorkAreaProps {
  identity?: UserIdentity;
}

export default function MemberWorkArea({
  section,
  setActiveSection,
  identity,
  sectionParams,
}: MemberWorkAreaProps) {
  const { groups } = useGroups({
    ordering: '-created_at',
    is_active: true
  });

  const {
    groups: myGroups,
    isLoading: isLoadingMyGroups,
    error: myGroupsError,
  } = useUserGroups();

  // Define the permission function
  const canEditGroup = useMemo(() => {
    return (): boolean => {
      if (identity?.is_superuser || identity?.is_staff) {
        return true;
      }
      return true;
    };
  }, [identity]);

  // Guard: identity is required for most sections (after all hooks)
  if (!identity) {
    return (
      <WorkAreaWrapper>
        <Text color="gray.500">Loading...</Text>
      </WorkAreaWrapper>
    );
  }

  if (section === "worktable") {
    return (
      <WorkAreaWrapper padding={0}>
        <WorkTable />
      </WorkAreaWrapper>
    );
  }

  // Personal sections
  if (section === "overview") {
    return (
      // <></>
      <PersonalOverview
        identity={identity}
        groups={groups}
        todos={[]}
        isAdmin={false}
        isSteward={false}
        setActiveSection={setActiveSection}
      />
    );
  }

  // Messages section
  if (section === "messages") {
    return (
      <WorkAreaWrapper>
        <MessageCenter />
      </WorkAreaWrapper>
    );
  }

  // Preferences section
  if (section === "preferences") {
    return (
      <WorkAreaWrapper>
        <MemberPreferencesWorkArea />
      </WorkAreaWrapper>
    );
  }

  // Profile section
  if (section === "profile") {
    return (
      <WorkAreaWrapper>
        <MemberProfileViewWorkArea
          setActiveSection={setActiveSection}
          sectionParams={sectionParams}
          username={identity.username}
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "member-settings") {
    return (
      <WorkAreaWrapper>
        <MemberSettings />
      </WorkAreaWrapper>
    );
  }

  if (section === "edit-profile") {
    return (
      <WorkAreaWrapper>
        <MemberProfileEditWorkArea setActiveSection={setActiveSection} />
      </WorkAreaWrapper>
    );
  }

  // Seeds section
  if (section === "seeds") {
    return (
      <WorkAreaWrapper>
        <SeedsWorkArea />
      </WorkAreaWrapper>
    );
  }

  // Writing sections
  if (section === "writing") {
    const displayName = identity.profile?.display_name || identity.username;
    return (
      <WorkAreaWrapper>
        <SponsorWritingWrapper
          sponsor={{ type: "member", slug: identity.username, displayName }}
          setActiveSection={setActiveSection}
          canCreatePost
          canManagePosts
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "write") {
    const pieceId = sectionParams?.piece;
    const displayName = identity.profile?.display_name || identity.username;
    return (
      <WorkAreaWrapper>
        <WritingEditorWrapper
          sponsor={{
            type: "member",
            id: identity.id,
            slug: identity.username,
            displayName,
          }}
          writingKind="post"
          pieceId={pieceId}
          onBack={() => {
            if (typeof window !== "undefined") {
              try {
                window.localStorage.setItem("writing_active_tab", "drafts");
                window.localStorage.setItem("writing_force_refresh", "true");
              } catch (error) {
                console.warn("Failed to set writing tab:", error);
              }
            }
            setActiveSection("writing");
          }}
          onUnpublished={() => {
            if (typeof window !== "undefined") {
              try {
                window.localStorage.setItem("writing_active_tab", "drafts");
                window.localStorage.setItem("writing_force_refresh", "true");
              } catch (error) {
                console.warn("Failed to set writing tab:", error);
              }
            }
            setActiveSection("writing");
          }}
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "dual-panel-editor") {
    const displayName = identity.profile?.display_name || identity.username;
    return (
      <DualPanelEditorWorkArea
        sponsor={{ type: "member", slug: identity.username, displayName }}
      />
    );
  }

  if (section === "import-document") {
    const displayName = identity.profile?.display_name || identity.username;
    return (
      <WorkAreaWrapper>
        <DocxImportWorkArea
          sponsor={{ type: "member", id: identity.id, slug: identity.username, displayName }}
          onImported={(piece) => setActiveSection("write", { piece: piece.id })}
          onBack={() => setActiveSection("writing")}
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "draft-room") {
    const displayName = identity.profile?.display_name || identity.username;
    return (
      <WorkAreaWrapper>
        <DraftRoomWorkArea
          sponsor={{
            type: "member",
            id: identity.id,
            slug: identity.username,
            displayName,
          }}
          setActiveSection={setActiveSection}
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "draft-room-v2") {
    const displayName = identity.profile?.display_name || identity.username;
    return (
      <WorkAreaWrapper>
        <DraftRoomV2
          sponsor={{
            type: "member",
            id: identity.id,
            slug: identity.username,
            displayName,
          }}
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "mill") {
    return (
      <WorkAreaWrapper>
        <MillWorkArea sponsor={{ type: "member", slug: identity.username }} />
      </WorkAreaWrapper>
    );
  }

  // Tools sections
  if (section === "lists") {
    return (
      <WorkAreaWrapper>
        <ListsTab />
      </WorkAreaWrapper>
    );
  }

  if (section === "todos") {
    return (
      <WorkAreaWrapper>
        <Box>
          <Heading size="md" mb={2}>
            ToDos
          </Heading>
          <Text color="gray.500">Personal ToDos are coming soon.</Text>
        </Box>
      </WorkAreaWrapper>
    );
  }

  // Groups sections
  if (section === "my-groups") {
    return (
      <WorkAreaWrapper>
        <GroupsTable
          groups={myGroups}
          isLoading={isLoadingMyGroups}
          error={myGroupsError}
          setActiveSection={setActiveSection}
          showCreateButton={false}
          canEditGroup={canEditGroup}
          emptyStateMessage="You haven't joined any groups yet. Create your first group or join existing ones!"
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "create-group") {
    return (
      <WorkAreaWrapper>
        <GroupCreateWorkArea
          onCancel={() => setActiveSection("my-groups")}
          onCreated={() => setActiveSection("my-groups")}
        />
      </WorkAreaWrapper>
    );
  }

  // Bazaar - Products
  if (section === "bazaar-products") {
    return (
      <WorkAreaWrapper>
        <ProductsWorkArea
          sponsorType="user"
          sponsorId={identity.id}
          sponsorTitle={identity.profile?.display_name || identity.username}
        />
      </WorkAreaWrapper>
    );
  }

  // Bazaar - Offerings
  if (section === "bazaar-offerings") {
    const displayName = identity.profile?.display_name || identity.username;
    return (
      <WorkAreaWrapper>
        <OfferingsWorkArea
          sponsorType="user"
          sponsorId={identity.id}
          sponsorTitle={displayName}
        />
      </WorkAreaWrapper>
    );
  }

  // Bazaar - Overview
  if (section === "bazaar-overview") {
    return (
      <WorkAreaWrapper>
        <BazaarOverview identity={identity} setActiveSection={setActiveSection} />
      </WorkAreaWrapper>
    );
  }

  // Bazaar - My Purchases (Buyer Orders)
  if (section === "bazaar-orders") {
    return (
      <WorkAreaWrapper>
        <BuyerOrdersSection />
      </WorkAreaWrapper>
    );
  }

  // Default fallback
  return (
    <WorkAreaWrapper>
      <VStack align="stretch" gap={4}>
        <Text fontSize="xl" fontWeight="bold">Section: {section}</Text>
        <Text>This member section is under development.</Text>
      </VStack>
    </WorkAreaWrapper>
  );
}

/**
 * Bazaar Overview Section
 * Shows stall preview, quick stats, and navigation to other bazaar sections
 */
function BazaarOverview({
  identity,
  setActiveSection,
}: {
  identity: UserIdentity;
  setActiveSection: (section: string) => void;
}) {
  const { stall, isLoading: stallLoading } = useStall("user", identity.id);
  const { orders, isLoading: ordersLoading } = useOrders({ view: "buyer" });

  return (
    <VStack align="stretch" gap={6}>
      <Box>
        <Heading size="lg" mb={2}>
          <HStack>
            <IconShoppingBag size={28} />
            <Text>Bazaar</Text>
          </HStack>
        </Heading>
        <Text color="gray.600">
          Manage your products, offerings, and view your purchases
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
        {/* My Stall Card */}
        <Card.Root>
          <Card.Header>
            <HStack>
              <IconShoppingBag size={20} />
              <Heading size="sm">My Stall</Heading>
            </HStack>
          </Card.Header>
          <Card.Body>
            {stallLoading ? (
              <Text color="gray.500">Loading...</Text>
            ) : stall && stall.offerings_count > 0 ? (
              <VStack align="stretch" gap={3}>
                <Text>
                  <Text as="span" fontWeight="bold" fontSize="2xl">
                    {stall.offerings_count}
                  </Text>{" "}
                  {stall.offerings_count === 1 ? "offering" : "offerings"} published
                </Text>
                <Link as={NextLink} href={`/member/${identity.username}/stall`}>
                  <Button size="sm" variant="outline" width="full">
                    View My Stall
                  </Button>
                </Link>
              </VStack>
            ) : (
              <VStack align="stretch" gap={3}>
                <Text color="gray.500">No offerings published yet</Text>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveSection("bazaar-offerings")}
                >
                  Create an Offering
                </Button>
              </VStack>
            )}
          </Card.Body>
        </Card.Root>

        {/* Products Card */}
        <Card.Root>
          <Card.Header>
            <HStack>
              <IconPackage size={20} />
              <Heading size="sm">My Products</Heading>
            </HStack>
          </Card.Header>
          <Card.Body>
            <VStack align="stretch" gap={3}>
              <Text color="gray.600" fontSize="sm">
                Create reusable products that can be attached to offerings
              </Text>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveSection("bazaar-products")}
              >
                Manage Products
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Offerings Card */}
        <Card.Root>
          <Card.Header>
            <HStack>
              <IconTag size={20} />
              <Heading size="sm">My Offerings</Heading>
            </HStack>
          </Card.Header>
          <Card.Body>
            <VStack align="stretch" gap={3}>
              <Text color="gray.600" fontSize="sm">
                Services, events, programs, and products you sell
              </Text>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveSection("bazaar-offerings")}
              >
                Manage Offerings
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* Recent Purchases */}
      <Card.Root>
        <Card.Header>
          <HStack justify="space-between">
            <HStack>
              <IconShoppingCart size={20} />
              <Heading size="sm">Recent Purchases</Heading>
            </HStack>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActiveSection("bazaar-orders")}
            >
              View All
            </Button>
          </HStack>
        </Card.Header>
        <Card.Body>
          {ordersLoading ? (
            <Text color="gray.500">Loading...</Text>
          ) : orders.length === 0 ? (
            <VStack py={4}>
              <Text color="gray.500">No purchases yet</Text>
              <Link as={NextLink} href="/bazaar">
                <Button size="sm" variant="outline">
                  Browse Bazaar
                </Button>
              </Link>
            </VStack>
          ) : (
            <VStack align="stretch" gap={3}>
              {orders.slice(0, 3).map((order: Order) => (
                <HStack key={order.id} justify="space-between" p={2} borderWidth="1px" borderRadius="md">
                  <VStack align="start" gap={0}>
                    <Text fontWeight="medium" fontSize="sm">
                      {order.offering.title}
                    </Text>
                    <Badge size="sm" colorPalette={getOrderStatusColor(order.status)}>
                      {getOrderStatusLabel(order.status)}
                    </Badge>
                  </VStack>
                  <Text fontWeight="bold" fontSize="sm">
                    {order.amount === 0 ? "FREE" : formatPrice(order.amount, order.currency)}
                  </Text>
                </HStack>
              ))}
            </VStack>
          )}
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}

/**
 * Buyer Orders Section
 * Shows all purchases made by the user
 */
function BuyerOrdersSection() {
  const { orders, isLoading, error } = useOrders({ view: "buyer" });

  return (
    <VStack align="stretch" gap={6}>
      <Box>
        <Heading size="lg" mb={2}>
          <HStack>
            <IconShoppingCart size={28} />
            <Text>My Purchases</Text>
          </HStack>
        </Heading>
        <Text color="gray.600">
          View and track your orders
        </Text>
      </Box>

      {isLoading && <Text color="gray.500">Loading orders...</Text>}

      {error && (
        <Box p={4} bg="red.50" borderRadius="md">
          <Text color="red.600">Error loading orders: {error.message}</Text>
        </Box>
      )}

      {!isLoading && orders.length === 0 && (
        <Card.Root>
          <Card.Body>
            <VStack py={8}>
              <IconShoppingCart size={48} style={{ opacity: 0.3 }} />
              <Text color="gray.500" fontSize="lg">No purchases yet</Text>
              <Text color="gray.400">Your orders will appear here after you make a purchase</Text>
              <Link as={NextLink} href="/bazaar">
                <Button mt={4}>Browse Bazaar</Button>
              </Link>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      {!isLoading && orders.length > 0 && (
        <VStack align="stretch" gap={3}>
          {orders.map((order: Order) => (
            <Card.Root key={order.id} variant="outline">
              <Card.Body>
                <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
                  <VStack align="start" gap={1}>
                    <HStack gap={2}>
                      <Badge colorPalette={getOrderStatusColor(order.status)}>
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </HStack>
                    <Text fontWeight="medium">{order.offering.title}</Text>
                    <HStack gap={4} fontSize="sm" color="gray.500">
                      <Text>Order #{order.id.slice(0, 8)}</Text>
                      <Text>
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </HStack>
                  </VStack>

                  <VStack align="end" gap={2}>
                    <Text fontWeight="bold" fontSize="lg">
                      {order.amount === 0 ? "FREE" : formatPrice(order.amount, order.currency)}
                    </Text>
                    <Link as={NextLink} href={`/bazaar/orders/${order.id}`}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                  </VStack>
                </HStack>
              </Card.Body>
            </Card.Root>
          ))}
        </VStack>
      )}
    </VStack>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";

import type { Group } from "@/types/groupTypes";
import GroupsList from "@/components/groups/lists/GroupsList";

import { useUserGroups, useGroupCircles } from "@/hooks/groups/useGroups";
import { useHasPermission } from "@/hooks/groups/useGroupPermissions";
import GroupCreateCircle from "@/components/groups/create/GroupCreateCircle";

const PERM_CREATE_SPONSORED_CIRCLE = "can__CreateSponsoredCircle";

interface GroupCirclesWorkAreaProps {
  groupSlug: string; // sponsor group slug (community)
  groupId?: string;  // optional: only needed if you rely on sponsor_id filtering client-side
}

export function GroupCirclesWorkArea({ groupSlug }: GroupCirclesWorkAreaProps) {
  const [view, setView] = useState<"my" | "open" | "create">("my");

  const canCreate = useHasPermission(groupSlug, PERM_CREATE_SPONSORED_CIRCLE);

  // Sponsor-scoped circles (authoritative)
  const {
    circles: sponsoredCircles = [],
    isLoading: circlesLoading,
    error: circlesError,
  } = useGroupCircles(groupSlug, { ordering: "-created_at" });

  // My groups (across the platform)
  const {
    groups: myGroups = [],
    isLoading: myLoading,
    error: myError,
  } = useUserGroups();

  // Helper set for membership intersection
  const sponsorCircleSlugSet = useMemo(() => {
    return new Set(sponsoredCircles.map((c) => c.slug));
  }, [sponsoredCircles]);

  // "My circles inside THIS community"
  const myCircles = useMemo(() => {
    const mine = myGroups.filter((g) => g.group_type === "circle");
    // Best-effort MVP: intersect by slug with sponsor-scoped list
    return mine.filter((g) => sponsorCircleSlugSet.has(g.slug));
  }, [myGroups, sponsorCircleSlugSet]);

  // “Open circles” inside this sponsor group
  const openCircles = useMemo(() => {
    return sponsoredCircles.filter((g: any) => g.visibility === "public" || g.visibility === "open");
  }, [sponsoredCircles]);

  // Optional: decide editability in list (for now: let table show edit affordance only when you canCreate)
  const canEditGroup = useMemo(() => {
    return (_group: Group) => !!canCreate;
  }, [canCreate]);

  return (
    <VStack align="stretch" gap={6}>
      {/* Tabs */}
      <HStack gap={2} borderBottom="1px" borderColor="gray.200" pb={2}>
        <Button
          variant={view === "my" ? "solid" : "ghost"}
          onClick={() => setView("my")}
          size="sm"
        >
          My Circles
        </Button>

        <Button
          variant={view === "open" ? "solid" : "ghost"}
          onClick={() => setView("open")}
          size="sm"
        >
          Open Circles
        </Button>

        {canCreate && (
          <Button
            variant={view === "create" ? "solid" : "ghost"}
            onClick={() => setView("create")}
            size="sm"
          >
            Create
          </Button>
        )}
      </HStack>

      {/* My Circles */}
      {view === "my" && (
        <GroupsList
          title="My Circles"
          groups={myCircles}
          isLoading={myLoading || circlesLoading}
          error={myError || circlesError}
          showCreateButton={!!canCreate}
          createButtonLabel="Create Circle"
          onCreateClick={() => setView("create")}
          emptyStateMessage="No circles yet"
          emptyStateSubtitle="Join an open circle or create one (if you’re allowed)."
          canEditGroup={canEditGroup}
          onRowClick={(g) => {
            window.location.href = `/groups/${g.slug}`;
          }}
        />
      )}

      {/* Open Circles */}
      {view === "open" && (
        <GroupsList
          title="Open Circles"
          groups={openCircles}
          isLoading={circlesLoading}
          error={circlesError}
          showCreateButton={!!canCreate}
          createButtonLabel="Create Circle"
          onCreateClick={() => setView("create")}
          emptyStateMessage="No open circles yet"
          emptyStateSubtitle="Once created and set to open/public, circles appear here."
          canEditGroup={canEditGroup}
          onRowClick={(g) => {
            window.location.href = `/groups/${g.slug}`;
          }}
        />
      )}

      {/* Create */}
      {view === "create" && (
        <Box>
          {!canCreate ? (
            <Box textAlign="center" py={10}>
              <Text color="gray.500">
                You don’t have permission to create circles in this community.
              </Text>
            </Box>
          ) : (
            <GroupCreateCircle
              sponsorGroupSlug={groupSlug}
              onCreated={(circleSlug: string) => {
                // Today: go to new circle
                window.location.href = `/groups/${circleSlug}`;
              }}
            />
          )}
        </Box>
      )}
    </VStack>
  );
}


// "use client";

// import { useMemo, useState } from "react";
// import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";

// import type { Group } from "@/types/groupTypes";
// import GroupsList from "@/components/groups/lists/GroupsList";

// import { useUserGroups, useGroupCircles } from "@/hooks/groups/useGroups";
// import { useHasPermission } from "@/hooks/groups/useGroupPermissions";
// import GroupCreateCircle from "../groups/create/GroupCreateCircle";

// const PERM_CREATE_SPONSORED_CIRCLE = "can__CreateSponsoredCircle";

// interface GroupCirclesWorkAreaProps {
//   groupSlug: string; // sponsor group slug (community)
//   groupId?: string; // optional, not needed if sponsor-scoped endpoint is correct
//   setActiveSection?: (section: string, params?: Record<string, string>) => void; // optional
// }

// export function GroupCirclesWorkArea({ groupSlug }: GroupCirclesWorkAreaProps) {
//   const [view, setView] = useState<"my" | "open" | "create">("my");

//   const canCreate = useHasPermission(groupSlug, PERM_CREATE_SPONSORED_CIRCLE);

//   // New: sponsor-scoped circles (authoritative for this community)
//   const {
//     circles: sponsoredCircles,
//     isLoading: circlesLoading,
//     error: circlesError,
//   } = useGroupCircles(groupSlug, { ordering: "-created_at" });

//   // My memberships (may include circles across many communities)
//   const { groups: myGroups, isLoading: myLoading, error: myError } = useUserGroups();

//   // My circles that belong to THIS sponsor group.
//   // Best case: API includes sponsor metadata; if it doesn't, we fall back to intersection by slug.
//   const myCircles = useMemo(() => {
//     const mine = (myGroups ?? []).filter((g) => g.group_type === "circle");

//     // If your group objects include sponsor info, filter properly:
//     const hasSponsorFields = mine.some((g: any) => g.sponsor_type || g.sponsor_id);
//     if (hasSponsorFields) {
//       return mine.filter(
//         (g: any) =>
//           g.sponsor_type === "group" && String(g.sponsor_id) === String((sponsoredCircles?.[0] as any)?.sponsor_id ?? "")
//       );
//     }

//     // Fallback: intersect by slug with sponsor-scoped list
//     const sponsorSlugSet = new Set((sponsoredCircles ?? []).map((g) => g.slug));
//     return mine.filter((g) => sponsorSlugSet.has(g.slug));
//   }, [myGroups, sponsoredCircles]);

//   // “Open circles” inside this sponsor group
//   const openCircles = useMemo(() => {
//     return (sponsoredCircles ?? []).filter((g: any) => {
//       // Adjust as your semantics evolve
//       return g.visibility === "public" || g.visibility === "open";
//     });
//   }, [sponsoredCircles]);

//   return (
//     <VStack align="stretch" gap={6}>
//       {/* Header */}
//       <Box>
//         <Text fontSize="lg" fontWeight="semibold">
//           Circles
//         </Text>
//         <Text fontSize="sm" color="gray.600">
//           Sub-spaces inside this community.
//         </Text>
//       </Box>

//       {/* Tabs */}
//       <HStack gap={2} borderBottom="1px" borderColor="gray.200" pb={2}>
//         <Button
//           variant={view === "my" ? "solid" : "ghost"}
//           onClick={() => setView("my")}
//           size="sm"
//         >
//           My Circles
//         </Button>

//         <Button
//           variant={view === "open" ? "solid" : "ghost"}
//           onClick={() => setView("open")}
//           size="sm"
//         >
//           Open Circles
//         </Button>

//         {canCreate && (
//           <Button
//             variant={view === "create" ? "solid" : "ghost"}
//             onClick={() => setView("create")}
//             size="sm"
//           >
//             Create
//           </Button>
//         )}
//       </HStack>

//       {/* Content: My */}
//       {view === "my" && (
//         <GroupsList
//           title="My Circles"
//           groups={myCircles as Group[]}
//           isLoading={myLoading || circlesLoading}
//           error={myError || circlesError}
//           showCreateButton={!!canCreate}
//           createButtonLabel="Create Circle"
//           onCreateClick={() => setView("create")}
//           emptyStateMessage="No circles yet"
//           emptyStateSubtitle="Join an open circle or create one (if you’re allowed)."
//           getRowHref={(g) => `/groups/${g.slug}`}
//           badgeText={() => "circle"}
//         />
//       )}

//       {/* Content: Open */}
//       {view === "open" && (
//         <GroupsList
//           title="Open Circles"
//           groups={openCircles as Group[]}
//           isLoading={circlesLoading}
//           error={circlesError}
//           showCreateButton={!!canCreate}
//           createButtonLabel="Create Circle"
//           onCreateClick={() => setView("create")}
//           emptyStateMessage="No open circles yet"
//           emptyStateSubtitle="Once created and set to open/public, circles appear here."
//           getRowHref={(g) => `/groups/${g.slug}`}
//           badgeText={() => "open"}
//         />
//       )}

//       {/* Content: Create */}
//       {view === "create" && (
//         <Box>
//           {!canCreate ? (
//             <Box textAlign="center" py={10}>
//               <Text color="gray.500">
//                 You don’t have permission to create circles in this community.
//               </Text>
//             </Box>
//           ) : (
//             <GroupCreateCircle
//               sponsorGroupSlug={groupSlug}
//               onCreated={(circleSlug: string) => {
//                 // Current behavior = go to the new circle.
//                 // Later: add "Create another" vs "Create & Edit".
//                 window.location.href = `/groups/${circleSlug}`;
//               }}
//             />
//           )}
//         </Box>
//       )}
//     </VStack>
//   );
// }



// // // src/components/circles/GroupCirclesWorkArea.tsx

// // "use client";

// // import { useMemo, useState } from "react";
// // import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
// // // import { useHasPermission } from "@hooks/useGroupPermissions";
// // import { useGroups, useUserGroups } from "@/hooks/groups/useGroups";
// // import GroupsList from "@/components/groups/lists/GroupsList";
// // // import GroupCreateGroup from "@/components/groups/create/GroupCreateGroup"; // (your wrapper)
// // import type { Group } from "@/types/groupTypes";
// // import { useHasPermission } from "@/hooks/groups/useGroupPermissions";
// // import GroupCreateCircle from "../groups/create/GroupCreateCircle";

// // const PERM_CREATE_SPONSORED_CIRCLE = "can__CreateSponsoredCircle";

// // interface GroupCirclesWorkAreaProps {
// //   groupSlug: string;       // sponsor group slug (community)
// //   groupId?: string;        // sponsor group id (if you need to lock sponsor_id)
// //   setActiveSection?: (section: string, params?: Record<string, string>) => void; // optional
// // }

// // export function GroupCirclesWorkArea({ groupSlug, groupId }: GroupCirclesWorkAreaProps) {
// //   const [view, setView] = useState<"my" | "open" | "create">("my");

// //   const canCreate = useHasPermission(groupSlug, PERM_CREATE_SPONSORED_CIRCLE);

// //   // Option A: All circles (from global groups endpoint)
// //   const { groups: allCircles, isLoading, error } = useGroups({ group_type: "circle" });

// //   // Option B: My groups (membership list), then filter to circles
// //   const { groups: myGroups } = useUserGroups();

// //   const sponsoredCircles = useMemo(() => {
// //     if (!groupId) return allCircles;
// //     // adjust field names to match your backend response
// //     return allCircles.filter((g: any) => g.sponsor_type === "group" && String(g.sponsor_id) === String(groupId));
// //   }, [allCircles, groupId]);

// //   const myCircles = useMemo(() => {
// //     // depends on what /api/groups/my returns — if it includes circles, great
// //     return myGroups.filter((g) => g.group_type === "circle");
// //   }, [myGroups]);

// //   // MVP “Open circles” decision: only open ones are discoverable
// //   const openCircles = useMemo(() => {
// //     return sponsoredCircles.filter((g: any) => {
// //       // adjust to your visibility field semantics
// //       // Example: 'open' vs 'invite_only' etc.
// //       return g.visibility === "public" || g.visibility === "open";
// //     });
// //   }, [sponsoredCircles]);

// //   return (
// //     <VStack align="stretch" gap={6}>
// //       {/* Tabs */}
// //       <HStack gap={2} borderBottom="1px" borderColor="gray.200" pb={2}>
// //         <Button variant={view === "my" ? "solid" : "ghost"} onClick={() => setView("my")} size="sm">
// //           My Circles
// //         </Button>
// //         <Button variant={view === "open" ? "solid" : "ghost"} onClick={() => setView("open")} size="sm">
// //           Open Circles
// //         </Button>
// //         {canCreate && (
// //           <Button variant={view === "create" ? "solid" : "ghost"} onClick={() => setView("create")} size="sm">
// //             Create
// //           </Button>
// //         )}
// //       </HStack>

// //       {/* Content */}
// //       {view === "my" && (
// //         <GroupsList
// //           title="My Circles"
// //           groups={myCircles as Group[]}
// //           isLoading={false}
// //           error={null}
// //           showCreateButton={!!canCreate}
// //           createButtonLabel="Create Circle"
// //           onCreateClick={() => setView("create")}
// //           emptyStateMessage="No circles yet"
// //           emptyStateSubtitle="Join an open circle or create one (if you’re allowed)."
// //           getRowHref={(g) => `/groups/${g.slug}`}
// //           badgeText={() => "circle"}
// //         />
// //       )}

// //       {view === "open" && (
// //         <GroupsList
// //           title="Open Circles"
// //           groups={openCircles as Group[]}
// //           isLoading={isLoading}
// //           error={error}
// //           showCreateButton={!!canCreate}
// //           createButtonLabel="Create Circle"
// //           onCreateClick={() => setView("create")}
// //           emptyStateMessage="No open circles yet"
// //           emptyStateSubtitle="Once created, open circles appear here for eligible members to discover."
// //           getRowHref={(g) => `/groups/${g.slug}`}
// //           badgeText={() => "open"}
// //         />
// //       )}

// //       {view === "create" && (
// //         <Box>
// //           {!canCreate ? (
// //             <Box textAlign="center" py={10}>
// //               <Text color="gray.500">You don’t have permission to create circles in this community.</Text>
// //             </Box>
// //           ) : (
// //             <GroupCreateCircle
// //               sponsorGroupSlug={groupSlug}
// //               onCreated={(circleSlug: string) => {
// //                 window.location.href = `/groups/${circleSlug}`;
// //               }}
// //             />
// //           )}
// //         </Box>
// //       )}
// //     </VStack>
// //   );
// // }

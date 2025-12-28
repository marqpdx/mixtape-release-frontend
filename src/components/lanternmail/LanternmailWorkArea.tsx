// src/components/groups/LanternMailWorkArea.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Spinner,
  Card,
  Heading,
  SimpleGrid,
} from "@chakra-ui/react";
import { useLanternmail } from "@hooks/lanternmail/useLanternmail";
// import { ErrorAlert } from "@components/ui/alerts/ErrorAlert";
// import { LanternMailList } from "content/lanternTypes";
// import ListDetailModal from "@components/lantern/ListDetailModal";
// import LanternSubscribersTable from "@components/lantern/LanternSubscribersTable";
// import { Group } from "content/groupTypes";
import { Alert } from "../ui/alerts";
import { LanternmailList } from "@mixtape/core/types/lanternmailTypes";
import { Group } from "@mixtape/core/types/groupTypes";
import ListDetailModal from "./ListDetailModal";
import LanternmailSubscribersTable from "./LanternmailSubscribersTable";
// import LanternSubscribersTable from "./LanternmailSubscribersTable";
// import { Group } from "@components/groups/interfaces";

export default function LanternmailWorkArea({ group }: { group: Group }) {
  const [selectedList, setSelectedList] = useState<LanternmailList | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filterListId, setFilterListId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { getGroupLists, getAllGroupLists, loading } = useLanternmail();
  const [lists, setLists] = useState<LanternmailList[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleManageList = (list: LanternmailList) => {
    setSelectedList(list);
    setIsDetailModalOpen(true);
  };

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const result = await getGroupLists(group.slug);
        setLists(result);
      } catch (err: any) {
        setError(err.message || "Failed to load mailing lists");
      }
    };

    fetchLists();
  }, [getGroupLists, group.slug]);

  const handleRefresh = async () => {
    setError(null);
    try {
      const result = await getAllGroupLists();
      setLists(result);
    } catch (err: any) {
      setError(err.message || "Failed to refresh lists");
    }
  };

  const visibleLists = showAll ? lists : lists.slice(0, 6);

  return (
    <VStack gap={10} align="stretch">
      <VStack align="stretch" gap={4}>
        <HStack justify="space-between">
          <Heading size="lg">Lantern Mail Lists</Heading>
          <Button onClick={handleRefresh} loading={loading} size="sm">
            Refresh
          </Button>
        </HStack>

        {error && <Alert status="error" title="Error Loading Lists" description={error} />}

        {lists.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">No mailing lists found</Text>
            <Text fontSize="sm" color="gray.400" mt={2}>
              Create lists from individual group pages
            </Text>
          </Box>
        ) : (
          <>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
              {visibleLists.map((list) => (
                <Card.Root key={list.id} variant="outline">
                  <Card.Header pb={2}>
                    <HStack justify="space-between" w="full">
                      <Text fontWeight="bold" truncate>
                        {list.display_name}
                      </Text>
                      <Badge colorScheme={list.is_active ? "green" : "red"}>
                        {list.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </HStack>
                  </Card.Header>

                  <Card.Body py={3}>
                    <VStack align="start" gap={3}>
                      <Text fontSize="sm" color="gray.600">
                        {list.group_title}
                      </Text>
                      <VStack align="start" gap={1} fontSize="xs" color="gray.500">
                        <Text>ListMonk ID: {list.listmonk_id}</Text>
                        <Text>Created: {new Date(list.created_at).toLocaleDateString()}</Text>
                      </VStack>
                    </VStack>
                  </Card.Body>

                  <Card.Footer pt={2} gap={2}>
                    <Button
                      size="sm"
                      onClick={() => setFilterListId(list.id)}
                    >
                      Subscribers
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleManageList(list)}
                    >
                      Details
                    </Button>
                    {selectedList && (
                      <ListDetailModal
                        list={selectedList}
                        isOpen={isDetailModalOpen}
                        onClose={() => {
                          setIsDetailModalOpen(false);
                          setSelectedList(null);
                        }}
                      />
                    )}
                  </Card.Footer>
                </Card.Root>
              ))}
            </SimpleGrid>

            {lists.length > 6 && (
              <Button
                onClick={() => setShowAll(!showAll)}
                variant="plain"
                size="sm"
                mt={2}
                alignSelf="flex-start"
              >
                {showAll ? "Show Less" : `Show All (${lists.length})`}
              </Button>
            )}
          </>
        )}
      </VStack>

      <VStack align="stretch" gap={4}>
        <Heading size="md">Subscribers</Heading>
        <LanternmailSubscribersTable groupSlug={group.slug} filterListId={filterListId} />
      </VStack>
    </VStack>
  );
}



// // src/components/groups/LanternMailWorkArea.tsx

// "use client";

// import { useState, useEffect } from "react";
// import {
//   Box,
//   VStack,
//   HStack,
//   Text,
//   Badge,
//   Button,
//   Spinner,
//   Card,
//   Heading,
//   SimpleGrid
// } from "@chakra-ui/react";
// import { useLanternmail } from "@hooks/useLanternmail";
// import { ErrorAlert } from "@components/ui/alerts/ErrorAlert";
// import { LanternMailList } from "content/lanternTypes";
// import ListDetailModal from "@components/lantern/ListDetailModal";
// import { Group } from "@components/groups/interfaces";

// export default function LanternMailWorkArea({ group }: { group: Group }) {

//   const [selectedList, setSelectedList] = useState<LanternMailList | null>(null);
//   const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

//   const { getAllGroupLists, getGroupLists, loading } = useLanternmail();
//   const [lists, setLists] = useState<LanternMailList[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   const handleManageList = (list: LanternMailList) => {
//     setSelectedList(list);
//     setIsDetailModalOpen(true);
//   };

//   useEffect(() => {
//     const fetchLists = async () => {
//       try {
//         const result = await getGroupLists(group.id);
//         setLists(result);
//       } catch (err: any) {
//         setError(err.message || "Failed to load mailing lists");
//       }
//     };

//     fetchLists();
//   }, [getGroupLists, group.id]);

//   const handleRefresh = async () => {
//     setError(null);
//     try {
//       const result = await getAllGroupLists();
//       setLists(result);
//     } catch (err: any) {
//       setError(err.message || "Failed to refresh lists");
//     }
//   };

//   if (loading && lists.length === 0) {
//     return (
//       <Box textAlign="center" py={8}>
//         <Spinner size="lg" />
//         <Text mt={4}>Loading mailing lists...</Text>
//       </Box>
//     );
//   }

//   return (
//     <VStack gap={6} align="stretch">
//       <HStack justify="space-between">
//         <Heading size="lg">Lantern Mail Lists</Heading>
//         <Button onClick={handleRefresh} loading={loading} size="sm">
//           Refresh
//         </Button>
//       </HStack>

//       {error && <ErrorAlert title="Error Loading Lists" description={error} />}

//       {lists.length === 0 ? (
//         <Box textAlign="center" py={8}>
//           <Text color="gray.500">No mailing lists found</Text>
//           <Text fontSize="sm" color="gray.400" mt={2}>
//             Create lists from individual group pages
//           </Text>
//         </Box>
//       ) : (
//         <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
//           {lists.map((list) => (
//             <Card.Root key={list.id} variant="outline">
//               <Card.Header pb={2}>
//                 <HStack justify="space-between" w="full">
//                   <Text fontWeight="bold" truncate>
//                     {list.display_name}
//                   </Text>
//                   <Badge colorScheme={list.is_active ? "green" : "red"}>
//                     {list.is_active ? "Active" : "Inactive"}
//                   </Badge>
//                 </HStack>
//               </Card.Header>

//               <Card.Body py={3}>
//                 <VStack align="start" gap={3}>
//                   <Text fontSize="sm" color="gray.600">
//                     {list.group_title}
//                   </Text>

//                   <VStack align="start" gap={1} fontSize="xs" color="gray.500">
//                     <Text>ListMonk ID: {list.listmonk_id}</Text>
//                     <Text>Created: {new Date(list.created_at).toLocaleDateString()}</Text>
//                   </VStack>
//                 </VStack>
//               </Card.Body>

//               <Card.Footer pt={2}>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   colorScheme="teal"
//                   w="full"
//                   onClick={() => handleManageList(list)}
//                 >
//                   Manage List
//                 </Button>

//                 {/* Add the modal */}
//                 {selectedList && (
//                   <ListDetailModal
//                     list={selectedList}
//                     isOpen={isDetailModalOpen}
//                     onClose={() => {
//                       setIsDetailModalOpen(false);
//                       setSelectedList(null);
//                     }}
//                   />
//                 )}
//               </Card.Footer>
//             </Card.Root>
//           ))}
//         </SimpleGrid>
//       )}
//     </VStack>
//   );
// }
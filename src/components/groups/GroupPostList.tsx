// src/components/groups/GroupPostList.tsx

"use client";

import {
  Box,
  Input,
  Stack,
  Text,
  Badge,
  Link,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import { createStandaloneToast } from "@chakra-ui/toast";
import { createColumnHelper, ColumnDef } from "@tanstack/react-table";
import { IconUser, IconCalendar } from "@tabler/icons-react";
import AdminModal from "@components/admin/AdminModal";
import { GroupPostForm } from "./GroupPostForm";
import UniversalDataTable from "@components/common/UniversalDataTable";

const { toast } = createStandaloneToast();

interface GroupPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  author_name: string;
  created_at: string;
  frontend_url: string;
  description?: string;
}

export default function GroupPostList({ groupSlug }: { groupSlug: string }) {
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState(false);

  const {
    data: posts = [],
    isLoading,
    error,
    refetch,
  } = useQuery<any, Error>({
    queryKey: ["groupPosts", groupSlug],
    queryFn: () =>
      axiosInstance.get(`/api/groups/${groupSlug}/posts`).then((res) => res.data),
  });

  console.log("GroupPostList posts", posts);

  // Filter posts based on search
  const filteredPosts = posts.filter((p: GroupPost) =>
    p.title?.toLowerCase().includes(filter.toLowerCase())
  );

  // Create column helper for the table
  const columnHelper = createColumnHelper<GroupPost>();

  // Define custom columns for posts
  const columns: ColumnDef<GroupPost>[] = [
    columnHelper.display({
      id: "post_info",
      header: "Posts",
      cell: ({ row }) => {
        const post = row.original;

        return (
          <Box>
            <Link
              href={post.frontend_url}
              color="blue.600"
              fontWeight="semibold"
              fontSize="md"
              _hover={{ color: "blue.800", textDecoration: "underline" }}
            >
              {post.title}
            </Link>

            <Stack direction="row" align="center" gap={4} mt={2}>
              <Badge
                colorScheme={
                  post.status === "published" ? "green" :
                  post.status === "draft" ? "yellow" :
                  post.status === "archived" ? "gray" : "blue"
                }
                size="sm"
              >
                {post.status}
              </Badge>

              <Text
                fontSize="sm"
                color="gray.600"
                display="flex"
                alignItems="center"
                gap={1}
              >
                <IconUser size={14} />
                {post.author_name}
              </Text>

              <Text
                fontSize="sm"
                color="gray.500"
                display="flex"
                alignItems="center"
                gap={1}
              >
                <IconCalendar size={14} />
                {new Date(post.created_at).toLocaleDateString()}
              </Text>
            </Stack>
          </Box>
        );
      },
    }),
  ];

  return (
    <Box>
      {/* Search Filter */}
      <Stack direction="row" justify="space-between" mb={4} gap={4}>
        <Input
          placeholder="Filter posts by title..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          maxW="300px"
        />
      </Stack>

      {/* Universal Data Table */}
      <UniversalDataTable<GroupPost>
        data={filteredPosts}
        title="Group Posts"
        isLoading={isLoading}
        error={error?.message || null}
        columns={columns}
        showAvatar={false}
        emptyStateMessage="No posts found"
        emptyStateSubtitle={
          filter
            ? `No posts match "${filter}". Try adjusting your search.`
            : "Create your first post to get started"
        }
        showCreateButton={true}
        onCreateClick={() => setOpen(true)}
        createButtonLabel="New Post"
        onRowClick={(post) => {
          // Optional: Handle row click if you want to navigate
          window.open(post.frontend_url, '_blank');
        }}
        canView={() => true}
        canEdit={() => false} // Adjust based on your permissions
        pageSize={20}
        defaultSort={{ field: "post_info", order: "desc" }}
      />

      {/* Create Post Modal */}
      <AdminModal
        title="Create New Post"
        isOpen={open}
        onClose={() => setOpen(false)}
      >
        <GroupPostForm
          slug={groupSlug}
          onPostCreated={() => {
            setOpen(false);
            refetch();
          }}
        />
      </AdminModal>
    </Box>
  );
}


// "use client";

// import {
//   Box,
//   Button,
//   Input,
//   Stack,
//   Link,
//   Table,
// } from "@chakra-ui/react";
// import { useQuery } from "@tanstack/react-query";
// import { useState } from "react";
// import { axiosInstance } from "@providers/auth-provider/axiosInstance";
// import { createStandaloneToast } from "@chakra-ui/toast";
// import AdminModal from "@components/admin/AdminModal";
// import { GroupPostForm } from "./GroupPostForm";

// const { toast } = createStandaloneToast();

// export default function GroupPostList({ groupSlug }: { groupSlug: string }) {
//   const [filter, setFilter] = useState("");
//   const [open, setOpen] = useState(false);

//   const {
//     data: posts = [],
//     isLoading,
//     refetch,
//   } = useQuery({
//     queryKey: ["groupPosts", groupSlug],
//     queryFn: () =>
//       axiosInstance.get(`/api/groups/${groupSlug}/posts`).then((res) => res.data),
//   });

//   console.log("GroupPostList posts", posts);

//   const filtered = posts.filter((p: any) =>
//     p.title?.toLowerCase().includes(filter.toLowerCase())
//   );

//   return (
//     <Box>
//       <Stack direction="row" justify="space-between" mb={4} gap={4}>
//         <Input
//           placeholder="Filter by title"
//           value={filter}
//           onChange={(e) => setFilter(e.target.value)}
//           maxW="300px"
//         />
//         <Button onClick={() => setOpen(true)}>
//           + New Post
//         </Button>
//       </Stack>

//       <Table.Root>
//         <Table.Header>
//           <Table.Row>
//             <Table.ColumnHeader>Title</Table.ColumnHeader>
//             <Table.ColumnHeader>Status</Table.ColumnHeader>
//             <Table.ColumnHeader>Author</Table.ColumnHeader>
//             <Table.ColumnHeader>Created</Table.ColumnHeader>
//           </Table.Row>
//         </Table.Header>

//         <Table.Body>
//           {filtered.map((post: any) => (
//             <Table.Row key={post.id}>
//               <Table.Cell>
//                 <Link href={post.frontend_url} color="blue.600">
//                   {post.title}
//                 </Link>
//               </Table.Cell>
//               <Table.Cell>{post.status}</Table.Cell>
//               <Table.Cell>{post.author_name}</Table.Cell>
//               <Table.Cell>
//                 {new Date(post.created_at).toLocaleDateString()}
//               </Table.Cell>
//             </Table.Row>
//           ))}
//         </Table.Body>
//       </Table.Root>

//       <AdminModal
//         title="Create New Post"
//         isOpen={open}
//         onClose={() => setOpen(false)}
//       >
//         <GroupPostForm
//           slug={groupSlug}
//           onPostCreated={() => {
//             setOpen(false);
//             refetch();
//           }}
//         />
//       </AdminModal>
//     </Box>
//   );
// }

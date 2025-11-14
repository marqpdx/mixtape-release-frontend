// components/groups/GroupPostFeed.tsx

"use client";

import {
  Box,
  Heading,
  Text,
  Image,
  Stack,
} from "@chakra-ui/react";
import { Divider } from "@components/common/Divider";
import { useEffect, useState } from "react";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import { PostInterface } from "content/interfaces";

type GroupPostFeedProps = {
  slug: string;
};

export default function GroupPostFeed({
  slug,
}: GroupPostFeedProps) {
  const [posts, setPosts] = useState<PostInterface[]>([]);

  const fetchPosts = async () => {
    try {
      const res = await axiosInstance.get<PostInterface[]>(
        `/api/groups/${slug}/posts`
      );
      setPosts(res.data);
    } catch (err) {
      console.error("Error loading posts:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [slug]);

  return (
    <Stack gap={4} mt={4}>
      {posts.map((post) => (
        <Box
          key={post.id}
          borderWidth="1px"
          p={4}
          borderRadius="md"
        >
          <Heading size="sm">{post.title}</Heading>
          <Text fontSize="sm" color="gray.600">
            by {post.author_name || "Deleted User"}
          </Text>
          {post.summary && (
            <Text mt={2} fontStyle="italic">
              {post.summary}
            </Text>
          )}
          <Text mt={2}>{post.body}</Text>
          {post.image && (
            <Image
              src={post.image}
              mt={3}
              borderRadius={4}
            />
          )}
          <Divider my={4} />
        </Box>
      ))}
      {posts.length === 0 && (
        <Text color="gray.500">No posts yet.</Text>
      )}
    </Stack>
  );
}

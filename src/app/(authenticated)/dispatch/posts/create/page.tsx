// src/app/(protected)/dispatch/posts/create/page.tsx

import { Heading, Box } from "@chakra-ui/react";
import PostCreateForm from "@components/dispatch/PostCreateForm";

export default function PostCreatePage() {
  return (
    <Box maxW="600px" mx="auto" mt={10}>
      <Heading mb={6}>New Post</Heading>
      <PostCreateForm />
    </Box>
  );
}

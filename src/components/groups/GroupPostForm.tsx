"use client";

import {
  Box,
  Button,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import { createStandaloneToast } from "@chakra-ui/toast";

interface GroupPostFormProps {
  slug: string;
  onPostCreated?: () => void;
}

interface PostFormValues {
  title: string;
  summary?: string;
  body?: string;
  image?: string;
}

const { toast } = createStandaloneToast();

export const GroupPostForm = ({
  slug,
  onPostCreated,
}: GroupPostFormProps) => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } =
    useForm<PostFormValues>();

  const onSubmit = async (data: PostFormValues) => {
    try {
      await axiosInstance.post(`/api/groups/${slug}/posts`, data);
      toast({
        title: "Post Created",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      reset();
      onPostCreated?.();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Create Failed",
        description: err?.response?.data?.detail || "Could not create post.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)} mt={6}>
      <VStack gap={4} align="stretch">
        <Box border="1px solid silver" p={2}>
          <Text fontWeight="medium" mb={1}>
            Title
          </Text>
          <Input
            bg="white"
            placeholder="Enter title"
            {...register("title", { required: true })}
          />
        </Box>

        <Box border="1px solid silver" p={2}>
          <Text fontWeight="medium" mb={1}>
            Summary (optional)
          </Text>
          <Input
            bg="white"
            placeholder="Enter summary"
            {...register("summary")}
          />
        </Box>

        <Box border="1px solid silver" p={2}>
          <Text fontWeight="medium" mb={1}>
            Body
          </Text>
          <Textarea
            bg="white"
            placeholder="Write your post..."
            {...register("body")}
          />
        </Box>

        <Box border="1px solid silver" p={2}>
          <Text fontWeight="medium" mb={1}>
            Image URL (optional)
          </Text>
          <Input
            bg="white"
            placeholder="https://example.com/image.jpg"
            {...register("image")}
          />
        </Box>

        <Button
          type="submit"
          size="md"
          loading={isSubmitting}
        >
          Create Post
        </Button>
      </VStack>
    </Box>
  );
};

// src/components/dispatch/PostCreateForm.tsx

// src/components/dispatch/PostCreateForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { Button, Input, Textarea, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";

export default function PostCreateForm() {
  const { register, handleSubmit } = useForm();
  const router = useRouter();

  const onSubmit = async (data: any) => {
    try {
      const res = await axiosInstance.post("/api/dispatch/posts", data);
      router.push(`/dispatch/posts/${res.data.slug}`);
    } catch (err) {
      console.error("Post creation failed", err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <VStack gap={4} align="stretch">
        <Input placeholder="Title" {...register("title")} />
        <Textarea placeholder="Summary" {...register("summary")} />
        <Textarea placeholder="Body" {...register("body")} rows={6} />
        <Button type="submit" >
          Create Post
        </Button>
      </VStack>
    </form>
  );
}

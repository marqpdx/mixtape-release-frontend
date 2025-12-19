// src/components/dispatch/ClientDispatchLandingPage.tsx

"use client";

import React, { useState } from "react";
import {
  Box,
  Heading,
  Flex,
  Button,
  Text,
  Spacer,
  Image,
} from "@chakra-ui/react";
import { IconPlus } from "@tabler/icons-react";
import { toaster } from "@/components/ui/toaster";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import DispatchFolderList from "@components/dispatch/DispatchFolderList";
import { motion } from "framer-motion";
import { useDispatchDocuments } from "@hooks/dispatch/useDispatchDocuments";
import { useQueryClient } from "@tanstack/react-query";

export default function ClientDispatchLandingPage() {
  const queryClient = useQueryClient();
  const { data: documents = [], isLoading } = useDispatchDocuments();

  const MotionBox = motion(Box);

  const handleCreateDocument = async () => {
    try {
      const res = await axiosInstance.post("/api/dispatch/content", {
        title: "Untitled Document",
      });

      // Invalidate and refetch documents
      queryClient.invalidateQueries({ queryKey: ['dispatch', 'documents'] });

      window.location.href = `/dispatch/${res.data.slug}`;
    } catch (err) {
      toaster.create({
        title: "Failed to create document",
        type: "error",
      });
    }
  };

  return (
    <Box maxW="6xl" mx="auto" py={10} px={4}>
      <Flex mb={8} align="center">
        <Heading size="lg">Dispatch</Heading>
        <Spacer />

         <MotionBox
          textAlign="center"
          mt={16}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* <Box display="inline-block" mb={6} color="gray.400">
            <IconNotebook size={48} />
          </Box> */}

          <Image
            src="/images/dispatch-empty-state.png"
            alt="No documents illustration"
            maxW="320px"
            mx="auto"
            mb={6}
            opacity={0.9}
          />

          <Heading size="md" mb={2}>No documents yet</Heading>
          <Text color="gray.500" mb={6}>
            Start by creating a document to collaborate with your team.
          </Text>

          <Button onClick={handleCreateDocument}>
            <IconPlus size={18} />New Document!
          </Button>
        </MotionBox>

      </Flex>

      {isLoading ? (
        <Text>Loading documents...</Text>
      ) : documents.length === 0 ? (
        <Text>No documents yet. Start by creating one!</Text>
      ) : (
        <DispatchFolderList documents={documents} />
      )}
    </Box>
  );
}

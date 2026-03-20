"use client";

import { useRef, useState } from "react";
import {
  Box,
  Button,
  Heading,
  Image,
  Text,
  VStack,
} from "@chakra-ui/react";
import { IconUpload, IconCheck } from "@tabler/icons-react";
import { Divider } from "@components/common/Divider";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

interface ProfileNudgeStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function ProfileNudgeStep({ onNext, onSkip }: ProfileNudgeStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setUploaded(false);
    setUploadError(null);
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("avatar", file);
      await axiosInstance.post("/api/members/me/avatar/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploaded(true);
    } catch {
      setUploadError("Upload failed — you can add a photo from your profile later.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Navigation hint */}
      <VStack gap={3} align="start">
        <Heading size="2xl" fontWeight="semibold">
          Finding your profile
        </Heading>
        <Text fontSize="md" color="gray.600" lineHeight="tall">
          Your profile is your home base on Mixtape. Here&apos;s how to get there:
        </Text>

        {/* Styled nav mockup */}
        <Box
          w="full"
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.200"
          bg="gray.50"
          p={4}
          position="relative"
        >
          <Text fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase" mb={3}>
            Mixtape nav
          </Text>
          <VStack gap={2} align="stretch">
            {/* Avatar row */}
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              p={2}
              borderRadius="md"
              bg="green.50"
              border="1.5px dashed"
              borderColor="green.400"
              position="relative"
            >
              <Box
                w={7}
                h={7}
                borderRadius="full"
                bg="gray.300"
                flexShrink={0}
              />
              <Text fontSize="sm" fontWeight="500">Your name</Text>
              <Box
                position="absolute"
                right={-2}
                top="50%"
                transform="translateY(-50%) translateX(100%)"
                bg="green.500"
                color="white"
                fontSize="2xs"
                px={2}
                py={1}
                borderRadius="md"
                whiteSpace="nowrap"
                fontWeight="600"
              >
                ① Click here
              </Box>
            </Box>

            {/* Menu item */}
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              p={2}
              borderRadius="md"
              bg="blue.50"
              border="1.5px dashed"
              borderColor="blue.400"
              ml={4}
              position="relative"
            >
              <Text fontSize="sm">Edit Profile</Text>
              <Box
                position="absolute"
                right={-2}
                top="50%"
                transform="translateY(-50%) translateX(100%)"
                bg="blue.500"
                color="white"
                fontSize="2xs"
                px={2}
                py={1}
                borderRadius="md"
                whiteSpace="nowrap"
                fontWeight="600"
              >
                ② Then this
              </Box>
            </Box>
          </VStack>
        </Box>
      </VStack>

      <Divider />

      {/* Avatar upload */}
      <VStack gap={3} align="start">
        <Heading size="md" fontWeight="semibold">
          Add a profile photo while you&apos;re here?
        </Heading>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {!preview ? (
          <Box
            w="96px"
            h="96px"
            borderRadius="full"
            border="2px dashed"
            borderColor="gray.300"
            bg="gray.50"
            display="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            _hover={{ borderColor: "green.400", bg: "green.50" }}
            transition="all 0.2s"
            onClick={() => fileInputRef.current?.click()}
          >
            <IconUpload size={24} color="var(--chakra-colors-gray-400)" />
            <Text fontSize="2xs" color="gray.400" mt={1}>
              Add a photo
            </Text>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" gap={4}>
            <Box
              w="96px"
              h="96px"
              borderRadius="full"
              overflow="hidden"
              border="2px solid"
              borderColor={uploaded ? "green.400" : "gray.200"}
              cursor="pointer"
              onClick={() => !uploaded && fileInputRef.current?.click()}
              position="relative"
            >
              <Image src={preview} alt="Preview" w="full" h="full" objectFit="cover" />
              {uploaded && (
                <Box
                  position="absolute"
                  inset={0}
                  bg="blackAlpha.400"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="full"
                >
                  <IconCheck size={28} color="white" />
                </Box>
              )}
            </Box>
            {!uploaded && (
              <VStack gap={1} align="start">
                <Button
                  size="sm"
                  bg="green.500"
                  color="white"
                  onClick={handleUpload}
                  loading={uploading}
                  loadingText="Uploading..."
                  _hover={{ bg: "green.600" }}
                >
                  Use this photo
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  color="gray.500"
                  onClick={() => {
                    setPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Choose different
                </Button>
              </VStack>
            )}
            {uploaded && (
              <Text fontSize="sm" color="green.600" fontWeight="500">
                Photo saved!
              </Text>
            )}
          </Box>
        )}

        {uploadError && (
          <Text fontSize="sm" color="red.500">
            {uploadError}
          </Text>
        )}
      </VStack>

      <VStack gap={2} align="stretch">
        <Button
          bg="green.500"
          color="white"
          onClick={onNext}
          disabled={uploading}
          _hover={{ bg: "green.600" }}
        >
          Continue →
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkip} color="gray.500">
          Skip for now
        </Button>
      </VStack>
    </VStack>
  );
}

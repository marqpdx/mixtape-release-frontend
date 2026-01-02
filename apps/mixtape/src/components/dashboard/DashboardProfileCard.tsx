// /src/components/dashboard/DashboardProfileCard.tsx

"use client";

import { UserIdentity } from "@mixtape/core/types/auth";
import {
  Box,
  Flex,
  Text,
  Badge,
  Button,
} from "@chakra-ui/react";
import { AvatarGroup, Avatar } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
// import { UserIdentity } from "@components/auth/interfaces";
// import { Button } from "@theme/recipes/button.recipe";

interface DashboardProfileCardProps {
  identity: UserIdentity;
  isBuilder: boolean;
  profileEditUrl: string;
  profileShowUrl: string;
}

export const DashboardProfileCard = ({
  identity,
  isBuilder,
  profileEditUrl,
  profileShowUrl,
}: DashboardProfileCardProps) => {
  const router = useRouter();

  const roleLabel = isBuilder ? "Community Builder" : "Member";

  return (
    <Box
      border="1px solid"
      borderColor="gray.300"
      borderRadius="lg"
      overflow="hidden"
      p={4}
      mb={6}
    >
      {/* {identity.profile?.background_image && (
        <Image
          src={identity.profile.background_image}
          alt="Profile banner"
          w="100%"
          h="100px"
          objectFit="cover"
          borderRadius="md"
          mb={4}
        />
      )} */}

      <Flex
        direction={{ base: "column", md: "row" }}
        gap={6}
        justify="space-between"
        align="flex-start"
      >
        {/* Left 1/3: Profile Image + Self Description */}
        <Flex direction="column" align="center" w={{ base: "100%", md: "33%" }}>
          <AvatarGroup size="xl">
            <Avatar.Root>
              {/* <Avatar.Image
                src={identity.profile?.profile_image || undefined}
                alt={identity.first_name || identity.username}
              /> */}
              <Avatar.Fallback>
                {identity.first_name?.charAt(0).toUpperCase() ||
                  identity.username?.charAt(0).toUpperCase()}
              </Avatar.Fallback>
            </Avatar.Root>
          </AvatarGroup>

          {/* {identity.profile?.self_description && (
            <Heading as="h3" size="sm" mt={3} textAlign="center">
              {identity.profile.self_description}
            </Heading>
          )} */}

          <Badge colorScheme={isBuilder ? "green" : "gray"} mt={2}>
            {roleLabel}
          </Badge>
        </Flex>

        {/* Middle 1/3: Intro Text + Bio */}
        <Box w={{ base: "100%", md: "34%" }}>
          <Text fontSize="md" mb={2}>
            Welcome, {identity.first_name || identity.username}! This is your space to
            engage, connect, and contribute to the Mixtape ecosystem.
          </Text>

          {/* {identity.profile?.bio_json && ( */}
          {false && (
            <Box
              maxH="100px"
              overflowY="auto"
              p={2}
              border="1px solid"
              borderColor="gray.100"
              borderRadius="md"
              bg="gray.50"
            >
              {/* <Text fontSize="sm" whiteSpace="pre-wrap">
                {identity.profile.bio_json}
              </Text> */}
            </Box>
          )}
        </Box>

        {/* Right 1/3: Actions */}
        <Flex
          direction="column"
          align={{ base: "center", md: "flex-end" }}
          w={{ base: "100%", md: "33%" }}
          gap={3}
        >
          <Button size={'sm'} w="70%" onClick={() => router.push(profileEditUrl)}>
            Edit My Profile
          </Button>

          <Button size={'sm'} w="70%" onClick={() => router.push(profileShowUrl)}>
            Show My Profile
          </Button>

          <Button size={'sm'} w="70%"  >
            Post a New Item
          </Button>

          {!isBuilder && (
            // <Button size={'sm'} w="70%" visual={'solidCenter'}>
            <Button size={'sm'} w="70%" >
              Become a Community Builder
            </Button>
          )}

          {isBuilder && (
            <>
              <Button size={'sm'} w="70%">
                Create New Group
              </Button>
              <Button size={'sm'} w="70%">
                Invite Someone to Mixtape
              </Button>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};


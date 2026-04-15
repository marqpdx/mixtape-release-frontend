"use client";

import { Badge, Box, Button, Heading, HStack, Image, Link, Text, VStack } from "@chakra-ui/react";
import NextLink from "next/link";
import { useColorModeValue } from "@components/ui/color-mode";
import type { PublicMemberProfile } from "@mixtape/api/clients/public/publicApi";
import { TipTapRenderer } from "@mixtape/content/TipTapRenderer";

function splitProfileList(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

interface MemberProfileTemplateProps {
  profile: PublicMemberProfile;
  isOwner?: boolean;
  editHref?: string;
}

export default function MemberProfileTemplate({
  profile,
  isOwner = false,
  editHref = "/app/dashboard?section=edit-profile",
}: MemberProfileTemplateProps) {
  const cardBg = useColorModeValue("gray.50", "gray.800");
  const panelBg = useColorModeValue("white", "gray.900");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const avatarFallbackBg = useColorModeValue("gray.300", "gray.600");
  const skills = splitProfileList(profile.skills);
  const workAreas = splitProfileList(profile.work_areas);

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={8}>
      <Box
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="2xl"
        overflow="hidden"
        bg={panelBg}
        boxShadow="sm"
        maxW="960px"
        mx="auto"
      >
        <Box position="relative">
          {profile.background_image_url ? (
            <Image
              src={profile.background_image_url}
              alt=""
              w="full"
              h={{ base: "180px", md: "240px" }}
              objectFit="cover"
            />
          ) : (
            <Box
              w="full"
              h={{ base: "180px", md: "240px" }}
              background="linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(16,185,129,0.16) 100%)"
            />
          )}

          {isOwner && (
            <Button
              asChild
              size="sm"
              position="absolute"
              top={{ base: 3, md: 5 }}
              right={{ base: 3, md: 5 }}
              zIndex={2}
              colorPalette="blue"
              variant="solid"
            >
              <Link as={NextLink} href={editHref}>
                Edit Profile
              </Link>
            </Button>
          )}

          <Box
            position="absolute"
            left={{ base: "20px", md: "36px" }}
            bottom={{ base: "-44px", md: "-56px" }}
            w={{ base: "88px", md: "112px" }}
            h={{ base: "88px", md: "112px" }}
            borderRadius="full"
            overflow="hidden"
            border="4px solid"
            borderColor={cardBg}
            bg={avatarFallbackBg}
            boxShadow="lg"
          >
            {profile.profile_image_url || profile.avatar_url ? (
              <Image
                src={profile.profile_image_url || profile.avatar_url}
                alt={profile.display_name}
                w="full"
                h="full"
                objectFit="cover"
              />
            ) : (
              <Box
                w="full"
                h="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="bold"
                color="white"
              >
                {profile.display_name.charAt(0).toUpperCase()}
              </Box>
            )}
          </Box>
        </Box>

        <VStack align="stretch" gap={5} px={{ base: 5, md: 8 }} pt={{ base: 14, md: 18 }} pb={8}>
          <VStack
            gap={1}
            align="start"
            textAlign="left"
            pl={{ base: "92px", md: "128px" }}
            minH={{ base: "56px", md: "64px" }}
          >
            <Heading size="2xl">{profile.display_name}</Heading>
            <Text color={mutedColor}>@{profile.username}</Text>
            {profile.quick_intro && (
              <Text maxW="2xl">{profile.quick_intro}</Text>
            )}
            {profile.right_now && (
              <Text color={mutedColor} fontStyle="italic">
                Right now: {profile.right_now}
              </Text>
            )}
          </VStack>

          {profile.groups && profile.groups.length > 0 && (
            <HStack gap="2" flexWrap="wrap">
              {profile.groups.map((group) => (
                <Badge key={group.slug} variant="subtle" borderRadius="full" px="3" py="1">
                  {group.title}
                </Badge>
              ))}
            </HStack>
          )}

          {(workAreas.length > 0 || skills.length > 0) && (
            <VStack align="stretch" gap={4}>
              {workAreas.length > 0 && (
                <Box>
                  <Text color={mutedColor} fontSize="sm" fontWeight="medium" mb={2}>
                    Work Areas
                  </Text>
                  <HStack gap="2" flexWrap="wrap">
                    {workAreas.map((area) => (
                      <Badge key={area} variant="subtle" colorPalette="blue">
                        {area}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              )}
              {skills.length > 0 && (
                <Box>
                  <Text color={mutedColor} fontSize="sm" fontWeight="medium" mb={2}>
                    Skills
                  </Text>
                  <HStack gap="2" flexWrap="wrap">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="subtle" colorPalette="green">
                        {skill}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              )}
            </VStack>
          )}

          {profile.bio_json && Object.keys(profile.bio_json).length > 0 && (
            <Box pt={2}>
              <TipTapRenderer
                content={profile.bio_json as unknown as Parameters<typeof TipTapRenderer>[0]["content"]}
              />
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
}

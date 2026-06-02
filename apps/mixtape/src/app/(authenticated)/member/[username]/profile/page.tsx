// apps/mixtape/src/app/(authenticated)/member/[username]/profile/page.tsx

"use client";

import { useParams } from "next/navigation";
import {
  Box,
  Heading,
  Text,
  Grid,
  VStack,
  HStack,
  Spinner,
  Button,
  Container,
  Link,
} from "@chakra-ui/react";
import {
  IconUser,
  IconMail,
  IconCalendar,
  IconQuote,
  IconAt,
  IconBooks,
} from "@tabler/icons-react";
import NextLink from "next/link";
import { useMemberProfile } from "@hooks/member/useMemberProfile";
import { useColorModeValue } from "@components/ui/color-mode";
import { Divider } from "@components/common/Divider";
import { MixtapeAlert } from "@/components/ui/alerts";
import HeroImageBanner from "@/components/common/HeroImageBanner";

function splitProfileList(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * DetailItem - displays a labeled field with icon
 */
const DetailItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value?: string | null;
}) => {
  const labelColor = useColorModeValue("gray.600", "gray.400");
  const iconColor = useColorModeValue("blue.500", "blue.300");

  return (
    <Grid templateColumns="auto 1fr" gap={3} alignItems="center">
      <Box color={iconColor}>
        <Icon size={20} />
      </Box>
      <Box>
        <Text fontWeight="medium" color={labelColor} fontSize="sm">
          {label}
        </Text>
        <Text fontSize="md">{value || "—"}</Text>
      </Box>
    </Grid>
  );
};

/**
 * Profile Show Page - Alternative layout with HeroImageBanner
 *
 * Displays a member's profile with a hero banner style.
 * Route: /member/[username]/profile
 */
const ProfileShowPage = () => {
  const params = useParams();
  const username = params?.username as string;

  const { member, isLoading, error } = useMemberProfile(username);

  const cardBg = useColorModeValue("gray.50", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");

  if (isLoading) {
    return (
      <Container maxW="4xl" py={12}>
        <Box display="flex" justifyContent="center" alignItems="center" minH="300px">
          <VStack gap={4}>
            <Spinner size="xl" />
            <Text>Loading profile...</Text>
          </VStack>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="4xl" py={12}>
        <MixtapeAlert
          title="Error Loading Profile"
          description={error.message || "Unable to load profile"}
          status="error"
        />
      </Container>
    );
  }

  if (!member) {
    return (
      <Container maxW="4xl" py={12}>
        <MixtapeAlert
          title="Profile Not Found"
          description="The member profile you're looking for doesn't exist."
          status="warning"
        />
      </Container>
    );
  }

  const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ");
  const joinDate = new Date(member.date_joined).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const skills = splitProfileList(member.skills);
  const workAreas = splitProfileList(member.work_areas);

  return (
    <Container maxW="4xl" py={8}>
      <Box className="profile-show-page" w="100%" mx="auto">
        {/* Hero Banner with avatar */}
        <HeroImageBanner
          backgroundImage={member.background_image_url || undefined}
          profileImage={member.profile_image_url || member.avatar_url || undefined}
        />

        <Box
          bg={cardBg}
          border="1px solid"
          borderColor={cardBorder}
          borderRadius="md"
          p={6}
          mt={6}
          boxShadow="sm"
        >
          <VStack align="start" gap={6}>
            {/* Header */}
            <Box>
              <Heading size="lg" mb={1}>
                {member.display_name || fullName || member.username}
              </Heading>
              <Text color="gray.500" fontSize="md">
                {member.quick_intro || "No quick intro provided."}
              </Text>
            </Box>

            <Divider />

            {/* Details Grid */}
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} w="100%">
              <DetailItem
                icon={IconAt}
                label="Username"
                value={`@${member.username}`}
              />
              <DetailItem
                icon={IconMail}
                label="Email"
                value={member.email}
              />
              {fullName && (
                <DetailItem
                  icon={IconUser}
                  label="Full Name"
                  value={fullName}
                />
              )}
              <DetailItem
                icon={IconCalendar}
                label="Member Since"
                value={joinDate}
              />
              {member.quick_intro && (
                <DetailItem
                  icon={IconQuote}
                  label="Quick Intro"
                  value={member.quick_intro}
                />
              )}
              {member.right_now && (
                <DetailItem
                  icon={IconQuote}
                  label="Right Now"
                  value={member.right_now}
                />
              )}
            </Grid>

            {(workAreas.length > 0 || skills.length > 0) && (
              <Box w="100%">
                {workAreas.length > 0 && (
                  <Box mb={skills.length > 0 ? 4 : 0}>
                    <Text fontWeight="medium" color="gray.600" fontSize="sm" mb={2}>
                      Work Areas
                    </Text>
                    <HStack gap={2} flexWrap="wrap">
                      {workAreas.map((area) => (
                        <Button key={area} size="xs" variant="outline" pointerEvents="none">
                          {area}
                        </Button>
                      ))}
                    </HStack>
                  </Box>
                )}
                {skills.length > 0 && (
                  <Box>
                    <Text fontWeight="medium" color="gray.600" fontSize="sm" mb={2}>
                      Skills
                    </Text>
                    <HStack gap={2} flexWrap="wrap">
                      {skills.map((skill) => (
                        <Button key={skill} size="xs" variant="outline" pointerEvents="none">
                          {skill}
                        </Button>
                      ))}
                    </HStack>
                  </Box>
                )}
              </Box>
            )}

            {/* Roles */}
            {member.roles && member.roles.length > 0 && (
              <Box>
                <Text fontWeight="medium" color="gray.600" fontSize="sm" mb={2}>
                  Roles
                </Text>
                <Text fontSize="md">
                  {member.roles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(", ")}
                </Text>
              </Box>
            )}

            <Box>
              <Text fontWeight="medium" color="gray.600" fontSize="sm" mb={2}>
                Library
              </Text>
              <Button as={NextLink}  variant="outline">
                <HStack gap={2}>
                  <IconBooks size={16} />
                  <Link href={`/@${member.username}/library`}>
                    <Text>View Library</Text>
                  </Link>
                </HStack>
              </Button>
            </Box>

            {/* Back Button */}
            <Button
              mt={4}
              variant="outline"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </VStack>
        </Box>
      </Box>
    </Container>
  );
};

export default ProfileShowPage;

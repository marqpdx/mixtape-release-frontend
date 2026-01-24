// apps/mixtape/src/app/(authenticated)/member/[username]/profile/page.tsx

"use client";

import { useParams } from "next/navigation";
import {
  Box,
  Heading,
  Text,
  Grid,
  VStack,
  Spinner,
  Button,
  Container,
} from "@chakra-ui/react";
import {
  IconUser,
  IconMail,
  IconCalendar,
  IconQuote,
  IconAt,
} from "@tabler/icons-react";
import { useMemberProfile } from "@hooks/member/useMemberProfile";
import { useColorModeValue } from "@components/ui/color-mode";
import { Divider } from "@components/common/Divider";
import { MixtapeAlert } from "@/components/ui/alerts";
import HeroImageBanner from "@/components/common/HeroImageBanner";

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

  return (
    <Container maxW="4xl" py={8}>
      <Box className="profile-show-page" w="100%" mx="auto">
        {/* Hero Banner with avatar */}
        <HeroImageBanner
          backgroundImage={undefined} // Could add background_url to MemberProfile later
          profileImage={member.avatar_url || undefined}
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
            </Grid>

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

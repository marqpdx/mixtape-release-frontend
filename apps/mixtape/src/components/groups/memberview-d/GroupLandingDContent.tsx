"use client";

import { Box, Flex, Grid, Image, Text, Button } from "@chakra-ui/react";
import {
  IconUpload,
  IconMessageCircle,
  IconHelpCircle,
  IconFolder,
  IconUsers,
} from "@tabler/icons-react";
import type { GroupMemberViewData } from "../member-views/useGroupMemberViewData";
import { MembersTab } from "../tabs/MembersTab";

// ── shared primitives ──────────────────────────────────────────────────────

function Card({
  children,
  accentRail = false,
  className,
}: {
  children: React.ReactNode;
  accentRail?: boolean;
  className?: string;
}) {
  return (
    <Box
      className={className}
      bg="theme.surface"
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="16px"
      boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
      px="26px"
      py="24px"
      position="relative"
      overflow="hidden"
    >
      {accentRail && (
        <Box
          position="absolute"
          left="0"
          top="0"
          bottom="0"
          w="4px"
          bg="theme.accent"
        />
      )}
      {children}
    </Box>
  );
}

function SectionHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <Flex align="baseline" justify="space-between" mb={4}>
      <Box>
        <Text
          as="h2"
          fontFamily="heading"
          fontSize="22px"
          fontWeight="600"
          color="theme.text"
          lineHeight="1.2"
        >
          {title}
        </Text>
        {subtitle && (
          <Text fontSize="14px" color="theme.textSecondary" mt="2px">
            {subtitle}
          </Text>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Flex>
  );
}

// ── Start Here ─────────────────────────────────────────────────────────────

const WHAT_HERE_TILES = [
  {
    id: "share",
    icon: IconUpload,
    title: "Share",
    desc: "Post wins, updates, and finds.",
  },
  {
    id: "converse",
    icon: IconMessageCircle,
    title: "Converse",
    desc: "Open-ended threads & discussion.",
  },
  {
    id: "ask",
    icon: IconHelpCircle,
    title: "Ask",
    desc: "Questions that need an answer.",
  },
  {
    id: "files",
    icon: IconFolder,
    title: "Resources",
    desc: "Core files & findings.",
  },
] as const;

interface StartHereProps {
  viewData: GroupMemberViewData;
  onNavigate: (id: "start" | "introduce" | "share" | "converse" | "ask" | "files" | "findings") => void;
}

export function GroupLandingDStartHere({ viewData, onNavigate }: StartHereProps) {
  return (
    <Flex direction="column" gap={4} className="gld-start-root">
      {/* Welcome card */}
      <Card accentRail className="gld-welcome-card">
        <Text
          fontSize="11.5px"
          fontWeight="600"
          letterSpacing="0.14em"
          textTransform="uppercase"
          color="theme.textMuted"
          mb={3}
        >
          Welcome
        </Text>
        <Text
          as="h2"
          fontFamily="heading"
          fontSize="26px"
          fontWeight="700"
          color="theme.text"
          lineHeight="1.1"
          mb={4}
        >
          Welcome to {viewData.identity.title}
        </Text>
        <Flex direction="column" gap={3}>
          <Text fontSize="15px" lineHeight="1.5" color="theme.textSecondary">
            This is your group's home. Use the <strong style={{ color: "inherit" }}>left navigation</strong> to move
            between welcome materials, conversations, and resources.
          </Text>
          <Text fontSize="15px" lineHeight="1.5" color="theme.textSecondary">
            Start in{" "}
            <Box
              as="button"
              fontWeight="600"
              color="theme.accent"
              cursor="pointer"
              onClick={() => onNavigate("introduce")}
              _hover={{ textDecoration: "underline" }}
              display="inline"
            >
              Introduce Yourselves
            </Box>{" "}
            to add a photo and a short intro — it's how other members get to know you here.
          </Text>
          <Text fontSize="15px" lineHeight="1.5" color="theme.textSecondary">
            Everything the group makes together lives under{" "}
            <strong style={{ color: "inherit" }}>Resources</strong> — core files, findings, and links.
          </Text>
        </Flex>
      </Card>

      {/* What's here card */}
      <Card className="gld-whats-here-card">
        <SectionHead title="What's here" subtitle="A quick map of the space." />
        <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={3}>
          {WHAT_HERE_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <Box
                key={tile.id}
                as="button"
                textAlign="left"
                p={4}
                borderRadius="10px"
                borderWidth="1px"
                borderColor="theme.border"
                cursor="pointer"
                _hover={{ borderColor: "theme.accent", transform: "translateY(-1px)" }}
                transition="border-color 0.15s, transform 0.15s"
                onClick={() => onNavigate(tile.id as Parameters<StartHereProps["onNavigate"]>[0])}
              >
                <Flex align="center" gap={3} mb={2}>
                  <Flex
                    w="32px"
                    h="32px"
                    borderRadius="8px"
                    bg="theme.accentSoft"
                    align="center"
                    justify="center"
                    color="theme.accent"
                    flexShrink={0}
                  >
                    <Icon size={16} />
                  </Flex>
                  <Text fontWeight="600" fontSize="15px" color="theme.text">
                    {tile.title}
                  </Text>
                </Flex>
                <Text fontSize="13px" color="theme.textSecondary" lineHeight="1.4">
                  {tile.desc}
                </Text>
              </Box>
            );
          })}
        </Grid>
      </Card>
    </Flex>
  );
}

// ── Introduce Yourselves ───────────────────────────────────────────────────

interface IntroduceProps {
  viewData: GroupMemberViewData;
}

export function GroupLandingDIntroduce({ viewData }: IntroduceProps) {
  return (
    <Flex direction="column" gap={4} className="gld-introduce-root">
      {/* Intro prompt banner */}
      <Box
        className="gld-intro-prompt"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="theme.accent"
        borderRadius="14px"
        px={5}
        py={4}
        bg="theme.accentSoft"
      >
        <Flex align="center" gap={4}>
          <Flex
            w="40px"
            h="40px"
            borderRadius="full"
            bg="theme.accent"
            align="center"
            justify="center"
            color="white"
            flexShrink={0}
            fontSize="16px"
            fontWeight="700"
          >
            Me
          </Flex>
          <Box flex="1">
            <Text fontWeight="600" fontSize="15px" color="theme.text">
              Introduce yourself
            </Text>
            <Text fontSize="14px" color="theme.textSecondary">
              Add a photo, a short bio, and what you're here for.
            </Text>
          </Box>
          <Button
            size="sm"
            bg="theme.accent"
            color="white"
            borderRadius="10px"
            fontWeight="600"
            _hover={{ opacity: 0.9 }}
            flexShrink={0}
          >
            Set up profile
          </Button>
        </Flex>
      </Box>

      {/* Member intros card — use real member data */}
      <Card className="gld-member-intros-card">
        <SectionHead
          title="Member intros"
          subtitle="How the group gets to know each other."
        />
        {viewData.members.active.length === 0 && !viewData.members.isLoading ? (
          <Flex
            align="center"
            justify="center"
            py={12}
            direction="column"
            gap={2}
            color="theme.textMuted"
          >
            <IconUsers size={32} />
            <Text fontSize="14px">No members yet.</Text>
          </Flex>
        ) : (
          <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={3}>
            {viewData.members.active.slice(0, 6).map((member) => (
              <Flex
                key={member.member_id}
                className="gld-intro-card"
                p={4}
                borderRadius="12px"
                borderWidth="1px"
                borderColor="theme.border"
                gap={3}
                align="flex-start"
              >
                {member.profile_image ? (
                  <Image
                    src={member.profile_image}
                    alt={member.display_name || "member"}
                    w="40px"
                    h="40px"
                    borderRadius="full"
                    objectFit="cover"
                    flexShrink={0}
                  />
                ) : (
                  <Flex
                    w="40px"
                    h="40px"
                    borderRadius="full"
                    bg="theme.accent"
                    align="center"
                    justify="center"
                    color="white"
                    fontSize="16px"
                    fontWeight="700"
                    flexShrink={0}
                  >
                    {(member.display_name || member.username || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </Flex>
                )}
                <Box minW={0}>
                  <Text fontWeight="600" fontSize="14px" color="theme.text" lineHeight="1.2">
                    {member.display_name || member.username}
                  </Text>
                  <Text fontSize="12px" color="theme.textMuted" textTransform="capitalize">
                    {member.roles.includes("admin") ? "Admin" : member.roles.includes("steward") ? "Steward" : "Member"}
                  </Text>
                  {/* bio placeholder lines */}
                  <Box mt={2} h="8px" bg="theme.bgSubtle" borderRadius="4px" w="80%" />
                  <Box mt={1} h="8px" bg="theme.bgSubtle" borderRadius="4px" w="60%" />
                </Box>
              </Flex>
            ))}
          </Grid>
        )}
        {/* Use the real MembersTab below the intro cards for full member list */}
        {viewData.members.active.length > 6 && (
          <Box mt={4} pt={4} borderTopWidth="1px" borderColor="theme.border">
            <MembersTab group={viewData.group} />
          </Box>
        )}
      </Card>
    </Flex>
  );
}

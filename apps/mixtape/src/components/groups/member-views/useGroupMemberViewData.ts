"use client";

import { useMemo } from "react";
import { useCollections } from "@mixtape/api/hooks/stackroom/useCollections";
import { useGroupOverviewLayout, useGroupWelcomePin, useMembers } from "@mixtape/api/hooks";
import { useGroupCircles } from "@mixtape/api/hooks/groups/useGroups";
import { useStall } from "@mixtape/api/hooks/useBazaar";
import type { GroupWelcomePin } from "@mixtape/api/clients/group/groupApi";
import { getBestEmblemUrl } from "@mixtape/core/types/emblemTypes";
import {
  canUserModerateGroup,
  type Group,
  type GroupMembership,
  type GroupOverviewLayout,
} from "@mixtape/core/types/groupTypes";
import type { CollectionListItem } from "@mixtape/core/types/collectionTypes";
import type { Stall } from "@mixtape/core/types/bazaarTypes";

export interface GroupMemberViewData {
  group: Group;
  identity: {
    title: string;
    slug: string;
    type: Group["group_type"];
    visibility: Group["visibility"];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    foundedLabel: string;
  };
  copy: {
    summary: string;
    about: string;
    description: string;
    authorLabel: string | null;
  };
  media: {
    heroImage?: string;
    emblemUrl?: string;
  };
  members: {
    all: GroupMembership[];
    active: GroupMembership[];
    admins: GroupMembership[];
    stewards: GroupMembership[];
    regular: GroupMembership[];
    leaders: GroupMembership[];
    leaderCount: number;
    memberCount: number;
    isLoading: boolean;
  };
  collections: {
    all: CollectionListItem[];
    ordered: CollectionListItem[];
    count: number;
    totalItems: number;
    isLoading: boolean;
  };
  circles: {
    all: Group[];
    count: number;
    isLoading: boolean;
  };
  bazaar: {
    stall: Stall | null;
    offeringsCount: number;
    isLoading: boolean;
  };
  overview: {
    welcomePin: GroupWelcomePin | null;
    layout: GroupOverviewLayout | null;
    isWelcomeLoading: boolean;
    isLayoutLoading: boolean;
  };
  permissions: {
    canModerateGroup: boolean;
  };
}

function formatFoundedDate(input?: string): string {
  if (!input) return "Recently founded";
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "Recently founded";
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getAuthorLabel(group: Group): string | null {
  if (!group.author_name && !group.submitted_by_username) return null;
  const byline = group.author_name || group.submitted_by_username;
  const username =
    group.submitted_by_username && group.author_name
      ? ` — ${group.submitted_by_username}`
      : "";
  return `${byline}${username} · group steward`;
}

function sortCollections(collections: CollectionListItem[]): CollectionListItem[] {
  return [...collections].sort((a, b) => {
    if (a.title === "Core Resources") return -1;
    if (b.title === "Core Resources") return 1;
    return a.title.localeCompare(b.title);
  });
}

export function useGroupMemberViewData(group: Group): GroupMemberViewData {
  const members = useMembers(group.slug);
  const { collections, isLoading: collectionsLoading } = useCollections({
    sponsor_type: "group",
    sponsor_id: group.id,
  });
  const { circles, isLoading: circlesLoading } = useGroupCircles(group.slug);
  const { stall, isLoading: stallLoading } = useStall("group", group.id);
  const { pin: welcomePin, isLoading: welcomeLoading } = useGroupWelcomePin(group.slug);
  const { layout, isLoading: layoutLoading } = useGroupOverviewLayout(group.slug);

  const leaderData = useMemo(() => {
    const stewardsOnly = members.stewardMembers.filter(
      (member) => !member.roles.includes("admin")
    );
    const allLeaders = [...members.adminMembers, ...stewardsOnly];
    return {
      leaders: allLeaders.slice(0, 5),
      leaderCount: allLeaders.length,
    };
  }, [members.adminMembers, members.stewardMembers]);

  const orderedCollections = useMemo(
    () => sortCollections(collections),
    [collections]
  );

  const totalItems = useMemo(
    () => collections.reduce((sum, collection) => sum + (collection.item_count || 0), 0),
    [collections]
  );

  const emblemUrl = getBestEmblemUrl(group.emblem) || undefined;
  const heroImage =
    group.profile_image_url ||
    group.background_image_url ||
    emblemUrl;

  return {
    group,
    identity: {
      title: group.title,
      slug: group.slug,
      type: group.group_type,
      visibility: group.visibility,
      isActive: group.is_active,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
      foundedLabel: formatFoundedDate(group.created_at),
    },
    copy: {
      summary:
        group.summary?.trim() ||
        group.description?.trim() ||
        "This group is still shaping its public summary.",
      about: group.body?.trim() || group.description?.trim() || "",
      description: group.description?.trim() || "No summary provided yet.",
      authorLabel: getAuthorLabel(group),
    },
    media: {
      heroImage,
      emblemUrl,
    },
    members: {
      all: members.members,
      active: members.activeMembers,
      admins: members.adminMembers,
      stewards: members.stewardMembers,
      regular: members.regularMembers,
      leaders: leaderData.leaders,
      leaderCount: leaderData.leaderCount,
      memberCount: group.member_count || members.activeMembers.length || 0,
      isLoading: members.isLoading,
    },
    collections: {
      all: collections,
      ordered: orderedCollections,
      count: collections.length,
      totalItems,
      isLoading: collectionsLoading,
    },
    circles: {
      all: circles,
      count: circles.length,
      isLoading: circlesLoading,
    },
    bazaar: {
      stall,
      offeringsCount: stall?.offerings_count ?? 0,
      isLoading: stallLoading,
    },
    overview: {
      welcomePin,
      layout,
      isWelcomeLoading: welcomeLoading,
      isLayoutLoading: layoutLoading,
    },
    permissions: {
      canModerateGroup: canUserModerateGroup(group),
    },
  };
}

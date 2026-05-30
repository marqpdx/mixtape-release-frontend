"use client";

import { useEffect, useState } from "react";

export const GROUP_MEMBER_TABS = [
  { key: "overview", numeral: "I.", label: "Overview" },
  { key: "members", numeral: "II.", label: "Members" },
  { key: "threadworks", numeral: "III.", label: "Conversations" },
  { key: "collections", numeral: "IV.", label: "Collections" },
] as const;

export type GroupMemberTabKey = (typeof GROUP_MEMBER_TABS)[number]["key"];
export type CollectionDetailSource = "collections" | "overview";

export function isGroupMemberTabKey(value: string): value is GroupMemberTabKey {
  return GROUP_MEMBER_TABS.some((tab) => tab.key === value);
}

export function useGroupMemberTabs(groupSlug: string) {
  const storageKey = `groupTab_${groupSlug}_member`;
  const [activeTab, setActiveTab] = useState<GroupMemberTabKey | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [collectionDetailSource, setCollectionDetailSource] =
    useState<CollectionDetailSource>("collections");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(storageKey);
    setActiveTab(saved && isGroupMemberTabKey(saved) ? saved : GROUP_MEMBER_TABS[0].key);
  }, [storageKey]);

  const handleTabChange = (value: string) => {
    const next = isGroupMemberTabKey(value) ? value : GROUP_MEMBER_TABS[0].key;
    setActiveTab(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, next);
    }
  };

  const openCollectionFromOverview = (collectionId: string) => {
    setCollectionDetailSource("overview");
    setSelectedCollectionId(collectionId);
    handleTabChange("collections");
  };

  const setSelectedCollection = (collectionId: string | null) => {
    setSelectedCollectionId(collectionId);
    if (!collectionId) {
      setCollectionDetailSource("collections");
    }
  };

  const returnToOverview = () => {
    setSelectedCollectionId(null);
    setCollectionDetailSource("overview");
    handleTabChange("overview");
  };

  const showAllCollections = () => {
    setSelectedCollectionId(null);
    setCollectionDetailSource("collections");
    handleTabChange("collections");
  };

  return {
    tabs: GROUP_MEMBER_TABS,
    activeTab,
    selectedCollectionId,
    collectionDetailSource,
    handleTabChange,
    openCollectionFromOverview,
    setSelectedCollection,
    returnToOverview,
    showAllCollections,
  };
}

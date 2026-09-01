"use client";

// GroupPublicAdminBar — renders only for authenticated group admins/owners/stewards.
// Provides quick-edit access to T1 Group fields (title, description, background image)
// without leaving the public page preview. Calls PATCH /api/groups/{slug} on save,
// then triggers a server component refresh via router.refresh().

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  Textarea,
} from "@chakra-ui/react";
import Link from "next/link";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

interface MyPerms {
  is_admin: boolean;
  is_owner: boolean;
  is_steward: boolean;
}

interface GroupData {
  title: string;
  description: string;
  background_image_url: string | null;
}

type EditField = "title" | "description" | "background_image_url" | null;

interface Props {
  groupSlug: string;
  groupTitle: string;
}

export function GroupPublicAdminBar({ groupSlug, groupTitle }: Props) {
  const router = useRouter();
  const [perms, setPerms] = useState<MyPerms | null>(null);
  const [groupData, setGroupData] = useState<GroupData>({
    title: groupTitle,
    description: "",
    background_image_url: null,
  });
  const [editField, setEditField] = useState<EditField>(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    axiosInstance
      .get<MyPerms>(`/api/groups/${groupSlug}/my-permissions`)
      .then((r) => {
        setPerms(r.data);
        // Fetch group data to pre-fill edit fields
        return axiosInstance.get<GroupData>(`/api/groups/${groupSlug}`);
      })
      .then((r) => {
        setGroupData({
          title: r.data.title,
          description: r.data.description || "",
          background_image_url: r.data.background_image_url || null,
        });
      })
      .catch(() => setPerms(null));
  }, [groupSlug]);

  const isAdmin = perms && (perms.is_admin || perms.is_owner || perms.is_steward);
  if (!isAdmin) return null;

  function openEdit(field: EditField, currentValue: string) {
    setEditField(field);
    setInputValue(currentValue);
    setSaveError(null);
  }

  function closeEdit() {
    setEditField(null);
    setInputValue("");
    setSaveError(null);
  }

  async function handleSave() {
    if (!editField) return;
    setSaving(true);
    setSaveError(null);

    const fieldMap: Record<string, string> = {
      title: "title",
      description: "description",
      background_image_url: "background_image",
    };

    try {
      await axiosInstance.patch(`/api/groups/${groupSlug}`, {
        [fieldMap[editField]]: inputValue.trim(),
      });
      // Update local cache so next edit opens with the saved value
      setGroupData((prev) => ({ ...prev, [editField]: inputValue.trim() }));
      closeEdit();
      router.refresh();
    } catch {
      setSaveError("Could not save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const EDIT_CONFIG: Record<
    string,
    { label: string; currentValue: string; multiline?: boolean; placeholder: string }
  > = {
    title: {
      label: "Group name",
      currentValue: groupData.title,
      placeholder: "Group name",
    },
    description: {
      label: "Description",
      currentValue: groupData.description,
      multiline: true,
      placeholder: "A short description of your group...",
    },
    background_image_url: {
      label: "Background image URL",
      currentValue: groupData.background_image_url ?? "",
      placeholder: "https://...",
    },
  };

  return (
    <>
      {/* Fixed admin bar */}
      <Box
        className="gpa-bar"
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={1000}
        bg="gray.900"
        borderBottomWidth="1px"
        borderColor="gray.700"
        px={{ base: 4, md: 8 }}
        py={2}
      >
        <Flex align="center" justify="space-between" gap={4} flexWrap="wrap">
          <Flex align="center" gap={2}>
            <Text fontSize="xs" color="gray.400" fontWeight="500">
              Previewing your public page
            </Text>
          </Flex>

          <Flex align="center" gap={2} flexWrap="wrap">
            <Button
              size="xs"
              variant="ghost"
              color="gray.300"
              _hover={{ color: "white", bg: "gray.700" }}
              onClick={() => openEdit("title", groupTitle)}
            >
              ✏ Name
            </Button>
            <Button
              size="xs"
              variant="ghost"
              color="gray.300"
              _hover={{ color: "white", bg: "gray.700" }}
              onClick={() => openEdit("description", "")}
            >
              ✏ Description
            </Button>
            <Button
              size="xs"
              variant="ghost"
              color="gray.300"
              _hover={{ color: "white", bg: "gray.700" }}
              onClick={() => openEdit("background_image_url", "")}
            >
              ✏ Background
            </Button>
          </Flex>

          <Link href={`/group/${groupSlug}/admin/settings`} style={{ textDecoration: "none" }}>
            <Text fontSize="xs" color="indigo.300" fontWeight="500" _hover={{ color: "indigo.200" }}>
              Open settings →
            </Text>
          </Link>
        </Flex>
      </Box>

      {/* Spacer so banner isn't hidden under the fixed bar */}
      <Box h="40px" />

      {/* Edit modal */}
      {editField && (
        <Box
          className="gpa-modal-overlay"
          position="fixed"
          inset={0}
          zIndex={1001}
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={closeEdit}
        >
          <Box
            className="gpa-modal"
            position="fixed"
            top="50%"
            left="50%"
            style={{ transform: "translate(-50%, -50%)" }}
            bg="white"
            borderRadius="xl"
            boxShadow="2xl"
            p={6}
            w={{ base: "90vw", md: "480px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Text fontWeight="700" fontSize="md" mb={4}>
              Edit {EDIT_CONFIG[editField].label}
            </Text>

            {EDIT_CONFIG[editField].multiline ? (
              <Textarea
                ref={inputRef as React.Ref<HTMLTextAreaElement>}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={EDIT_CONFIG[editField].placeholder}
                rows={4}
                mb={4}
                autoFocus
              />
            ) : (
              <Input
                ref={inputRef as React.Ref<HTMLInputElement>}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={EDIT_CONFIG[editField].placeholder}
                mb={4}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !saving) handleSave();
                  if (e.key === "Escape") closeEdit();
                }}
              />
            )}

            {saveError && (
              <Text fontSize="sm" color="red.500" mb={3}>
                {saveError}
              </Text>
            )}

            <Flex justify="flex-end" gap={3}>
              <Button size="sm" variant="ghost" onClick={closeEdit} disabled={saving}>
                Cancel
              </Button>
              <Button
                size="sm"
                colorPalette="indigo"
                onClick={handleSave}
                disabled={saving || !inputValue.trim()}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </>
  );
}

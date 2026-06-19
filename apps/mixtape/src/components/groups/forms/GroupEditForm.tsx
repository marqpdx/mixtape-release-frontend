// src/components/groups/GroupEditForm.tsx

"use client";

import {
  Box,
  Button,
  Select,
  Field,
  VStack,
  Textarea,
  Text,
  Flex,
  SimpleGrid,
  Portal,
  Input,
} from "@chakra-ui/react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useEffect, useState } from "react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { ImageUploadField } from "@components/forms/common/ImageUploadField";
import { createListCollection } from "@chakra-ui/react";
import { Group, GroupFormData, GroupType } from "@mixtape/core/types/groupTypes";
import { EmblemPicker } from "@components/emblems/EmblemPicker";
import { EmblemDisplay } from "@components/emblems/EmblemDisplay";
import { EmblemInline } from "@mixtape/core/types/emblemTypes";
import { StickyFormFooter } from "@components/common/StickyFormFooter";
import { toaster } from "@mixtape/core/lib/toaster";
import { MixtapeAlert } from "../../ui/alerts";
import GroupVisibilitySelect from "../utils/GroupVisibilitySelect";
import { useImageUpload } from "@hooks/useAssets";

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (
    error &&
    typeof error === "object" &&
    typeof (error as { message?: string }).message === "string"
  ) {
    return (error as { message?: string }).message ?? "";
  }
  return "";
};

const groupTypeCollection = createListCollection({
  items: [
    { label: "Community", value: "community" },
    { label: "Circle", value: "circle" },
  ],
});

const displayLayoutCollection = createListCollection({
  items: [
    { label: "Classic", value: "classic" },
    { label: "Modern", value: "modern" },
    { label: "Minimal", value: "minimal" },
  ],
});

interface GroupEditFormProps {
  group: Group | null;
  onSuccess?: () => void;
  isSaving?: boolean;
  isDraftMode?: boolean;
  onFieldChange?: (updates: Partial<Group>) => void;
}

// Reusable card container for each section
function EditCard({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Box
      className={className}
      bg="theme.surface"
      borderRadius="16px"
      border="1px solid"
      borderColor="theme.border"
      boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
      p={8}
    >
      <Flex align="center" gap={3} mb={6}>
        <Box w="10px" h="10px" borderRadius="full" bg="theme.accent" flexShrink={0} />
        <Text
          fontFamily="heading"
          fontSize="23px"
          fontWeight="400"
          color="theme.text"
          lineHeight="1.2"
        >
          {label}
        </Text>
        <Box flex={1} h="1px" bg="theme.border" />
      </Flex>
      {children}
    </Box>
  );
}

export default function GroupEditForm({
  group,
  onSuccess,
  isSaving = false,
  isDraftMode = false,
  onFieldChange,
}: GroupEditFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [showEmblemPicker, setShowEmblemPicker] = useState(false);

  const [emblemPreview, setEmblemPreview] = useState<EmblemInline | null>(
    group?.emblem ?? null
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GroupFormData>();

  const { handleImageChange, pending, previewUrls } = useImageUpload({
    sponsorType: "group",
    sponsorId: group?.id ?? "",
    setValue,
  });

  useEffect(() => {
    if (!group) return;

    setValue("title", group.title || "");
    setValue("description", group.description || "");
    setValue("summary", group.summary || "");
    setValue("body", group.body || "");
    setValue("author_name", group.author_name || "");
    setValue("group_type", group.group_type || "community");
    setValue("visibility", group.visibility || "public");
    setValue("display_layout", group.display_layout || "classic");
    setValue("profile_image_path", group.profile_image_path);
    setValue("background_image_path", group.background_image_path);
    setEmblemPreview(group.emblem ?? null);
  }, [group, setValue]);

  const handleSelectEmblem = async (emblemId: string) => {
    if (!group?.slug) return;
    const response = await axiosInstance.post(
      `/api/groups/${group.slug}/emblem/attach`,
      { emblem_id: emblemId }
    );
    setEmblemPreview(response.data?.emblem ?? null);
  };

  const handleResetEmblem = async () => {
    if (!group?.slug) return;
    const response = await axiosInstance.post(
      `/api/groups/${group.slug}/emblem/reset`
    );
    setEmblemPreview(response.data?.emblem ?? null);
  };

  const watchedFields = watch();

  // Track local changes for the unsaved indicator (always, not just in draft mode)
  useEffect(() => {
    if (!group) return;

    const changed =
      watchedFields.title !== (group.title || "") ||
      watchedFields.description !== (group.description || "") ||
      watchedFields.summary !== (group.summary || "") ||
      watchedFields.body !== (group.body || "") ||
      watchedFields.author_name !== (group.author_name || "");

    setHasLocalChanges(changed);
  }, [watchedFields, group]);

  // Debounced auto-save in draft mode
  useEffect(() => {
    if (!isDraftMode || !hasLocalChanges || !onFieldChange) return;

    const timer = setTimeout(() => {
      const updates: Partial<Group> = {};

      if (watchedFields.title !== group?.title)
        updates.title = watchedFields.title;
      if (watchedFields.description !== group?.description)
        updates.description = watchedFields.description;
      if (watchedFields.summary !== group?.summary)
        updates.summary = watchedFields.summary;
      if (watchedFields.body !== group?.body) updates.body = watchedFields.body;
      if (watchedFields.author_name !== group?.author_name)
        updates.author_name = watchedFields.author_name;

      if (Object.keys(updates).length > 0) {
        onFieldChange(updates);
        setHasLocalChanges(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [watchedFields, isDraftMode, hasLocalChanges, onFieldChange, group]);

  const onSubmit: SubmitHandler<GroupFormData> = async (
    values: GroupFormData
  ) => {
    if (isDraftMode) {
      toaster.create({
        title: "Draft Mode Active",
        description:
          "Changes are automatically saved. Exit draft mode to make manual changes.",
        type: "info",
        duration: 3000,
      });
      return;
    }

    try {
      if (group?.slug) {
        await axiosInstance.patch(`/api/groups/${group.slug}`, values);
      } else {
        await axiosInstance.post(`/api/groups/`, values);
      }

      toaster.create({
        title: group?.slug ? "Group Updated" : "Group Created",
        description: group?.slug
          ? "Changes saved successfully."
          : "Group created successfully.",
        type: "success",
        duration: 5000,
      });

      setHasLocalChanges(false);
      onSuccess?.();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : `Could not ${group?.slug ? "save" : "create"} the group. Please try again.`
      );
      toaster.create({
        title: group?.slug ? "Update Failed" : "Creation Failed",
        description: `Could not ${group?.slug ? "save" : "create"} the group. Please try again.`,
        type: "error",
        duration: 5000,
      });
    }
  };

  if (error) {
    return (
      <MixtapeAlert status="error" title="Error Loading Group" description={error} />
    );
  }

  return (
    <Box
      className="gef-root"
      as="form"
      id="group-edit-form"
      onSubmit={handleSubmit(onSubmit)}
      maxW="760px"
      mx="auto"
      px={4}
      pt={6}
      pb="100px"
    >
      {/* Page header */}
      <Box className="gef-header" mb={8}>
        <Text
          fontFamily="mono"
          fontSize="11px"
          fontWeight="600"
          letterSpacing="0.14em"
          textTransform="uppercase"
          color="theme.textMuted"
          mb={2}
        >
          Group Settings
        </Text>
        <Text
          as="h1"
          fontFamily="heading"
          fontSize="38px"
          fontWeight="400"
          color="theme.text"
          lineHeight="1.15"
          mb={2}
        >
          Edit Group
        </Text>
        <Text fontFamily="serifBody" fontSize="16px" color="theme.textSecondary">
          Update how{" "}
          <Box as="em" fontStyle="italic">
            {group?.title ?? "your group"}
          </Box>{" "}
          appears to members across Mixtape.
        </Text>
      </Box>

      {isDraftMode && (
        <Box
          mb={6}
          p={3}
          bg="blue.50"
          borderRadius="md"
          border="1px solid"
          borderColor="blue.200"
        >
          <Text fontSize="sm" color="blue.700">
            ✏️ Draft mode active — changes will be saved automatically
            {hasLocalChanges && " (typing...)"}
          </Text>
        </Box>
      )}

      <VStack gap={5} align="stretch">
        {/* Essentials */}
        <EditCard label="Essentials" className="gef-card-essentials">
          <VStack gap={5} align="stretch">
            <Field.Root invalid={!!errors.title}>
              <Field.Label>
                Group name
                <Field.RequiredIndicator />
              </Field.Label>
              <Input
                {...register("title", { required: "Group name is required" })}
                placeholder="Enter group name"
              />
              <Field.ErrorText>
                {getErrorMessage(errors.title)}
              </Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.description}>
              <Field.Label>
                Description
                <Field.RequiredIndicator />
              </Field.Label>
              <Textarea
                {...register("description", {
                  required: "Description is required",
                })}
                placeholder="Brief description of your group"
                rows={3}
              />
              <Field.ErrorText>
                {getErrorMessage(errors.description)}
              </Field.ErrorText>
            </Field.Root>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Field.Root invalid={!!errors.group_type}>
                <Field.Label>
                  Group type
                  <Field.RequiredIndicator />
                </Field.Label>
                <Select.Root
                  value={watch("group_type") ? [watch("group_type")] : undefined}
                  defaultValue={["community"]}
                  onValueChange={({ value }) => {
                    setValue("group_type", value[0] as GroupType);
                  }}
                  collection={groupTypeCollection}
                >
                  <Select.HiddenSelect
                    {...register("group_type", {
                      required: "Group type is required",
                    })}
                  />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Select group type…" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                      <Select.ClearTrigger />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {groupTypeCollection.items.map((item) => (
                          <Select.Item item={item} key={item.value}>
                            {item.label}
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
                <Field.ErrorText>
                  {getErrorMessage(errors.group_type)}
                </Field.ErrorText>
              </Field.Root>

              <Field.Root>
                <Field.Label>
                  Visibility
                  <Field.RequiredIndicator />
                </Field.Label>
                <GroupVisibilitySelect
                  register={register}
                  value={watch("visibility")}
                  onChange={(val) =>
                    setValue(
                      "visibility",
                      val as "public" | "private" | "unlisted"
                    )
                  }
                />
              </Field.Root>
            </SimpleGrid>

            {/* Emblem */}
            <Flex gap={6} align="flex-start">
              <Box flex="0 0 auto" minW="fit-content">
                <Text fontSize="sm" fontWeight="500" color="theme.text" mb={3}>
                  Group emblem
                </Text>
                <Box
                  mb={3}
                  p={4}
                  bg="theme.bg"
                  rounded="10px"
                  border="1px solid"
                  borderColor="theme.border"
                  minH="120px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {emblemPreview ? (
                    <EmblemDisplay emblem={emblemPreview} size={96} />
                  ) : (
                    <Text color="theme.textMuted" fontSize="sm">
                      No emblem selected
                    </Text>
                  )}
                </Box>
                <Button
                  width="100%"
                  onClick={() => setShowEmblemPicker((prev) => !prev)}
                  size="sm"
                >
                  {showEmblemPicker ? "Hide picker" : "Choose emblem"}
                </Button>
              </Box>

              <Box flex="1" minW="0">
                <EmblemPicker
                  isOpen={showEmblemPicker}
                  onClose={() => setShowEmblemPicker(false)}
                  onSelect={handleSelectEmblem}
                  onReset={handleResetEmblem}
                />
              </Box>
            </Flex>
          </VStack>
        </EditCard>

        {/* Visual assets */}
        <EditCard label="Visual assets" className="gef-card-visuals">
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Field.Root>
              <Field.Label>Profile image</Field.Label>
              <ImageUploadField
                imageType="profile"
                imageUrl={previewUrls.profile ?? group?.profile_image_url}
                pending={pending.profile}
                watch={watch}
                register={register}
                errors={errors}
                doHandleImageChange={(e) => handleImageChange(e, "profile")}
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Background image</Field.Label>
              <ImageUploadField
                imageType="background"
                imageUrl={previewUrls.background ?? group?.background_image_url}
                pending={pending.background}
                watch={watch}
                register={register}
                errors={errors}
                doHandleImageChange={(e) => handleImageChange(e, "background")}
              />
            </Field.Root>
          </SimpleGrid>
        </EditCard>

        {/* Content & details */}
        <EditCard label="Content & details" className="gef-card-content">
          <VStack gap={5} align="stretch">
            <Field.Root>
              <Field.Label>Summary</Field.Label>
              <Textarea
                {...register("summary")}
                placeholder="Optional summary for listings and previews"
                rows={2}
              />
              <Field.HelperText>
                Short summary for listings and previews
              </Field.HelperText>
            </Field.Root>

            <Field.Root>
              <Field.Label>Welcome message</Field.Label>
              <Textarea
                {...register("body")}
                placeholder="Detailed content about your group (supports markdown)"
                rows={6}
              />
              <Field.HelperText>
                Detailed description or welcome message
              </Field.HelperText>
            </Field.Root>

            <Field.Root>
              <Field.Label>Author name</Field.Label>
              <Input
                {...register("author_name")}
                placeholder="Author display name"
              />
              <Field.HelperText>Display name for the group author</Field.HelperText>
            </Field.Root>
          </VStack>
        </EditCard>

        {/* Publishing & layout */}
        <EditCard label="Publishing & layout" className="gef-card-publishing">
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Field.Root>
              <Field.Label>Display layout</Field.Label>
              <Select.Root
                value={
                  watch("display_layout")
                    ? [watch("display_layout")]
                    : undefined
                }
                defaultValue={["classic"]}
                onValueChange={({ value }) => {
                  setValue(
                    "display_layout",
                    value[0] as "classic" | "modern" | "minimal"
                  );
                }}
                collection={displayLayoutCollection}
              >
                <Select.HiddenSelect {...register("display_layout")} />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Select layout…" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                    <Select.ClearTrigger />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {displayLayoutCollection.items.map((item) => (
                        <Select.Item item={item} key={item.value}>
                          {item.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
          </SimpleGrid>
        </EditCard>

        {!isDraftMode && (
          <StickyFormFooter
            onCancel={() => window.history.back()}
            isSaving={isSubmitting || isSaving}
            saveLabel={group?.slug ? "Save changes" : "Create group"}
            showUnsavedIndicator={hasLocalChanges}
          >
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="group-edit-form"
              loading={isSubmitting || isSaving}
              colorScheme="green"
              size="md"
            >
              {group?.slug ? "Save changes" : "Create group"}
            </Button>
          </StickyFormFooter>
        )}
      </VStack>
    </Box>
  );
}

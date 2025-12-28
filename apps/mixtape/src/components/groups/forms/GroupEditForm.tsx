// src/components/groups/GroupEditForm.tsx - Enhanced for draft mode

"use client";

import {
  Box,
  Button,
  Select,
  Field,
  VStack,
  Textarea,
  Text,
  Fieldset,
  Flex,
  SimpleGrid,
  Portal,
  Input,
  useDisclosure,
  Heading,
} from "@chakra-ui/react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useEffect, useState, useCallback } from "react";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import { ImageUploadField } from "@components/forms/common/ImageUploadField";
// import GroupVisibilitySelect from "@components/groups/GroupVisibilitySelect";
// import { Input } from "@theme/recipes/input.recipe";
import { createListCollection } from "@chakra-ui/react";
import { Group, GroupFormData, GroupStatus, GroupType } from "@mixtape/core/types/groupTypes";
// import { EmblemPicker } from "@components/emblems/EmblemPicker";
// import { useEntityImageUpload } from "@hooks/useEntityImageUpload";
// import { useEmblemAttachment } from "@hooks/useEmblemAttachment";
// import { EmblemDisplay } from "@components/emblems/EmblemDisplay";
// import { EmblemInline } from "@content/emblemTypes";
import { toaster } from "@/components/ui/toaster";
import { MixtapeAlert } from "../../ui/alerts";
import GroupVisibilitySelect from "../utils/GroupVisibilitySelect";
import { useEntityImageUpload } from "@mixtape/api/hooks/useEntityImageUpload";
import { useImageUpload } from '@hooks/useAssets';

// Helper function to safely render error messages
const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error && typeof error.message === 'string') return error.message;
  return '';
};

// Collections for Select components
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

const statusCollection = createListCollection({
  items: [
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
    { label: "Archived", value: "archived" },
  ],
});

interface GroupEditFormProps {
  group: Group | null;
  onSuccess?: () => void;
  isSaving?: boolean;
  isDraftMode?: boolean;
  onFieldChange?: (updates: Partial<Group>) => void;
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

  const emblemDisclosure = useDisclosure();
  // const [emblemPreview, setEmblemPreview] = useState<EmblemInline | null>(
  //   group?.emblem ?? null
  // );

  // const { attachEmblem, resetEmblem, attaching } = useEmblemAttachment(
  //   { groupSlug: group?.slug }
  // );


  // async function handleSelectEmblem(emblemId: string) {
  //   const emblem = await attachEmblem(emblemId);
  //   if (emblem) setEmblemPreview(emblem);  // EmblemDisplay can use size_96_url, etc.
  // }

  // async function handleResetEmblem() {
  //   const ok = await resetEmblem();
  //   if (ok) setEmblemPreview(null);
  // }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GroupFormData>();

  // Currently using deprecated wrapper (works via new sponsor-agnostic API)
  // To migrate to new API directly, replace with:

  const { handleImageChange, pending, previewUrls } = useImageUpload({
    sponsorType: 'group',
    sponsorId: group?.id ?? '',
    setValue
  });
  // const { handleImageChange, pending } = useEntityImageUpload<GroupFormData>(
  //   "group",
  //   group?.id ?? "",
  //   setValue,
  // );

  // Initialize form with group data
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
    setValue("status", group.status || "draft");

    // Image storage paths (what gets saved to DB)
    setValue("profile_image_path", group.profile_image_path);
    setValue("background_image_path", group.background_image_path);

    // Note: profile_image_url and background_image_url are computed properties
    // on the backend. They're read-only and generated on-demand from the paths.
  }, [group, setValue]);

  // Track form changes for draft mode
  const watchedFields = watch();

  useEffect(() => {
    if (!group || !isDraftMode) return;

    const changed =
      watchedFields.title !== (group.title || '') ||
      watchedFields.description !== (group.description || '') ||
      watchedFields.summary !== (group.summary || '') ||
      watchedFields.body !== (group.body || '') ||
      watchedFields.author_name !== (group.author_name || '');

    setHasLocalChanges(changed);
  }, [watchedFields, group, isDraftMode]);

  // Debounced auto-save in draft mode
  useEffect(() => {
    if (!isDraftMode || !hasLocalChanges || !onFieldChange) return;

    const timer = setTimeout(() => {
      const updates: Partial<Group> = {};

      if (watchedFields.title !== group?.title) updates.title = watchedFields.title;
      if (watchedFields.description !== group?.description) updates.description = watchedFields.description;
      if (watchedFields.summary !== group?.summary) updates.summary = watchedFields.summary;
      if (watchedFields.body !== group?.body) updates.body = watchedFields.body;
      if (watchedFields.author_name !== group?.author_name) updates.author_name = watchedFields.author_name;

      if (Object.keys(updates).length > 0) {
        onFieldChange(updates);
        setHasLocalChanges(false);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [watchedFields, isDraftMode, hasLocalChanges, onFieldChange, group]);

  const onSubmit: SubmitHandler<GroupFormData> = async (values: GroupFormData) => {
    // In draft mode, don't submit manually (auto-save handles it)
    if (isDraftMode) {
      toaster.create({
        title: "Draft Mode Active",
        description: "Changes are automatically saved. Exit draft mode to make manual changes.",
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

      onSuccess?.();
    } catch (err) {
      toaster.create({
        title: group?.slug ? "Update Failed" : "Creation Failed",
        description: `Could not ${group?.slug ? 'save' : 'create'} the group. Please try again.`,
        type: "error",
        duration: 5000,
      });
    }
  };

  if (error) {
    return <MixtapeAlert status="error" title="Error Loading Group" description={error} />;
  }

  return (
    <Box
      className="group-edit-form"
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      maxW="1040px"
      mx="auto"
      p={2}
    >
      <VStack gap={8} align="stretch">

        {/* Draft mode indicator */}
        {isDraftMode && (
          <Box p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
            <Text fontSize="sm" color="blue.700">
              ✏️ Draft mode active - changes will be saved automatically
              {hasLocalChanges && " (typing...)"}
            </Text>
          </Box>
        )}

        {/* Essential Information */}
        <Fieldset.Root>
          <Fieldset.Legend fontSize="lg" fontWeight="semibold" color="green.600">
            Essential Information
          </Fieldset.Legend>
          <Fieldset.Content>
            <VStack gap={4} align="stretch">
              <Field.Root invalid={!!errors.title}>
                <Field.Label>
                  Group Name
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  {...register("title", { required: "Group name is required" })}
                  placeholder="Enter group name"
                />
                <Field.ErrorText>{getErrorMessage(errors.title)}</Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={!!errors.description}>
                <Field.Label>
                  Description
                  <Field.RequiredIndicator />
                </Field.Label>
                <Textarea
                  {...register("description", { required: "Description is required" })}
                  placeholder="Brief description of your group"
                  rows={3}
                />
                <Field.ErrorText>{getErrorMessage(errors.description)}</Field.ErrorText>
              </Field.Root>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Field.Root invalid={!!errors.group_type}>
                  <Field.Label>
                    Group Type
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
                      {...register("group_type", { required: "Group type is required" })}
                    />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Select group type..." />
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
                  <Field.ErrorText>{getErrorMessage(errors.group_type)}</Field.ErrorText>
                </Field.Root>

                <Field.Root>
                  <Field.Label>
                    Visibility
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <GroupVisibilitySelect
                    register={register}
                    value={watch("visibility")}
                    onChange={(val) => setValue("visibility", val as "public" | "invite_only" | "private" | "hidden")}
                  />
                </Field.Root>
              </SimpleGrid>

              {/* Emblem selector with side-by-side layout */}
              <Flex gap={6} align="flex-start">
                {/* Left: Current emblem display (fixed width) */}
                <Box flex="0 0 auto" minW="fit-content">
                  <Heading size="sm" mb={3}>Group Emblem</Heading>
                  {/* <Box mb={3} p={4} bg="gray.50" rounded="md" border="1px solid" borderColor="gray.200" minH="120px" display="flex" alignItems="center" justifyContent="center">
                    {emblemPreview ? (
                      // <EmblemDisplay emblem={emblemPreview} size={96} />
                      <></>
                    ) : (
                      <Text color="gray.500" fontSize="sm">No emblem selected</Text>
                    )}
                  </Box> */}
                  {/* <Button
                    width="100%"
                    onClick={emblemDisclosure.onOpen}
                    loading={attaching}
                    colorScheme="green"
                    size="sm"
                  >
                    Choose Emblem
                  </Button> */}
                </Box>

                {/* Right: Emblem picker (fills remaining space with internal scroll) */}
                <Box flex="1" minW="0">
                  {/* <EmblemPicker
                    isOpen={emblemDisclosure.open}
                    onClose={emblemDisclosure.onClose}
                    onSelect={handleSelectEmblem}
                    onReset={handleResetEmblem}
                  /> */}
                </Box>
              </Flex>
            </VStack>
          </Fieldset.Content>
        </Fieldset.Root>

        {/* Content & Details */}
        <Fieldset.Root>
          <Fieldset.Legend fontSize="lg" fontWeight="semibold" color="green.600">
            Content & Details
          </Fieldset.Legend>
          <Fieldset.Content>
            <VStack gap={4} align="stretch">
              <Field.Root>
                <Field.Label>Summary</Field.Label>
                <Textarea
                  {...register("summary")}
                  placeholder="Optional summary of your group"
                  rows={2}
                />
                <Field.HelperText>Short summary for listings and previews</Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label>Full Content</Field.Label>
                <Textarea
                  {...register("body")}
                  placeholder="Detailed content about your group (supports markdown)"
                  rows={6}
                />
                <Field.HelperText>Detailed description or welcome message</Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label>Author Name</Field.Label>
                <Input
                  {...register("author_name")}
                  placeholder="Author display name"
                />
                <Field.HelperText>Display name for the group author</Field.HelperText>
              </Field.Root>
            </VStack>
          </Fieldset.Content>
        </Fieldset.Root>

        {/* Visual Assets */}
        <Fieldset.Root>
          <Fieldset.Legend fontSize="lg" fontWeight="semibold" color="green.600">
            Visual Assets
          </Fieldset.Legend>
          <Fieldset.Content>
            {/* Hidden inputs for S3 paths (authoritative storage keys) */}
            {/* <input type="hidden" {...register("profile_image_path")} />
            <input type="hidden" {...register("background_image_path")} /> */}
            {/* Note: URL fields removed - backend computes these on-demand */}

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
              <Field.Root>
                <Field.Label>Profile Image</Field.Label>
                <ImageUploadField
                  imageType="profile"
                  // imageUrl={group?.profile_image_url}
                  imageUrl={previewUrls.profile ?? group?.profile_image_url}
                  pending={pending.profile}
                  watch={watch}
                  register={register}
                  errors={errors}
                  doHandleImageChange={(e) => handleImageChange(e, "profile")}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Background Image</Field.Label>
                <ImageUploadField
                  imageType="background"
                  // imageUrl={group?.background_image_url}
                  imageUrl={previewUrls.background ?? group?.background_image_url}
                  pending={pending.background}
                  watch={watch}
                  register={register}
                  errors={errors}
                  doHandleImageChange={(e) => handleImageChange(e, "background")}
                />
              </Field.Root>
            </SimpleGrid>
          </Fieldset.Content>
        </Fieldset.Root>

        {/* Publishing & Layout */}
        <Fieldset.Root>
          <Fieldset.Legend fontSize="lg" fontWeight="semibold" color="green.600">
            Publishing & Layout
          </Fieldset.Legend>
          <Fieldset.Content>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Field.Root>
                <Field.Label>Status</Field.Label>
                <Select.Root
                  value={watch("status") ? [watch("status")] : undefined}
                  defaultValue={["draft"]}
                  onValueChange={({ value }) => {
                    setValue("status", value[0] as GroupStatus);
                  }}
                  collection={statusCollection}
                >
                  <Select.HiddenSelect {...register("status")} />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Select status..." />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                      <Select.ClearTrigger />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {statusCollection.items.map((item) => (
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

              <Field.Root>
                <Field.Label>Display Layout</Field.Label>
                <Select.Root
                  value={watch("display_layout") ? [watch("display_layout")] : undefined}
                  defaultValue={["classic"]}
                  onValueChange={({ value }) => {
                    setValue("display_layout", value[0] as "classic" | "modern" | "minimal");
                  }}
                  collection={displayLayoutCollection}
                >
                  <Select.HiddenSelect {...register("display_layout")} />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Select layout..." />
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

            {watch("status") === "published" && (
              <Box mt={4} p={4} bg="green.50" border="1px solid" borderColor="green.200" rounded="md">
                <Text fontSize="sm" color="green.700">
                  This group will be publicly visible once saved.
                </Text>
              </Box>
            )}

            {watch("status") === "draft" && (
              <Box mt={4} p={4} bg="orange.50" border="1px solid" borderColor="orange.200" rounded="md">
                <Text fontSize="sm" color="orange.700">
                  This group is saved as a draft and won't be visible to others yet.
                </Text>
              </Box>
            )}
          </Fieldset.Content>
        </Fieldset.Root>

        {/* Form Actions - Only show in non-draft mode */}
        {!isDraftMode && (
          <Flex justify="flex-end" gap={4} pt={4} borderTop="1px solid" borderColor="gray.200">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting || isSaving}
              colorScheme="green"
              size="lg"
            >
              {group?.slug ? "Save Changes" : "Create Group"}
            </Button>
          </Flex>
        )}

      </VStack>
    </Box>
  );
}
// apps/mixtape/src/components/dashboard/member/MemberProfileEdit.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Field,
  VStack,
  Textarea,
  Text,
  Flex,
  Input,
  Heading,
  Avatar,
  Spinner,
  HStack,
} from "@chakra-ui/react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useMyMemberProfile, useMemberProfileMutation } from "@hooks/member/useMemberProfile";
import { uploadMemberVoice, deleteMemberVoice } from "@mixtape/api/clients/member/memberApi";
import { MemberProfileUpdate } from "@mixtape/core/types/memberTypes";
import { toaster } from "@mixtape/core/lib/toaster";
// import { ErrorAlert } from "@components/ui/alerts/ErrorAlert";
import { useColorModeValue } from "@components/ui/color-mode";
import { MixtapeAlert } from "@/components/ui/alerts";
import { ImageUploadField } from "@components/forms/common/ImageUploadField";
import { useImageUpload } from "@hooks/useAssets";
import TipTapEditor from "@components/editor/TipTapEditor";
import type { JSONContent } from "@tiptap/react";

interface ProfileFormData {
  display_name: string;
  quick_intro: string;
  right_now: string;
  skills: string;
  work_areas: string;
  practice_area: string;
  location: string;
  quick_link: string;
  who_are_you: string;
  why_are_you_here: string;
  avatar_url: string;
  profile_image: string;
  background_image: string;
  bio_json: JSONContent;
}

/**
 * MemberProfileEdit Component
 *
 * Allows the current user to edit their member profile.
 * Editable fields: display_name, quick_intro, avatar_url, profile_image, background_image, bio_json
 */
export default function MemberProfileEdit() {
  const { member, isLoading, error, refetch: refetchMember } = useMyMemberProfile();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [voiceUploading, setVoiceUploading] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const voiceInputRef = useRef<HTMLInputElement>(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const subtextColor = useColorModeValue("gray.600", "gray.400");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      display_name: "",
      quick_intro: "",
      right_now: "",
      skills: "",
      work_areas: "",
      practice_area: "",
      location: "",
      quick_link: "",
      who_are_you: "",
      why_are_you_here: "",
      avatar_url: "",
      profile_image: "",
      background_image: "",
      bio_json: { type: "doc", content: [] },
    },
  });

  // Get mutation hook (only when we have a username)
  const username = member?.username || "";
  const { update, isUpdating, error: mutationError } = useMemberProfileMutation(username);

  // Initialize form with member data
  useEffect(() => {
    if (!member) return;

    setValue("display_name", member.display_name || "");
    setValue("quick_intro", member.quick_intro || "");
    setValue("right_now", member.right_now || "");
    setValue("skills", member.skills || "");
    setValue("work_areas", member.work_areas || "");
    setValue("practice_area", member.practice_area || "");
    setValue("location", member.location || "");
    setValue("quick_link", member.quick_link || "");
    setValue("who_are_you", member.who_are_you || "");
    setValue("why_are_you_here", member.why_are_you_here || "");
    setValue("avatar_url", member.avatar_url || "");
    setValue("profile_image", member.profile_image || "");
    setValue("background_image", member.background_image || "");
    setValue("bio_json", (member.bio_json as JSONContent) || { type: "doc", content: [] });
    setVoiceUrl(member.intro_voice_url ?? null);
    setVoiceTranscript(member.intro_voice_transcript ?? "");
  }, [member, setValue]);

  const onSubmit: SubmitHandler<ProfileFormData> = async (values) => {
    if (!member?.username) {
      setSaveError("Unable to update profile: missing username");
      return;
    }

    try {
      setSaveError(null);
      const updateData: MemberProfileUpdate = {
        display_name: values.display_name,
        quick_intro: values.quick_intro,
        right_now: values.right_now,
        skills: values.skills,
        work_areas: values.work_areas,
        practice_area: values.practice_area,
        location: values.location,
        quick_link: values.quick_link,
        who_are_you: values.who_are_you,
        why_are_you_here: values.why_are_you_here,
        avatar_url: values.avatar_url,
        profile_image: values.profile_image,
        background_image: values.background_image,
        bio_json: values.bio_json || undefined,
      };

      await update(updateData);

      toaster.create({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
        type: "success",
        duration: 3000,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setSaveError(message);
      toaster.create({
        title: "Update Failed",
        description: message,
        type: "error",
        duration: 5000,
      });
    }
  };

  // Watch avatar URL for preview (legacy)
  const avatarUrl = watch("avatar_url");
  const displayName = watch("display_name");
  const bioJson = watch("bio_json") as JSONContent | undefined;

  const { handleImageChange, pending, previewUrls } = useImageUpload<ProfileFormData>({
    sponsorType: "member",
    sponsorId: member?.id || "",
    setValue,
    pathFieldNameMap: {
      profile: "profile_image",
      background: "background_image",
    },
  });

  const avatarPreview =
    previewUrls.profile || member?.profile_image_url || avatarUrl || undefined;

  async function handleVoiceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVoiceUploading(true);
    try {
      const result = await uploadMemberVoice(file);
      setVoiceUrl(result.url);
      setVoiceTranscript("");
      toaster.create({ title: "Voice note uploaded", description: "Transcription will appear shortly.", type: "success", duration: 4000 });
      refetchMember();
    } catch {
      toaster.create({ title: "Upload failed", description: "Could not upload voice note. Please try again.", type: "error", duration: 5000 });
    } finally {
      setVoiceUploading(false);
      if (voiceInputRef.current) voiceInputRef.current.value = "";
    }
  }

  async function handleVoiceDelete() {
    setVoiceUploading(true);
    try {
      await deleteMemberVoice();
      setVoiceUrl(null);
      setVoiceTranscript("");
      toaster.create({ title: "Voice note removed", type: "success", duration: 3000 });
    } catch {
      toaster.create({ title: "Could not remove voice note", type: "error", duration: 5000 });
    } finally {
      setVoiceUploading(false);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="300px">
        <VStack gap={4}>
          <Spinner size="xl" />
          <Text color={subtextColor}>Loading profile...</Text>
        </VStack>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <MixtapeAlert status="error"
        title="Error Loading Profile"
        description={error.message || "Unable to load your profile"}
      />
    );
  }

  // No member found
  if (!member) {
    return (
      <MixtapeAlert status="warning"
        title="Profile Not Found"
        description="Your member profile could not be found."
      />
    );
  }

  const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ");

  return (
    <Box
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      maxW="1000px"
      mx="auto"
    >
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box
          bg={cardBg}
          border="1px solid"
          borderColor={cardBorder}
          borderRadius="xl"
          p={6}
        >
          <Heading size="lg" mb={2}>
            Edit Profile
          </Heading>
          <Text color={subtextColor}>
            Update your public profile information. Changes will be visible to other members.
          </Text>
        </Box>

        {/* Avatar Preview & Basic Info */}
        <Box
          bg={cardBg}
          border="1px solid"
          borderColor={cardBorder}
          borderRadius="xl"
          p={6}
        >
          <HStack gap={6} align="start" flexWrap={{ base: "wrap", md: "nowrap" }}>
            {/* Avatar Preview */}
            <VStack gap={3}>
              <Avatar.Root size="2xl">
                <Avatar.Image src={avatarPreview} />
                <Avatar.Fallback>
                  {displayName?.charAt(0) || member.username?.charAt(0) || "?"}
                </Avatar.Fallback>
              </Avatar.Root>
              <Text fontSize="sm" color={subtextColor}>
                Avatar Preview
              </Text>
            </VStack>

            {/* Read-only info */}
            <VStack align="start" gap={2} flex="1">
              <Box>
                <Text fontSize="xs" fontWeight="medium" color={subtextColor} textTransform="uppercase">
                  Username
                </Text>
                <Text fontWeight="medium">@{member.username}</Text>
              </Box>
              {fullName && (
                <Box>
                  <Text fontSize="xs" fontWeight="medium" color={subtextColor} textTransform="uppercase">
                    Name
                  </Text>
                  <Text>{fullName}</Text>
                </Box>
              )}
              <Box>
                <Text fontSize="xs" fontWeight="medium" color={subtextColor} textTransform="uppercase">
                  Email
                </Text>
                <Text>{member.email}</Text>
              </Box>
            </VStack>
          </HStack>
        </Box>

        {/* Editable Fields */}
        <Box
          bg={cardBg}
          border="1px solid"
          borderColor={cardBorder}
          borderRadius="xl"
          p={6}
        >
          <VStack gap={5} align="stretch">
            <Field.Root invalid={!!errors.display_name}>
              <Field.Label>
                Display Name
              </Field.Label>
              <Input
                {...register("display_name", {
                  maxLength: { value: 100, message: "Display name must be 100 characters or less" }
                })}
                placeholder="How you want to be known"
              />
              <Field.HelperText>
                This name will be shown on your profile and in comments
              </Field.HelperText>
              {errors.display_name && (
                <Field.ErrorText>{errors.display_name.message}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root invalid={!!errors.avatar_url}>
              <Field.Label>
                Avatar URL
              </Field.Label>
              <Input
                {...register("avatar_url", {
                  pattern: {
                    value: /^(https?:\/\/.*|)$/,
                    message: "Please enter a valid URL starting with http:// or https://"
                  }
                })}
                placeholder="https://example.com/your-avatar.jpg"
              />
              <Field.HelperText>
                URL to your profile picture (supports most image formats)
              </Field.HelperText>
              {errors.avatar_url && (
                <Field.ErrorText>{errors.avatar_url.message}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root invalid={!!errors.quick_intro}>
              <Field.Label>
                Quick Intro
              </Field.Label>
              <Textarea
                {...register("quick_intro", {
                  maxLength: { value: 300, message: "Quick intro must be 300 characters or less" }
                })}
                placeholder="A brief introduction about yourself..."
                rows={4}
              />
              <Field.HelperText>
                A short bio or introduction (up to 300 characters)
              </Field.HelperText>
              {errors.quick_intro && (
                <Field.ErrorText>{errors.quick_intro.message}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root invalid={!!errors.right_now}>
              <Field.Label>
                Right now
              </Field.Label>
              <Textarea
                {...register("right_now", {
                  maxLength: {
                    value: 200,
                    message: "Right now must be 200 characters or less",
                  },
                })}
                placeholder="A few words about how you are right now..."
                rows={2}
                resize="vertical"
              />
              {errors.right_now && (
                <Field.ErrorText>{errors.right_now.message}</Field.ErrorText>
              )}
            </Field.Root>

            <HStack gap={4} flexWrap={{ base: "wrap", md: "nowrap" }} w="100%">
              <Field.Root flex={1}>
                <Field.Label>Skills</Field.Label>
                <Textarea
                  {...register("skills", {
                    maxLength: {
                      value: 400,
                      message: "Skills must be 400 characters or less",
                    },
                  })}
                  placeholder="A few skills, capacities, or areas of expertise"
                  rows={2}
                  resize="vertical"
                />
                <Field.HelperText>
                  Short freeform list is fine for now.
                </Field.HelperText>
                {errors.skills && (
                  <Field.ErrorText>{errors.skills.message}</Field.ErrorText>
                )}
              </Field.Root>
              <Field.Root flex={1}>
                <Field.Label>Work areas</Field.Label>
                <Textarea
                  {...register("work_areas", {
                    maxLength: {
                      value: 400,
                      message: "Work areas must be 400 characters or less",
                    },
                  })}
                  placeholder="Current focus areas, domains, or kinds of work"
                  rows={2}
                  resize="vertical"
                />
                <Field.HelperText>
                  What you are actively working in or around.
                </Field.HelperText>
                {errors.work_areas && (
                  <Field.ErrorText>{errors.work_areas.message}</Field.ErrorText>
                )}
              </Field.Root>
            </HStack>

            <HStack gap={4} flexWrap={{ base: "wrap", md: "nowrap" }} w="100%">
              <Field.Root flex={1}>
                <Field.Label>Practice area</Field.Label>
                <Input
                  {...register("practice_area", { maxLength: { value: 120, message: "120 characters max" } })}
                  placeholder="e.g. Product, Engineering, Design"
                />
              </Field.Root>
              <Field.Root flex={1}>
                <Field.Label>Location</Field.Label>
                <Input
                  {...register("location", { maxLength: { value: 120, message: "120 characters max" } })}
                  placeholder="City, region, or Remote"
                />
              </Field.Root>
            </HStack>

            <Field.Root invalid={!!errors.quick_link}>
              <Field.Label>Quick Link</Field.Label>
              <Input
                {...register("quick_link", {
                  maxLength: { value: 512, message: "512 characters max" },
                  pattern: {
                    value: /^(https?:\/\/.*|)$/,
                    message: "Must be a valid URL starting with http:// or https://",
                  },
                })}
                placeholder="https://yoursite.com or social profile"
              />
              <Field.HelperText>A personal or work link shown on your member card</Field.HelperText>
              {errors.quick_link && <Field.ErrorText>{errors.quick_link.message}</Field.ErrorText>}
            </Field.Root>

            <HStack gap={4} flexWrap={{ base: "wrap", md: "nowrap" }} w="100%">
              <Field.Root flex={1}>
                <Field.Label>Who I am</Field.Label>
                <Textarea
                  {...register("who_are_you", { maxLength: { value: 512, message: "512 characters max" } })}
                  placeholder="How you'd describe yourself to the group..."
                  rows={3}
                  resize="vertical"
                />
                {errors.who_are_you && <Field.ErrorText>{errors.who_are_you.message}</Field.ErrorText>}
              </Field.Root>
              <Field.Root flex={1}>
                <Field.Label>Why I'm here</Field.Label>
                <Textarea
                  {...register("why_are_you_here", { maxLength: { value: 512, message: "512 characters max" } })}
                  placeholder="Why you joined / what you're looking for..."
                  rows={3}
                  resize="vertical"
                />
                {errors.why_are_you_here && <Field.ErrorText>{errors.why_are_you_here.message}</Field.ErrorText>}
              </Field.Root>
            </HStack>

            {/* Voice Note */}
            <Field.Root>
              <Field.Label>Intro Voice Note</Field.Label>
              <Field.HelperText mb={2}>
                A short audio intro (up to 25 MB). Transcribed automatically.
              </Field.HelperText>
              <VStack align="start" gap={3} w="100%">
                {voiceUrl && (
                  <Box w="100%">
                    <Box as="audio" controls src={voiceUrl} w="100%" mb={2} />
                    {voiceTranscript && (
                      <Text fontSize="xs" color={subtextColor} fontStyle="italic">
                        {voiceTranscript}
                      </Text>
                    )}
                    {!voiceTranscript && (
                      <Text fontSize="xs" color={subtextColor} fontStyle="italic">
                        Transcript pending…
                      </Text>
                    )}
                  </Box>
                )}
                <HStack gap={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={voiceUploading}
                    onClick={() => voiceInputRef.current?.click()}
                  >
                    {voiceUrl ? "Replace" : "Upload audio"}
                  </Button>
                  {voiceUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                      loading={voiceUploading}
                      onClick={() => void handleVoiceDelete()}
                    >
                      Remove
                    </Button>
                  )}
                  <input
                    ref={voiceInputRef}
                    type="file"
                    accept="audio/*"
                    style={{ display: "none" }}
                    onChange={(e) => void handleVoiceUpload(e)}
                  />
                </HStack>
              </VStack>
            </Field.Root>

            <HStack align="start" gap={6} flexWrap={{ base: "wrap", md: "nowrap" }} w="100%">
              <ImageUploadField
                imageType="profile"
                label="Profile Image"
                pending={pending.profile}
                watch={watch}
                register={register}
                errors={errors}
                imageUrl={previewUrls.profile || member.profile_image_url || member.avatar_url || undefined}
                fieldName="profile_image"
                doHandleImageChange={(event) => handleImageChange(event, "profile")}
              />
              <ImageUploadField
                imageType="background"
                label="Background Image"
                pending={pending.background}
                watch={watch}
                register={register}
                errors={errors}
                imageUrl={previewUrls.background || member.background_image_url || undefined}
                fieldName="background_image"
                doHandleImageChange={(event) => handleImageChange(event, "background")}
              />
            </HStack>

            <Field.Root>
              <Field.Label>
                Bio
              </Field.Label>
              <Box border="1px solid" borderColor={cardBorder} borderRadius="md" p={3} w="100%">
                <TipTapEditor
                  initialContent={bioJson || { type: "doc", content: [] }}
                  onContentChange={(content) => setValue("bio_json", content)}
                />
              </Box>
            </Field.Root>
          </VStack>
        </Box>

        {/* Error Display */}
        {(saveError || mutationError) && (
          <MixtapeAlert status="error"
            title="Save Error"
            description={saveError || mutationError?.message || "An error occurred"}
          />
        )}

        {/* Form Actions */}
        <Flex justify="flex-end" gap={4}>
          <Button
            variant="outline"
            disabled={isUpdating}
            onClick={() => {
              if (member) {
                setValue("display_name", member.display_name || "");
                setValue("quick_intro", member.quick_intro || "");
                setValue("right_now", member.right_now || "");
                setValue("skills", member.skills || "");
                setValue("work_areas", member.work_areas || "");
                setValue("location", member.location || "");
                setValue("quick_link", member.quick_link || "");
                setValue("who_are_you", member.who_are_you || "");
                setValue("why_are_you_here", member.why_are_you_here || "");
                setValue("avatar_url", member.avatar_url || "");
                setValue("profile_image", member.profile_image || "");
                setValue("background_image", member.background_image || "");
                setValue("bio_json", (member.bio_json as JSONContent) || { type: "doc", content: [] });
              }
            }}
          >
            <IconX size={18} />
            Reset
          </Button>
          <Button
            type="submit"
            loading={isUpdating}
            disabled={!isDirty}
            colorPalette="blue"
          >
            <IconCheck size={18} />
            Save Changes
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
}

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
  Spinner,
  HStack,
} from "@chakra-ui/react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useMyMemberProfile, useMemberProfileMutation } from "@hooks/member/useMemberProfile";
import { uploadMemberVoice, deleteMemberVoice, fetchMyProfile } from "@mixtape/api/clients/member/memberApi";
import { MemberProfileUpdate } from "@mixtape/core/types/memberTypes";
import { toaster } from "@mixtape/core/lib/toaster";
// import { ErrorAlert } from "@components/ui/alerts/ErrorAlert";
import { useColorModeValue } from "@components/ui/color-mode";
import { MixtapeAlert } from "@/components/ui/alerts";
import { ImageUploadField } from "@components/forms/common/ImageUploadField";
import { useImageUpload } from "@hooks/useAssets";
import { VoicePlaybackBubble } from "@/components/chat/VoicePlaybackBubble";
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
interface MemberProfileEditProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export default function MemberProfileEdit({ onSave, onCancel }: MemberProfileEditProps = {}) {
  const { member, isLoading, error, refetch: refetchMember } = useMyMemberProfile();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [voiceUploading, setVoiceUploading] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const [transcriptPolling, setTranscriptPolling] = useState(false);
  const voiceInputRef = useRef<HTMLInputElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollDeadlineRef = useRef<number>(0);

  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const subtextColor = useColorModeValue("gray.600", "gray.400");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
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

  // Clean up poll timer on unmount
  useEffect(() => () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current); }, []);

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
      onSave?.();
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

  const displayName = watch("display_name");
  const quickIntro = watch("quick_intro");

  const { handleImageChange, pending, previewUrls } = useImageUpload<ProfileFormData>({
    sponsorType: "member",
    sponsorId: member?.id || "",
    setValue,
    pathFieldNameMap: {
      profile: "profile_image",
      background: "background_image",
    },
  });

  async function handleVoiceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    stopPolling();
    setVoiceUploading(true);
    try {
      const result = await uploadMemberVoice(file);
      setVoiceUrl(result.url);
      setVoiceTranscript("");
      toaster.create({ title: "Voice note uploaded", description: "Transcription will appear shortly.", type: "success", duration: 4000 });
      startPolling();
    } catch {
      toaster.create({ title: "Upload failed", description: "Could not upload voice note. Please try again.", type: "error", duration: 5000 });
    } finally {
      setVoiceUploading(false);
      if (voiceInputRef.current) voiceInputRef.current.value = "";
    }
  }

  async function handleVoiceDelete() {
    stopPolling();
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

  function stopPolling() {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setTranscriptPolling(false);
  }

  function startPolling() {
    pollDeadlineRef.current = Date.now() + 90_000;
    setTranscriptPolling(true);
    schedulePoll();
  }

  function schedulePoll() {
    pollTimerRef.current = setTimeout(async () => {
      if (Date.now() > pollDeadlineRef.current) {
        setTranscriptPolling(false);
        return;
      }
      try {
        const fresh = await fetchMyProfile();
        if (fresh.intro_voice_transcript) {
          setVoiceTranscript(fresh.intro_voice_transcript);
          setTranscriptPolling(false);
          refetchMember();
          return;
        }
      } catch {
        // silent — keep polling
      }
      schedulePoll();
    }, 5_000);
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

        {/* Basics */}
        <Box
          as="fieldset"
          bg={cardBg}
          border="1px solid"
          borderColor={cardBorder}
          borderRadius="xl"
          p={6}
        >
          <Heading as="legend" size="sm" mb={5} fontWeight="semibold">
            Basics
          </Heading>
          <VStack gap={5} align="stretch">
            <Field.Root invalid={!!errors.display_name}>
              <Field.Label>Display Name</Field.Label>
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

            <Field.Root required invalid={!!errors.quick_intro}>
              <Field.Label>
                Quick Intro <Text as="span" color="red.500" aria-hidden="true">*</Text>
              </Field.Label>
              <Textarea
                {...register("quick_intro", {
                  required: "Quick intro is required",
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

          </VStack>
        </Box>

        {/* More Info */}
        <Box
          as="fieldset"
          bg={cardBg}
          border="1px solid"
          borderColor={cardBorder}
          borderRadius="xl"
          p={6}
        >
          <Heading as="legend" size="sm" mb={5} fontWeight="semibold">
            More Info
          </Heading>
          <VStack gap={5} align="stretch">
            <Field.Root invalid={!!errors.right_now}>
              <Field.Label>Right now</Field.Label>
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

            <Field.Root>
              <Field.Label>Location</Field.Label>
              <Input
                {...register("location", { maxLength: { value: 120, message: "120 characters max" } })}
                placeholder="City, region, or Remote"
              />
            </Field.Root>

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

            {/* Voice Note */}
            <Field.Root>
              <Field.Label>Intro Voice Note</Field.Label>
              <Field.HelperText mb={2}>
                A short audio intro (up to 25 MB). Transcribed automatically.
              </Field.HelperText>
              <VStack align="start" gap={3} w="100%">
                {voiceUrl && (
                  <Box w="100%">
                    <VoicePlaybackBubble
                      audioUrl={voiceUrl}
                      durationSeconds={null}
                      transcript={voiceTranscript || null}
                      transcriptStatus={voiceTranscript ? 'done' : (transcriptPolling ? 'pending' : null)}
                      variant="neutral"
                    />
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
        <Flex
          justify="flex-end"
          gap={4}
          position="sticky"
          bottom={0}
          bg={cardBg}
          borderTop="1px solid"
          borderColor={cardBorder}
          py={3}
          px={4}
          zIndex={10}
          mx={-4}
        >
          {onCancel && (
            <Button
              variant="ghost"
              disabled={isUpdating}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
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
            disabled={!quickIntro?.trim()}
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

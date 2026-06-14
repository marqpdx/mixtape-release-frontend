"use client";

import { useEffect, memo, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Box, Button, Grid, RadioGroup, Stack, Text, Heading } from "@chakra-ui/react";
import { DatePickerInput } from "@components/forms/DatePickerField";
import { Input } from "@/theme/recipes/input.recipe";
import GroupVisibilitySelect from "../utils/GroupVisibilitySelect";
import type { GroupCreateFormValues, GroupType, GroupVisibility } from "@mixtape/core/types/groupTypes";
// import { GroupCreateFormValues } from "../forms/GroupCreateForm";

interface GroupCreateForm2Props {
  title?: string;
  showCard?: boolean;
  // IMPORTANT: form calls this; wrapper owns API
  onSubmit: (values: GroupCreateFormValues) => Promise<void> | void;
  // optional secondary action
  onSubmitAndEdit?: (values: GroupCreateFormValues) => Promise<void> | void;
  onSubmitAndVisit?: (values: GroupCreateFormValues) => Promise<void> | void;
  submitLabel?: string;
  submitAndEditLabel?: string;
  submitAndVisitLabel?: string;
  isSubmittingExternal?: boolean;
  // lock type if you want circle-only create screens
  lockedGroupType?: GroupType;
}

const groupTypeOptions = [
  { id: "community", label: "Community", value: "community" },
  { id: "coalition", label: "Coalition", value: "coalition" },
  { id: "circle", label: "Circle", value: "circle" },
];

function FormInner({
  title = "Create New Group",
  showCard = true,
  onSubmit,
  onSubmitAndEdit,
  onSubmitAndVisit,
  submitLabel = "Create",
  submitAndEditLabel = "Create & Edit",
  submitAndVisitLabel = "Create & Visit",
  isSubmittingExternal = false,
  lockedGroupType,
}: GroupCreateForm2Props) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { isSubmitting },
  } = useForm<GroupCreateFormValues>({
    mode: "onBlur",
    defaultValues: {
      title: "",
      description: "",
      visibility: "public" as GroupVisibility,
      group_type: (lockedGroupType ?? "community") as GroupType,
      tagline: "",
      start_date: null,
      end_date: null,
      // circle MVP defaults
      join_mode: "invite_only",
      allow_share_upward: false,
    },
  });

  const visibility = useWatch({ control, name: "visibility" });
  const groupType = useWatch({ control, name: "group_type" });
  const startDate = useWatch({ control, name: "start_date" });

  // Auto-focus title
  useEffect(() => {
    const t = setTimeout(() => {
      const el = document.querySelector('[name="title"]') as HTMLInputElement | null;
      el?.focus();
    }, 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (lockedGroupType) {
      setValue("group_type", lockedGroupType, { shouldValidate: true, shouldDirty: true });
    }
  }, [lockedGroupType, setValue]);

  const handleRadioChange = useCallback(
    (details: { value: string | null }) => {
      if (!details.value) return;
      if (lockedGroupType) return; // ignore changes
      setValue("group_type", details.value as GroupType, { shouldValidate: true, shouldDirty: true });
    },
    [setValue, lockedGroupType]
  );

  const handleVisibilityChange = useCallback(
    (val: string) => setValue("visibility", val as GroupVisibility),
    [setValue]
  );

  const submitting = isSubmitting || isSubmittingExternal;

  const content = (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={6}>
        {showCard && (
          <Heading size="lg" color="green.500" mb={2}>
            {title}
          </Heading>
        )}

        <Stack gap={4}>
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.600">
              Name *
            </Text>
            <Input
              {...register("title", { required: "Group name is required" })}
              placeholder="Enter group name"
              size="md"
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.600">
              Description *
            </Text>
            <Input
              {...register("description", { required: "Description is required" })}
              placeholder="Describe the purpose"
              size="md"
            />
          </Box>

          {lockedGroupType !== "circle" && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.600">
                Visibility
              </Text>
              <GroupVisibilitySelect
                register={register}
                value={visibility}
                onChange={handleVisibilityChange}
              />
            </Box>
          )}

          {!lockedGroupType && (
            <Box>
              <RadioGroup.Root value={groupType} onValueChange={handleRadioChange}>
                <Text fontSize="sm" fontWeight="medium" mb={3} color="gray.600">
                  Group Type
                </Text>
                <Text fontSize="sm" color="gray.500" mb={3}>
                  Community is a member group, Persona represents an individual, and Coalition links multiple groups.
                </Text>
                <Stack direction="row" gap={6} flexWrap="wrap">
                  {groupTypeOptions
                    .filter((opt) => opt.value !== "circle")
                    .map((opt) => (
                      <RadioGroup.Item key={opt.id} value={opt.value} p={3} rounded="md" _hover={{ bg: "green.50" }}>
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText fontWeight="medium">{opt.label}</RadioGroup.ItemText>
                      </RadioGroup.Item>
                    ))}
                </Stack>
              </RadioGroup.Root>
            </Box>
          )}

          {groupType === "circle" ? (
            <Grid templateColumns="2fr 1fr" gap={4} alignItems="start">
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.600">
                  Tagline (Optional)
                </Text>
                <Input {...register("tagline")} placeholder="A short tagline" size="md" />
              </Box>
              <Stack gap={2}>
                <DatePickerInput
                  name="start_date"
                  control={control}
                  isRequired={false}
                  placeholder="Start Date (Optional)"
                />
                <DatePickerInput
                  name="end_date"
                  control={control}
                  isRequired={false}
                  placeholder="End Date (Optional)"
                  validateFn={(value: Date | null) => {
                    if (!startDate && !value) return true;
                    if (startDate && !value) return true;
                    if (startDate && value && new Date(value) <= new Date(startDate)) {
                      return "End date must be after start date";
                    }
                    return true;
                  }}
                />
              </Stack>
            </Grid>
          ) : (
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.600">
                Tagline (Optional)
              </Text>
              <Input {...register("tagline")} placeholder="A short tagline" size="md" />
            </Box>
          )}
        </Stack>

        <Stack direction={{ base: "column", md: "row" }} gap={4} pt={4}>
          <Button type="submit" loading={submitting} colorScheme="green" size="lg" flex={1}>
            {submitLabel}
          </Button>

          {onSubmitAndEdit && (
            <Button
              type="button"
              onClick={handleSubmit(onSubmitAndEdit)}
              variant="outline"
              loading={submitting}
              size="lg"
              flex={1}
            >
              {submitAndEditLabel}
            </Button>
          )}

          {onSubmitAndVisit && (
            <Button
              type="button"
              onClick={handleSubmit(onSubmitAndVisit)}
              variant="outline"
              loading={submitting}
              size="lg"
              flex={1}
            >
              {submitAndVisitLabel}
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );

  if (!showCard) return content;

  return (
    <Box>
      <Box marginInline={'inherit !important'}>
        <Box p={8}>{content}</Box>
      </Box>
    </Box>
  );
}

export default memo(FormInner);

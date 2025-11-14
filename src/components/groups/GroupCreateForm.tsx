// /src/components/groups/GroupCreateForm.tsx - FIXED VERSION

"use client";

import { useForm } from "@refinedev/react-hook-form";
import {
  Box,
  Button,
  RadioGroup,
  Stack,
  Text,
  Card,
  Heading,
} from "@chakra-ui/react";
import { createStandaloneToast } from "@chakra-ui/toast";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import { useEffect, useRef, useState, memo, useCallback } from "react";
import { DatePickerInput } from "@components/forms/DatePickerField";
import { Input } from "@theme/recipes/input.recipe";
import GroupVisibilitySelect from "@components/groups/GroupVisibilitySelect";
import { useWatch } from "react-hook-form";

const { toast } = createStandaloneToast();

const groupTypeOptions = [
  { id: "community", label: "Community", value: "community" },
  { id: "circle", label: "Circle", value: "circle" },
];

// FIXED: Move FormContent OUTSIDE the component to prevent recreation on every render
interface FormContentProps {
  handleSubmit: any;
  onSubmit: (data: any) => void;
  onSubmitAndEdit?: (data: any) => void;
  register: any;
  showCard: boolean;
  title: string;
  visibility: string;
  groupType: string;
  startDate: any;
  handleRadioChange: (val: any) => void;
  handleVisibilityChange: (val: any) => void;
  isSubmitting: boolean;
  onSuccessAndEdit?: (slug: string) => void;
}

const FormContent = ({
  handleSubmit,
  onSubmit,
  onSubmitAndEdit,
  register,
  showCard,
  title,
  visibility,
  groupType,
  startDate,
  handleRadioChange,
  handleVisibilityChange,
  isSubmitting,
  onSuccessAndEdit,
}: FormContentProps) => (
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
            Group Name *
          </Text>
          <Input
            {...register("title", {
              required: "Group name is required",
            })}
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
            placeholder="Describe your group's purpose"
            size="md"
          />
        </Box>

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

        <Box>
          <RadioGroup.Root
            value={groupType}
            onValueChange={handleRadioChange}
          >
            <Text fontSize="sm" fontWeight="medium" mb={3} color="gray.600">
              Group Type
            </Text>
            <Stack direction="row" gap={6}>
              {groupTypeOptions.map((option) => (
                <RadioGroup.Item
                  key={option.id}
                  value={option.value}
                  _hover={{ bg: "green.50" }}
                  p={3}
                  rounded="md"
                  transition="all 0.2s"
                >
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator />
                  <RadioGroup.ItemText fontWeight="medium">
                    {option.label}
                  </RadioGroup.ItemText>
                </RadioGroup.Item>
              ))}
            </Stack>
          </RadioGroup.Root>
        </Box>

        {groupType === "circle" && (
          <Stack gap={4} p={4} bg="green.50" rounded="md" border="1px solid" borderColor="green.200">
            <Text fontSize="sm" fontWeight="medium" color="green.700">
              Circle Details
            </Text>

            <DatePickerInput
              name="start_date"
              control={register.control}
              isRequired={false}
              placeholder="Start Date & Time (Optional)"
            />

            <DatePickerInput
              name="end_date"
              control={register.control}
              isRequired={false}
              placeholder="End Date & Time (Optional)"
              validateFn={(value: Date | null) => {
                if (!startDate && !value) {
                  return true;
                }

                if (startDate && !value) {
                  return true;
                }

                if (startDate && value && new Date(value) <= new Date(startDate)) {
                  return "End date must be after start date";
                }

                return true;
              }}
            />
          </Stack>
        )}

        {groupType === "community" && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.600">
              Tagline (Optional)
            </Text>
            <Input
              {...register("tagline")}
              placeholder="A catchy tagline for your community"
              size="md"
            />
          </Box>
        )}
      </Stack>

      <Stack direction={{ base: "column", md: "row" }} gap={4} pt={4}>
        <Button
          type="submit"
          loading={isSubmitting}
          colorScheme="green"
          size="lg"
          flex={1}
        >
          Create Group
        </Button>
        {onSuccessAndEdit && onSubmitAndEdit && (
          <Button
            type="button"
            onClick={handleSubmit(onSubmitAndEdit)}
            variant="outline"
            loading={isSubmitting}
            size="lg"
            flex={1}
          >
            Create & Edit
          </Button>
        )}
      </Stack>
    </Stack>
  </Box>
);

interface GroupCreateFormProps {
  onSuccess?: (slug: string) => void;
  onSuccessAndEdit?: (slug: string) => void;
  showCard?: boolean;
  title?: string;
}

const GroupCreateForm = memo(function GroupCreateForm({
  onSuccess,
  onSuccessAndEdit,
  showCard = true,
  title = "Create New Group"
}: GroupCreateFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      title: "",
      description: "",
      visibility: "public",
      group_type: "community",
      tagline: "",
      start_date: null,
      end_date: null,
    }
  });

  const visibility = useWatch({ control, name: "visibility" });
  const groupType = useWatch({ control, name: "group_type" });
  const startDate = useWatch({ control, name: "start_date" });

  // Auto-focus the title field
  useEffect(() => {
    const timer = setTimeout(() => {
      const titleField = document.querySelector('[name="title"]') as HTMLInputElement;
      if (titleField) {
        titleField.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Initialize group_type
  useEffect(() => {
    setValue("group_type", "community", {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [setValue]);

  // FIXED: Stable handlers using useCallback
  const createGroup = useCallback(async (values: any): Promise<string | null> => {
    try {
      const res = await axiosInstance.post("/api/groups", values);
      toast({
        title: "Group Created",
        description: `Your ${values.group_type} was created successfully.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      return res.data?.slug ?? null;
    } catch (err) {
      console.error("Error creating group:", err);
      toast({
        title: "Error",
        description: "Group creation failed. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return null;
    }
  }, []);

  const onSubmit = useCallback(async (values: any) => {
    const slug = await createGroup(values);
    if (slug && onSuccess) {
      onSuccess(slug);
    }
  }, [createGroup, onSuccess]);

  const onSubmitAndEdit = useCallback(async (values: any) => {
    const slug = await createGroup(values);
    if (slug && onSuccessAndEdit) {
      onSuccessAndEdit(slug);
    }
  }, [createGroup, onSuccessAndEdit]);

  const handleRadioChange = useCallback((val: any) => {
    const finalVal = typeof val === "object" && val?.value ? val.value : val;
    setValue("group_type", finalVal, { shouldValidate: true, shouldDirty: true });
  }, [setValue]);

  const handleVisibilityChange = useCallback((val: any) => {
    setValue("visibility", val);
  }, [setValue]);

  // FIXED: Pass all props to external FormContent component
  if (!showCard) {
    return (
      <FormContent
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
        onSubmitAndEdit={onSubmitAndEdit}
        register={register}
        showCard={showCard}
        title={title}
        visibility={visibility}
        groupType={groupType}
        startDate={startDate}
        handleRadioChange={handleRadioChange}
        handleVisibilityChange={handleVisibilityChange}
        isSubmitting={isSubmitting}
        onSuccessAndEdit={onSuccessAndEdit}
      />
    );
  }

  return (
    <Box maxW="800px" mx="auto" mt={6}>
      <Card.Root>
        <Card.Body p={8}>
          <FormContent
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            onSubmitAndEdit={onSubmitAndEdit}
            register={register}
            showCard={showCard}
            title={title}
            visibility={visibility}
            groupType={groupType}
            startDate={startDate}
            handleRadioChange={handleRadioChange}
            handleVisibilityChange={handleVisibilityChange}
            isSubmitting={isSubmitting}
            onSuccessAndEdit={onSuccessAndEdit}
          />
        </Card.Body>
      </Card.Root>
    </Box>
  );
});

export default GroupCreateForm;
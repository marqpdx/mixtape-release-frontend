// apps/crossroads/src/components/working-papers/WorkingPaperResponseForm.tsx
//
// The response form at the foot of a Working Paper: the Contact us form's
// fields and layout, with its own subject (set by core from the paper's
// title and version) and fields for a reader's response.

"use client";

import { useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import {
  Box,
  Button,
  Checkbox,
  Field,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@mixtape/core/lib/toaster";

type ResponseFormValues = {
  name: string;
  email: string;
  organization?: string;
  response_type: string;
  message: string;
};

type ResponseError = { response?: { data?: { detail?: string } } };

const RESPONSE_TYPES = [
  { value: "correction", label: "A correction" },
  { value: "question", label: "A question" },
  { value: "idea", label: "An idea" },
  { value: "collaborate", label: "Interested in working together" },
];

export function WorkingPaperResponseForm({
  paperTitle,
  paperVersion,
  packet,
}: {
  paperTitle: string;
  paperVersion?: string;
  packet: string;
}) {
  const [mayCredit, setMayCredit] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResponseFormValues>({ defaultValues: { response_type: "" } });

  const onSubmit: SubmitHandler<ResponseFormValues> = async (values) => {
    try {
      await axiosInstance.post("/api/feedback/working-papers/respond", {
        ...values,
        may_credit: mayCredit,
        paper_title: paperTitle,
        paper_version: paperVersion ?? "",
        packet,
        page_url: typeof window !== "undefined" ? window.location.href : "",
        website: honeypot,
      });
      setSent(true);
      setMayCredit(false);
      reset();
    } catch (err: unknown) {
      const detail = (err as ResponseError).response?.data?.detail;
      toaster.create({
        title: "Response not sent",
        description: detail ?? "Could not send your response. Please try again.",
        type: "error",
        duration: 5000,
        closable: true,
      });
    }
  };

  return (
    <Box as="section" aria-labelledby="respond-heading" mt={16} pt={10} borderTopWidth="1px">
      <Stack gap={2} mb={6}>
        <Heading as="h2" id="respond-heading" size="lg">
          Respond to this paper
        </Heading>
        <Text color="fg.muted">
          This is a working paper: corrections, questions and ideas are welcome before it reaches 1.0.
          Your response comes straight to the author.
        </Text>
      </Stack>

      {sent ? (
        <Stack gap={4} role="status">
          <Text color="green.600">Thank you. Your response has been sent.</Text>
          <Button variant="outline" alignSelf="flex-start" onClick={() => setSent(false)}>
            Send another response
          </Button>
        </Stack>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap={6}>
            <Field.Root required invalid={!!errors.response_type}>
              <Field.Label>
                What kind of response?
                <Field.RequiredIndicator />
              </Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field {...register("response_type", { required: "Choose a kind of response." })}>
                  <option value="" disabled>
                    Choose one
                  </option>
                  {RESPONSE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
              <Field.ErrorText>{errors.response_type?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root required invalid={!!errors.message}>
              <Field.Label>
                Your response
                <Field.RequiredIndicator />
              </Field.Label>
              <Textarea
                rows={6}
                {...register("message", { required: "A response is required." })}
                placeholder="Name the section if it helps: what's wrong, missing, or worth taking further?"
              />
              <Field.ErrorText>{errors.message?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root required invalid={!!errors.name}>
              <Field.Label>
                Name
                <Field.RequiredIndicator />
              </Field.Label>
              <Input {...register("name", { required: "A name is required." })} placeholder="Your name" />
              <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root required invalid={!!errors.email}>
              <Field.Label>
                Email
                <Field.RequiredIndicator />
              </Field.Label>
              <Input
                type="email"
                {...register("email", { required: "Email is required." })}
                placeholder="you@example.com"
              />
              <Field.HelperText>Used only to reply to you; never shared.</Field.HelperText>
              <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root>
              <Field.Label>Organization</Field.Label>
              <Input {...register("organization")} placeholder="Organization (optional)" />
            </Field.Root>

            <Checkbox.Root
              checked={mayCredit}
              onCheckedChange={({ checked }: { checked: boolean | string }) => setMayCredit(checked === true)}
            >
              <Checkbox.HiddenInput />
              <HStack gap={3} align="flex-start">
                <Checkbox.Control borderRadius="md" mt="2px">
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Label>You may quote my response and credit me by name in a later version.</Checkbox.Label>
              </HStack>
            </Checkbox.Root>

            {/* Honeypot field: invisible to people */}
            <Input
              name="website"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ display: "none" }}
            />

            <Button type="submit" loading={isSubmitting} alignSelf="flex-start">
              Send response
            </Button>
          </Stack>
        </form>
      )}
    </Box>
  );
}

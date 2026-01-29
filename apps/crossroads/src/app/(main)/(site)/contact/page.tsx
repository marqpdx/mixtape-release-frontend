// apps/crossroads/src/app/(root)/contact/page.tsx

"use client";

import {
  Box,
  Button,
  Field,
  Input,
  Textarea,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@mixtape/core/lib/toaster";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { chakra } from "@chakra-ui/react";

const MotionBox = chakra(motion.div);

type ContactFormValues = {
  name: string;
  email: string;
  message: string;
  subject?: string;
  honeypot?: string;
};

type ContactErrorResponse = {
  detail?: string;
  non_field_errors?: string[];
};

type ContactError = {
  response?: {
    data?: ContactErrorResponse;
  };
};

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const onSubmit: SubmitHandler<ContactFormValues> = async (values) => {
    try {
      await axiosInstance.post("/api/contact", values);

      setStatusMessage("✅ Your message has been sent!");
      reset();
    } catch (err: unknown) {
      console.error(err);
      const error = err as ContactError;
      const data = error.response?.data;
      let errorMessage = "Could not send message.";

      if (data?.detail) {
        errorMessage = data.detail;
      } else if (data?.non_field_errors && data.non_field_errors.length > 0) {
        errorMessage = data.non_field_errors.join(" ");
      }

      toaster.create({
        title: "Message failed",
        description: errorMessage,
        type: "error",
        duration: 5000,
        closable: true,
      });
    }
  };

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  return (
    <Box maxW="600px" mx="auto" mt={10}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={6}>

          {/* Name Field */}
          <Field.Root required>
            <Field.Label>
              Name
              <Field.RequiredIndicator />
            </Field.Label>
            <Input
              {...register("name", { required: "A name is required." })}
              placeholder="Your name"
            />
            <Field.HelperText>Optional.</Field.HelperText>
            <Field.ErrorText>{errors.name?.message as string}</Field.ErrorText>
          </Field.Root>

          {/* Email Field */}
          <Field.Root required>
            <Field.Label>
              Email
              <Field.RequiredIndicator />
            </Field.Label>
            <Input
              type="email"
              {...register("email", { required: "Email is required." })}
              placeholder="you@example.com"
            />
            <Field.HelperText>We&apos;ll never share your email.</Field.HelperText>
            <Field.ErrorText>{errors.email?.message as string}</Field.ErrorText>
          </Field.Root>

          {/* Message Field */}
          <Field.Root required>
            <Field.Label>
              Message
              <Field.RequiredIndicator />
            </Field.Label>
            <Textarea
              rows={5}
              {...register("message", { required: "Message is required." })}
              placeholder="Write your message..."
            />
            <Field.HelperText>Tell us how we can help.</Field.HelperText>
            <Field.ErrorText>{errors.message?.message as string}</Field.ErrorText>
          </Field.Root>

          {/* Subject Field */}
          <Field.Root>
            <Field.Label>Subject</Field.Label>
            <Input
              {...register("subject")}
              placeholder="Subject (optional)"
            />
            <Field.HelperText>Optional.</Field.HelperText>
            <Field.ErrorText>{errors.subject?.message as string}</Field.ErrorText>
          </Field.Root>

          {/* Honeypot Field - invisible */}
          <Input
            {...register("honeypot")}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            style={{ display: "none" }}
          />

          <Button
            type="submit"
            loading={isSubmitting}
          >
            Send Message
          </Button>
        </Stack>
      </form>

      <AnimatePresence>
        {statusMessage && (
          <MotionBox
            mt={4}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.4 } }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
          >
            <Text color="green.600">{statusMessage}</Text>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

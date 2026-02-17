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
  Tabs,
} from "@chakra-ui/react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@mixtape/core/lib/toaster";
import { useState, useEffect, useMemo, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { chakra } from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";

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

function ContactPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [contactHoneypot, setContactHoneypot] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);
  const [newsletterHoneypot, setNewsletterHoneypot] = useState("");
  const [activeTab, setActiveTab] = useState<"newsletter" | "contact">("contact");

  const newsletterSlug = process.env.NEXT_PUBLIC_DEFAULT_NEWSLETTER_SLUG;
  const queryTab = useMemo(() => searchParams.get("tab"), [searchParams]);

  useEffect(() => {
    if (queryTab === "contact" || queryTab === "newsletter") {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  const onSubmit: SubmitHandler<ContactFormValues> = async (values) => {
    try {
      await axiosInstance.post("/api/contact", {
        ...values,
        website: contactHoneypot,
      });

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

  const handleNewsletterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = newsletterEmail.trim();

    if (!newsletterSlug) {
      toaster.create({
        title: "Newsletter unavailable",
        description: "Missing newsletter configuration.",
        type: "error",
        duration: 5000,
        closable: true,
      });
      return;
    }

    if (!email) {
      toaster.create({
        title: "Email required",
        description: "Please enter your email address.",
        type: "error",
        duration: 4000,
        closable: true,
      });
      return;
    }

    try {
      setIsNewsletterSubmitting(true);
      await axiosInstance.post("/api/lanternmail/subscribe", {
        email,
        list_slug: newsletterSlug,
        website: newsletterHoneypot,
      });
      setNewsletterStatus("✅ Check your email to confirm your subscription.");
      setNewsletterEmail("");
    } catch (err: unknown) {
      console.error(err);
      const error = err as ContactError;
      const data = error.response?.data;
      const errorMessage =
        data?.detail ||
        (data?.non_field_errors && data.non_field_errors.length > 0
          ? data.non_field_errors.join(" ")
          : "Could not subscribe.");

      toaster.create({
        title: "Subscription failed",
        description: errorMessage,
        type: "error",
        duration: 5000,
        closable: true,
      });
    } finally {
      setIsNewsletterSubmitting(false);
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

  useEffect(() => {
    if (newsletterStatus) {
      const timer = setTimeout(() => {
        setNewsletterStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newsletterStatus]);

  return (
    <Box className="contact-page" maxW="600px" mx="auto" mt={10} pb={5}>
      <Tabs.Root
        value={activeTab}
        onValueChange={(details) => {
          const nextValue = details.value === "contact" ? "contact" : "newsletter";
          setActiveTab(nextValue);
          const params = new URLSearchParams(searchParams.toString());
          params.set("tab", nextValue);
          router.replace(`?${params.toString()}`);
        }}
      >
        <Tabs.List mb={6}>
          <Tabs.Trigger value="newsletter">Crossroads News</Tabs.Trigger>
          <Tabs.Trigger value="contact">Contact</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="newsletter">
          <form onSubmit={handleNewsletterSubmit}>
            <Stack gap={6}>
              <Text>
                Get updates about Crossroads. We&apos;ll send occasional notes and
                releases.
              </Text>

              <Field.Root required>
                <Field.Label>
                  Email
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  type="email"
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  placeholder="you@example.com"
                />
                <Field.HelperText>We&apos;ll never share your email.</Field.HelperText>
              </Field.Root>

              <Input
                value={newsletterHoneypot}
                onChange={(event) => setNewsletterHoneypot(event.target.value)}
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                style={{ display: "none" }}
              />

              <Button type="submit" loading={isNewsletterSubmitting}>
                Sign up for Crossroads News
              </Button>
            </Stack>
          </form>

          <AnimatePresence>
            {newsletterStatus && (
              <MotionBox
                mt={4}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.4 } }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
              >
                <Text color="green.600">{newsletterStatus}</Text>
              </MotionBox>
            )}
          </AnimatePresence>
        </Tabs.Content>

        <Tabs.Content value="contact">
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
                name="website"
                value={contactHoneypot}
                onChange={(event) => setContactHoneypot(event.target.value)}
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
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}

export default function ContactPage() {
  return (
    <Suspense>
      <ContactPageContent />
    </Suspense>
  );
}

"use client";

import { Box, Button, Field, Heading, Input, Stack, Text, Textarea } from "@chakra-ui/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useState } from "react";

type IntakeError = {
  response?: { data?: { detail?: string } };
};

export default function GetStartedPage() {
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [knowledgeGoal, setKnowledgeGoal] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (honeypot) return;

    setError(null);
    setSubmitting(true);

    try {
      await axiosInstance.post("/api/public/client-intake", {
        org_name: orgName.trim(),
        org_description: orgDescription.trim(),
        knowledge_goal: knowledgeGoal.trim(),
        email: email.trim(),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as IntakeError;
      setError(e.response?.data?.detail ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Box className="gs-root" maxW="560px" mx="auto" mt={16} px={4}>
        <Heading size="lg" mb={4}>We got it.</Heading>
        <Text>
          Thanks for your interest. We&apos;ll be in touch at the email you provided.
        </Text>
      </Box>
    );
  }

  return (
    <Box className="gs-root" maxW="560px" mx="auto" mt={16} px={4} pb={12}>
      <Heading size="lg" mb={2}>Get started with Catalyst</Heading>
      <Text mb={8} color="fg.muted">
        Tell us a bit about your organization and we&apos;ll reach out to set things up.
      </Text>

      <form onSubmit={handleSubmit}>
        <Stack gap={6}>
          <Field.Root required>
            <Field.Label>
              Organization name
              <Field.RequiredIndicator />
            </Field.Label>
            <Input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Corp"
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>What does your organization do?</Field.Label>
            <Textarea
              value={orgDescription}
              onChange={(e) => setOrgDescription(e.target.value)}
              placeholder="A sentence or two is fine."
              rows={3}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>What&apos;s one thing your team should always be able to find quickly?</Field.Label>
            <Input
              value={knowledgeGoal}
              onChange={(e) => setKnowledgeGoal(e.target.value)}
              placeholder="e.g. our supplier contacts, how we handle returns, who to call when X breaks"
            />
          </Field.Root>

          <Field.Root required>
            <Field.Label>
              Email
              <Field.RequiredIndicator />
            </Field.Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field.Root>

          {/* Honeypot — hidden from real users */}
          <Input
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            style={{ display: "none" }}
          />

          {error && (
            <Text color="red.500" fontSize="sm">{error}</Text>
          )}

          <Button type="submit" loading={submitting} disabled={!orgName || !email}>
            Request access
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

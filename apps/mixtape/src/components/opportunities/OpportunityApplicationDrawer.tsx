"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Drawer,
  Field,
  HStack,
  Input,
  Link,
  Spinner,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { Download, ExternalLink, Mail, Save, Sparkles } from "lucide-react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

type ApplicationDraft = {
  id: string;
  status: "draft" | "ready";
  recipient_name: string;
  recipient_email: string;
  letter_body: string;
  generated_by: string;
  profile_version: number | null;
  resume_label: string;
  resume_version: string;
  updated_at: string;
};

export type ApplicationOpportunity = {
  id: string;
  source_url: string;
  payload: {
    title?: string;
    organization?: string;
    application_url?: string;
    application_method?: string;
    easy_apply?: boolean;
    employer_type?: string;
    recruiter_name?: string;
    contact_email?: string;
    contact_email_status?: string;
  };
};

export function OpportunityApplicationDrawer({
  opportunity,
  onClose,
}: {
  opportunity: ApplicationOpportunity | null;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ApplicationDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opportunity) {
      setDraft(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    axiosInstance.get(`/api/opportunities/candidates/${opportunity.id}/application-draft`)
      .then((response) => {
        if (active) setDraft(response.data.draft ?? null);
      })
      .catch((requestError) => {
        if (active) setError(apiError(requestError, "Could not load application material."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [opportunity]);

  const generateDraft = async () => {
    if (!opportunity) return;
    setGenerating(true);
    setError(null);
    try {
      const response = await axiosInstance.post(
        `/api/opportunities/candidates/${opportunity.id}/application-draft`,
        {},
      );
      setDraft(response.data.draft);
    } catch (requestError) {
      setError(apiError(requestError, "Could not draft the cover letter."));
    } finally {
      setGenerating(false);
    }
  };

  const saveDraft = async (): Promise<ApplicationDraft | null> => {
    if (!opportunity || !draft) return null;
    setSaving(true);
    setError(null);
    try {
      const response = await axiosInstance.put(
        `/api/opportunities/candidates/${opportunity.id}/application-draft`,
        {
          recipient_name: draft.recipient_name,
          recipient_email: draft.recipient_email,
          letter_body: draft.letter_body,
          status: draft.status,
        },
      );
      setDraft(response.data.draft);
      return response.data.draft;
    } catch (requestError) {
      setError(apiError(requestError, "Could not save the cover letter."));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const downloadPDF = async () => {
    if (!opportunity || !draft) return;
    setDownloading(true);
    const saved = await saveDraft();
    if (!saved) {
      setDownloading(false);
      return;
    }
    try {
      const response = await axiosInstance.get(
        `/api/opportunities/candidates/${opportunity.id}/application-draft/pdf`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cover-letter-${slug(opportunity.payload.organization || opportunity.payload.title || "opportunity")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(apiError(requestError, "Could not download the cover-letter PDF."));
    } finally {
      setDownloading(false);
    }
  };

  const applicationUrl = opportunity?.payload.application_url || opportunity?.source_url || "";

  return (
    <Drawer.Root open={!!opportunity} onOpenChange={(event) => !event.open && onClose()} size="lg">
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content className="opad-content" bg="bg">
          <Drawer.Header className="opad-header" borderBottomWidth="1px">
            <Box>
              <Drawer.Title>Prepare application</Drawer.Title>
              <Text color="fg.muted" fontSize="sm" mt={1}>
                {opportunity?.payload.title} · {opportunity?.payload.organization}
              </Text>
            </Box>
            <Drawer.CloseTrigger />
          </Drawer.Header>
          <Drawer.Body className="opad-body" py={6}>
            {loading ? (
              <HStack py={10} justify="center"><Spinner /><Text>Loading application material…</Text></HStack>
            ) : (
              <Stack gap={6}>
                {error && (
                  <Box borderLeftWidth="3px" borderColor="red.500" bg="red.subtle" px={4} py={3}>
                    <Text color="red.fg">{error}</Text>
                  </Box>
                )}

                <Box className="opad-source-facts" borderWidth="1px" p={4}>
                  <Text fontSize="xs" color="fg.muted" textTransform="uppercase" mb={2}>Application boundary</Text>
                  <HStack gap={2} wrap="wrap" mb={2}>
                    {opportunity?.payload.easy_apply && <Badge colorPalette="teal">Dice Easy Apply</Badge>}
                    {opportunity?.payload.employer_type && <Badge variant="outline">{opportunity.payload.employer_type}</Badge>}
                    {opportunity?.payload.recruiter_name && <Badge variant="outline">{opportunity.payload.recruiter_name}</Badge>}
                  </HStack>
                  <Text fontSize="sm" color="fg.muted">
                    Mixtape prepares the material. You review it and submit it through Dice.
                  </Text>
                </Box>

                {!draft ? (
                  <Box className="opad-empty" borderWidth="1px" borderStyle="dashed" p={6} textAlign="center">
                    <Sparkles size={22} style={{ margin: "0 auto 10px" }} aria-hidden />
                    <Text fontWeight="semibold" mb={2}>Draft from grounded facts</Text>
                    <Text fontSize="sm" color="fg.muted" mb={4}>
                      The suggestion uses the full listing and your current opportunity profile. It must be reviewed before use.
                    </Text>
                    <Button colorPalette="teal" onClick={generateDraft} loading={generating}>
                      <Sparkles size={16} /> Draft cover letter
                    </Button>
                  </Box>
                ) : (
                  <Stack className="opad-editor" gap={4}>
                    <HStack gap={3} align="start">
                      <Field.Root>
                        <Field.Label>Recipient</Field.Label>
                        <Input
                          value={draft.recipient_name}
                          onChange={(event) => setDraft({ ...draft, recipient_name: event.target.value })}
                          placeholder="Hiring team"
                        />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label>Recruiter email</Field.Label>
                        <Input
                          type="email"
                          value={draft.recipient_email}
                          onChange={(event) => setDraft({ ...draft, recipient_email: event.target.value })}
                          placeholder="Not found"
                        />
                      </Field.Root>
                    </HStack>
                    {draft.recipient_email && (
                      <Text fontSize="xs" color="fg.muted">
                        Email extracted from listing text; verify it before contacting the recruiter.
                      </Text>
                    )}
                    <Field.Root>
                      <Field.Label>Cover letter</Field.Label>
                      <Textarea
                        value={draft.letter_body}
                        onChange={(event) => setDraft({ ...draft, letter_body: event.target.value })}
                        minH="360px"
                        lineHeight="1.6"
                      />
                    </Field.Root>
                    <Text fontSize="xs" color="fg.muted">
                      Generated from {draft.resume_label || "the current opportunity profile"}
                      {draft.resume_version ? ` · ${draft.resume_version}` : ""}. Review every claim before downloading.
                    </Text>
                    <HStack gap={2} wrap="wrap">
                      <Button variant="outline" onClick={() => void saveDraft()} loading={saving}>
                        <Save size={16} /> Save draft
                      </Button>
                      <Button colorPalette="teal" onClick={downloadPDF} loading={downloading}>
                        <Download size={16} /> Download PDF
                      </Button>
                    </HStack>
                  </Stack>
                )}

                <Stack gap={2}>
                  {draft?.recipient_email && (
                    <Link href={`mailto:${draft.recipient_email}`} color="teal.fg" width="fit-content">
                      <Mail size={15} /> Email recruiter
                    </Link>
                  )}
                  {applicationUrl && (
                    <Link href={applicationUrl} target="_blank" rel="noreferrer" color="teal.fg" width="fit-content">
                      Open {opportunity?.payload.easy_apply ? "Dice Easy Apply" : "application"}
                      <ExternalLink size={14} />
                    </Link>
                  )}
                </Stack>
              </Stack>
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}

function apiError(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
  }
  return fallback;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "opportunity";
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  HStack,
  Input,
  NativeSelect,
  Separator,
  Spinner,
  Table,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@mixtape/core/lib/toaster";
import { DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseTrigger } from "@components/ui/dialog";

type SourceConnection = {
  id: string;
  display_name: string;
  provider: string;
  status: string;
  metadata?: {
    adapter?: string;
  };
};

type SourceGrant = {
  id: string;
  display_name: string;
  resource_id: string;
  resource_kind: string;
  status: string;
};

type GmailLabel = {
  id: string;
  name: string;
  type?: string;
};

type SourceEvidence = {
  id: string;
  provider_message_id: string;
  sender_email: string;
  sender_header_raw: string;
  sent_at: string | null;
  subject: string;
  body_snapshot_status: string;
  bounded_excerpt: string;
};

type RawEmailData = {
  provider_message_id: string;
  from_header: string;
  subject: string;
  sent_at: string;
  body: string;
};

type ProvisionalThing = {
  id: string;
  status: string;
  preferred_name: string;
  email: string;
  organization_guess: string;
  name_source: string;
  name_confidence: string;
  name_status: string;
  evidence: SourceEvidence[];
};

type WorkingSetMembership = {
  id: string;
  status: string;
  position: number;
  provisional_thing: ProvisionalThing;
};

type WorkingSet = {
  id: string;
  title: string;
  status: string;
  summary: {
    total?: number;
    ready?: number;
    needs_review?: number;
    excluded?: number;
  };
  memberships: WorkingSetMembership[];
};

type Props = {
  groupSlug: string;
};

const SAMPLE_MESSAGES = [
  {
    provider_message_id: "sample-recruiter-001",
    provider_thread_id: "sample-thread-001",
    from_header: "Vaughn Smith <vaughn@example.com>",
    sent_at: "2026-09-01T16:00:00Z",
    subject: "Senior Django Engineer role",
    body: "Hi Mark,\n\nI wanted to reconnect about backend roles.\n\nBest regards,\nVaughn Smith\nSenior Technical Recruiter",
  },
  {
    provider_message_id: "sample-recruiter-002",
    provider_thread_id: "sample-thread-002",
    from_header: "talent@example.net",
    sent_at: "2026-09-02T18:30:00Z",
    subject: "Python platform opportunity",
    body: "Hello,\n\nYour background may fit a platform role.\n\nKind regards,\nAmara Lee\nTalent Partner",
  },
];

export function RecruiterSourceWorkArea({ groupSlug }: Props) {
  const [connections, setConnections] = useState<SourceConnection[]>([]);
  const [grants, setGrants] = useState<SourceGrant[]>([]);
  const [gmailLabels, setGmailLabels] = useState<GmailLabel[]>([]);
  const [workingSets, setWorkingSets] = useState<WorkingSet[]>([]);
  const [selectedGrantId, setSelectedGrantId] = useState("");
  const [resourceName, setResourceName] = useState("Recruiters");
  const [selectedLabelId, setSelectedLabelId] = useState("");
  const [messagesJson, setMessagesJson] = useState(() => JSON.stringify(SAMPLE_MESSAGES, null, 2));
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isImportingFromSource, setIsImportingFromSource] = useState(false);
  const [emailModal, setEmailModal] = useState<{
    open: boolean;
    evidence: SourceEvidence | null;
    thingId: string | null;
    loading: boolean;
    data: RawEmailData | null;
  }>({ open: false, evidence: null, thingId: null, loading: false, data: null });

  const baseUrl = `/api/groups/${groupSlug}/sourcework`;
  const activeConnection = connections[0];
  const activeGrant = useMemo(
    () => grants.find((grant) => grant.id === selectedGrantId) || grants[0],
    [grants, selectedGrantId],
  );
  const recruiterSet = workingSets[0];

  const selectedLabel = useMemo(
    () => gmailLabels.find((label) => label.id === selectedLabelId),
    [gmailLabels, selectedLabelId],
  );

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [connectionsRes, grantsRes, workingSetsRes] = await Promise.all([
        axiosInstance.get<SourceConnection[]>(`${baseUrl}/connections`),
        axiosInstance.get<SourceGrant[]>(`${baseUrl}/source-grants`),
        axiosInstance.get<WorkingSet[]>(`${baseUrl}/working-sets`),
      ]);
      setConnections(connectionsRes.data);
      setGrants(grantsRes.data);
      setWorkingSets(workingSetsRes.data);
      if (!selectedGrantId && grantsRes.data[0]) {
        setSelectedGrantId(grantsRes.data[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load source work";
      toaster.create({ title: "Source work unavailable", description: message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupSlug]);

  useEffect(() => {
    if (
      !activeConnection
      || activeConnection.provider !== "google_gmail"
      || activeConnection.metadata?.adapter !== "switchboard_gmail_v1"
    ) {
      setGmailLabels([]);
      setSelectedLabelId("");
      return;
    }
    let cancelled = false;
    const loadLabels = async () => {
      try {
        const res = await axiosInstance.get<{ labels: GmailLabel[] }>(
          `${baseUrl}/connections/${activeConnection.id}/gmail-labels`,
        );
        if (cancelled) return;
        setGmailLabels(res.data.labels);
        if (!selectedLabelId && res.data.labels[0]) {
          setSelectedLabelId(res.data.labels[0].id);
          setResourceName(res.data.labels[0].name);
        }
      } catch (err) {
        if (cancelled) return;
        setGmailLabels([]);
        const message = err instanceof Error ? err.message : "Failed to load Gmail labels";
        toaster.create({ title: "Gmail labels unavailable", description: message, type: "warning" });
      }
    };
    loadLabels();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConnection?.id, baseUrl]);

  const createConnection = async () => {
    try {
      await axiosInstance.post(`${baseUrl}/connections`, {
        display_name: "Google Mail - manual V1",
        provider_account_id: "manual-v1",
        status: "ready",
      });
      await loadAll();
      toaster.create({ title: "Connection created", type: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create connection";
      toaster.create({ title: "Connection failed", description: message, type: "error" });
    }
  };

  const startGoogleOAuth = async () => {
    setIsConnectingGoogle(true);
    try {
      const res = await axiosInstance.post<{ authorization_url: string }>(`${baseUrl}/google-oauth/start`);
      window.open(res.data.authorization_url, "_blank", "noopener,noreferrer");
      toaster.create({ title: "Google authorization opened", description: "Return here and refresh after Google Mail is connected.", type: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start Google OAuth";
      toaster.create({ title: "Google connection failed", description: message, type: "error" });
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const createGrant = async () => {
    if (!activeConnection) return;
    const resourceId = selectedLabel?.id || resourceName;
    const displayName = selectedLabel?.name || resourceName;
    try {
      const res = await axiosInstance.post<SourceGrant>(`${baseUrl}/source-grants`, {
        connection: activeConnection.id,
        resource_kind: "gmail_label",
        resource_id: resourceId,
        display_name: displayName,
      });
      setSelectedGrantId(res.data.id);
      await loadAll();
      toaster.create({ title: "Source Grant created", type: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create source grant";
      toaster.create({ title: "Source Grant failed", description: message, type: "error" });
    }
  };

  const importLatest = async () => {
    if (!activeGrant) return;
    let messages: unknown;
    try {
      messages = JSON.parse(messagesJson);
    } catch {
      toaster.create({ title: "Messages JSON is invalid", type: "error" });
      return;
    }
    setIsImporting(true);
    try {
      await axiosInstance.post(`${baseUrl}/source-grants/${activeGrant.id}/import-latest`, { messages });
      await loadAll();
      toaster.create({ title: "Latest messages imported", type: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      toaster.create({ title: "Import failed", description: message, type: "error" });
    } finally {
      setIsImporting(false);
    }
  };

  const importFromSource = async () => {
    if (!activeGrant) return;
    setIsImportingFromSource(true);
    try {
      await axiosInstance.post(`${baseUrl}/source-grants/${activeGrant.id}/import-from-source`, {
        adapter: "switchboard_gmail_v1",
        limit: 5,
      });
      await loadAll();
      toaster.create({ title: "Latest Gmail messages imported", type: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gmail import failed";
      toaster.create({ title: "Gmail import failed", description: message, type: "error" });
    } finally {
      setIsImportingFromSource(false);
    }
  };

  const verifyName = async (thing: ProvisionalThing) => {
    const preferredName = (editingNames[thing.id] ?? thing.preferred_name).trim();
    if (!preferredName) {
      toaster.create({ title: "Preferred name is required", type: "error" });
      return;
    }
    try {
      await axiosInstance.patch(`${baseUrl}/provisional-things/${thing.id}/verify-name`, {
        preferred_name: preferredName,
      });
      await loadAll();
      toaster.create({ title: "Name verified", type: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to verify name";
      toaster.create({ title: "Verification failed", description: message, type: "error" });
    }
  };

  const openEmailModal = async (evidence: SourceEvidence, thingId: string) => {
    setEmailModal({ open: true, evidence, thingId, loading: true, data: null });
    try {
      const res = await axiosInstance.get<RawEmailData>(`${baseUrl}/source-evidence/${evidence.id}/raw-message`);
      setEmailModal((prev) => ({ ...prev, loading: false, data: res.data }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch email";
      toaster.create({ title: "Email fetch failed", description: message, type: "error" });
      setEmailModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const verifyNameFromModal = async () => {
    if (!emailModal.thingId) return;
    const thing = recruiterSet?.memberships.find((m) => m.provisional_thing.id === emailModal.thingId)?.provisional_thing;
    if (!thing) return;
    await verifyName(thing);
    setEmailModal((prev) => ({ ...prev, open: false }));
  };

  const verifiedMembers = useMemo(
    () => (recruiterSet?.memberships ?? []).filter((m) => m.provisional_thing.name_status === "ready"),
    [recruiterSet],
  );
  const pendingMembers = useMemo(
    () => (recruiterSet?.memberships ?? []).filter((m) => m.provisional_thing.name_status !== "ready"),
    [recruiterSet],
  );

  return (
    <VStack className="rsw-root" align="stretch" gap={5}>
      <Box className="rsw-intro">
        <Text fontSize="xl" fontWeight="bold">Recruiter Source to Working Set</Text>
        <Text color="gray.600" fontSize="sm" maxW="780px">
          First slice: bounded Gmail-like source metadata becomes provisional person records in a Working Set.
          Google imports use a read-only Source Grant; the manual latest-5 adapter remains for local smoke testing.
        </Text>
      </Box>

      <Card.Root className="rsw-source-card" variant="outline">
        <Card.Body>
          <VStack align="stretch" gap={4}>
            <HStack justify="space-between" align="start">
              <Box>
                <Text fontWeight="semibold">Source Boundary</Text>
                <Text color="gray.600" fontSize="sm">
                  Connection first, then Source Grant. Switchboard will enforce the final Gmail label boundary.
                </Text>
              </Box>
              {isLoading ? <Spinner size="sm" /> : null}
            </HStack>

            <HStack gap={3} wrap="wrap">
              <Badge colorPalette={activeConnection ? "green" : "gray"}>
                {activeConnection ? `Connection: ${activeConnection.display_name}` : "No connection"}
              </Badge>
              <Badge colorPalette={activeGrant ? "green" : "gray"}>
                {activeGrant ? `Grant: ${activeGrant.display_name}` : "No Source Grant"}
              </Badge>
            </HStack>

            <HStack gap={3} align="end" wrap="wrap">
              <Button size="sm" onClick={startGoogleOAuth} loading={isConnectingGoogle}>
                Connect Google Mail
              </Button>
              <Button size="sm" variant="outline" onClick={createConnection} disabled={!!activeConnection}>
                Create manual Google connection
              </Button>
              <Box className="rsw-label-picker" minW={{ base: "full", md: "260px" }}>
                <Text fontSize="xs" color="gray.500" mb={1}>Gmail label / folder</Text>
                {gmailLabels.length > 0 ? (
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      value={selectedLabelId}
                      onChange={(event) => {
                        const nextLabel = gmailLabels.find((label) => label.id === event.target.value);
                        setSelectedLabelId(event.target.value);
                        if (nextLabel) setResourceName(nextLabel.name);
                      }}
                    >
                      {gmailLabels.map((label) => (
                        <option key={label.id} value={label.id}>
                          {label.name}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                ) : (
                  <Input size="sm" value={resourceName} onChange={(event) => setResourceName(event.target.value)} />
                )}
              </Box>
              <Button size="sm" onClick={createGrant} disabled={!activeConnection}>
                Create Source Grant
              </Button>
              <Button size="sm" variant="outline" loading={isImportingFromSource} disabled={!activeGrant} onClick={importFromSource}>
                Import from Gmail
              </Button>
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>

      <Card.Root className="rsw-import-card" variant="outline">
        <Card.Body>
          <VStack align="stretch" gap={3}>
            <HStack justify="space-between" align="center">
              <Box>
                <Text fontWeight="semibold">Manual latest-5 adapter</Text>
                <Text color="gray.600" fontSize="sm">
                  Paste up to five Gmail-shaped messages. Full bodies are not retained; only bounded signature evidence is stored when useful.
                </Text>
              </Box>
              <Button size="sm" loading={isImporting} disabled={!activeGrant} onClick={importLatest}>
                Import latest 5
              </Button>
            </HStack>
            <Textarea
              fontFamily="mono"
              fontSize="xs"
              minH="220px"
              value={messagesJson}
              onChange={(event) => setMessagesJson(event.target.value)}
            />
          </VStack>
        </Card.Body>
      </Card.Root>

      <Card.Root className="rsw-working-set-card" variant="outline">
        <Card.Body>
          <VStack align="stretch" gap={4}>
            <HStack justify="space-between">
              <Box>
                <Text fontWeight="semibold">{recruiterSet?.title || "Working Set"}</Text>
                <Text color="gray.600" fontSize="sm">
                  Ready {recruiterSet?.summary?.ready || 0} / Needs review {recruiterSet?.summary?.needs_review || 0} / Total {recruiterSet?.summary?.total || 0}
                </Text>
              </Box>
              <Button size="sm" variant="outline" onClick={loadAll}>Refresh</Button>
            </HStack>

            <Separator />

            {!recruiterSet || recruiterSet.memberships.length === 0 ? (
              <Text color="gray.500" fontSize="sm">No provisional people yet.</Text>
            ) : (
              <VStack align="stretch" gap={4}>
                {verifiedMembers.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="green.700" mb={2}>
                      Confirmed — {verifiedMembers.length}
                    </Text>
                    <MemberTable
                      memberships={verifiedMembers}
                      editingNames={editingNames}
                      setEditingNames={setEditingNames}
                      baseUrl={baseUrl}
                      onVerify={verifyName}
                      onSeeEmail={openEmailModal}
                    />
                  </Box>
                )}
                {pendingMembers.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>
                      Pending Review — {pendingMembers.length}
                    </Text>
                    <MemberTable
                      memberships={pendingMembers}
                      editingNames={editingNames}
                      setEditingNames={setEditingNames}
                      baseUrl={baseUrl}
                      onVerify={verifyName}
                      onSeeEmail={openEmailModal}
                    />
                  </Box>
                )}
              </VStack>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>

      <DialogRoot open={emailModal.open} onOpenChange={(e) => { if (!e.open) setEmailModal((prev) => ({ ...prev, open: false })); }} size="xl">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {emailModal.loading ? (
              <HStack justify="center" py={6}><Spinner /></HStack>
            ) : emailModal.data ? (
              <VStack align="stretch" gap={3}>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">From</Text>
                  <Text fontSize="sm">{emailModal.data.from_header}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">Subject</Text>
                  <Text fontSize="sm">{emailModal.data.subject}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">Date</Text>
                  <Text fontSize="sm">{emailModal.data.sent_at}</Text>
                </Box>
                <Separator />
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide" mb={2}>Body</Text>
                  <Box p={3} bg="gray.50" borderRadius="md" maxH="340px" overflowY="auto">
                    <Text fontSize="sm" whiteSpace="pre-wrap" fontFamily="mono">{emailModal.data.body}</Text>
                  </Box>
                </Box>
                <Separator />
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1}>Confirm name for this contact</Text>
                  <Input
                    size="sm"
                    value={emailModal.thingId ? (editingNames[emailModal.thingId] ?? recruiterSet?.memberships.find((m) => m.provisional_thing.id === emailModal.thingId)?.provisional_thing.preferred_name ?? "") : ""}
                    onChange={(event) => {
                      if (emailModal.thingId) setEditingNames((prev) => ({ ...prev, [emailModal.thingId!]: event.target.value }));
                    }}
                    placeholder="Preferred name"
                  />
                </Box>
              </VStack>
            ) : (
              <Text color="gray.500" fontSize="sm">No email data available.</Text>
            )}
          </DialogBody>
          <DialogFooter>
            <Button size="sm" onClick={verifyNameFromModal} disabled={emailModal.loading || !emailModal.data}>
              Verify &amp; Confirm
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </VStack>
  );
}


function MemberTable({
  memberships,
  editingNames,
  setEditingNames,
  baseUrl: _baseUrl,
  onVerify,
  onSeeEmail,
}: {
  memberships: WorkingSetMembership[];
  editingNames: Record<string, string>;
  setEditingNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  baseUrl: string;
  onVerify: (thing: ProvisionalThing) => void;
  onSeeEmail: (evidence: SourceEvidence, thingId: string) => void;
}) {
  return (
    <Box overflowX="auto">
      <Table.Root size="sm" variant="outline">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Email</Table.ColumnHeader>
            <Table.ColumnHeader>Name Source</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader>Evidence</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {memberships.map((membership) => {
            const thing = membership.provisional_thing;
            const evidence = thing.evidence[0];
            return (
              <Table.Row key={membership.id}>
                <Table.Cell>
                  <HStack gap={1}>
                    <Button size="xs" variant="outline" onClick={() => onVerify(thing)}>
                      Verify
                    </Button>
                    {evidence?.provider_message_id ? (
                      <Button size="xs" variant="ghost" onClick={() => onSeeEmail(evidence, thing.id)}>
                        See Email
                      </Button>
                    ) : null}
                  </HStack>
                </Table.Cell>
                <Table.Cell minW="200px">
                  <Input
                    size="sm"
                    value={editingNames[thing.id] ?? thing.preferred_name}
                    onChange={(event) => setEditingNames((prev) => ({ ...prev, [thing.id]: event.target.value }))}
                    placeholder="Preferred name"
                  />
                </Table.Cell>
                <Table.Cell>{thing.email || "No email"}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={thing.name_confidence === "high" ? "green" : thing.name_confidence === "medium" ? "yellow" : "red"}>
                    {thing.name_source} / {thing.name_confidence}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{thing.name_status}</Table.Cell>
                <Table.Cell minW="240px">
                  <Text fontSize="xs" color="gray.600">{evidence?.subject || "No subject"}</Text>
                  {evidence?.bounded_excerpt ? (
                    <Box mt={1} p={2} bg="gray.50" borderRadius="md">
                      <Text fontSize="xs" whiteSpace="pre-wrap">{evidence.bounded_excerpt}</Text>
                    </Box>
                  ) : null}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

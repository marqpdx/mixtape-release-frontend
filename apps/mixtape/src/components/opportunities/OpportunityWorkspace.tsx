"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Container,
  Field,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Link,
  NativeSelect,
  Spinner,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import {
  BriefcaseBusiness,
  Check,
  ExternalLink,
  FileText,
  Link2,
  Plus,
  RefreshCw,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { OpportunityApplicationDrawer } from "./OpportunityApplicationDrawer";
import type { ApplicationOpportunity } from "./OpportunityApplicationDrawer";

type QueryLane = {
  id: string;
  label: string;
  keyword: string;
  enabled: boolean;
};

type OpportunityProfile = {
  id?: string;
  version?: number;
  name: string;
  resume_label: string;
  resume_version: string;
  resume_asset?: ResumeAsset | null;
  resume_asset_id?: string | null;
  query_lanes: QueryLane[];
  target_roles: string[];
  geography: string[];
  workplace_types: string[];
  employment_types: string[];
  seniority: string[];
  strong_domains: string[];
  strong_technologies: string[];
  exclusions: string[];
  freshness_hours: 24 | 72 | 168;
  preferences: Record<string, unknown>;
};

type ResumeAsset = {
  id: string;
  type: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  upload_status: "queued" | "completed" | "failed";
  privacy: string;
};

type ProfileAssetRecord = {
  id: string;
  title: string;
  asset: ResumeAsset;
};

type PlannedQuery = {
  lane_id: string;
  lane_label: string;
  arguments: Record<string, unknown>;
};

type Opportunity = {
  id: string;
  state: "new" | "reviewing" | "interesting" | "rejected";
  confidence: number | null;
  source_url: string;
  observed_at: string | null;
  payload: {
    title?: string;
    organization?: string;
    description?: string;
    arrangement?: string;
    required_location?: string;
    engagement_type?: string;
    salary?: string;
    skills?: string[];
    application_action?: string;
    application_method?: string;
    application_url?: string;
    easy_apply?: boolean;
    employer_type?: string;
    recruiter_name?: string;
    contact_email?: string;
    contact_email_status?: string;
    validation_status?: string;
    detail_acquired_at?: string;
    preliminary_fit?: {
      label?: "promising" | "review" | "caution";
      matched_terms?: string[];
      concerns?: string[];
    };
  };
};

type SearchRun = {
  id: string;
  title: string;
  summary: { observations_seen?: number; materialized?: number };
  execution_metadata: {
    query_results?: Array<{ lane_label: string; returned: number; available?: number }>;
    profile_version?: number;
    acquisition_mode?: "profile_search" | "ad_hoc_query" | "direct_url";
    ad_hoc_query?: string;
  };
  opportunities: Array<{ id: string; opportunity: Opportunity }>;
  created_at: string;
};

const emptyProfile: OpportunityProfile = {
  name: "Current opportunity profile",
  resume_label: "",
  resume_version: "",
  resume_asset: null,
  resume_asset_id: null,
  query_lanes: [{ id: "primary", label: "Primary search", keyword: "", enabled: true }],
  target_roles: [],
  geography: ["United States"],
  workplace_types: ["Remote"],
  employment_types: ["CONTRACTS", "FULLTIME"],
  seniority: [],
  strong_domains: [],
  strong_technologies: [],
  exclusions: [],
  freshness_hours: 72,
  preferences: { results_per_lane: 10 },
};

const WORKPLACE_OPTIONS = ["Remote", "Hybrid", "On-Site"];
const EMPLOYMENT_OPTIONS = [
  ["FULLTIME", "Full-time"],
  ["CONTRACTS", "Contract"],
  ["PARTTIME", "Part-time"],
  ["THIRD_PARTY", "Third-party"],
];

const csv = (values: string[]) => values.join(", ");
const fromCsv = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
const delay = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export function OpportunityWorkspace() {
  const [profile, setProfile] = useState<OpportunityProfile>(emptyProfile);
  const [hasProfile, setHasProfile] = useState(false);
  const [editing, setEditing] = useState(true);
  const [queries, setQueries] = useState<PlannedQuery[]>([]);
  const [runs, setRuns] = useState<SearchRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [busyCandidate, setBusyCandidate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disclosure, setDisclosure] = useState("");
  const [applicationOpportunity, setApplicationOpportunity] = useState<ApplicationOpportunity | null>(null);
  const [adHocQuery, setAdHocQuery] = useState("");
  const [diceURL, setDiceURL] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [resumeAssets, setResumeAssets] = useState<ProfileAssetRecord[]>([]);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const refreshResumeAssets = useCallback(async (memberProfileId: string) => {
    const response = await axiosInstance.get(
      `/api/assets/managed/list?sponsor_type=profile&sponsor_id=${memberProfileId}`,
    );
    const records = (response.data as ProfileAssetRecord[]).filter(isPDFAsset);
    setResumeAssets(records);
    setProfile((current) => {
      const selected = records.find((record) => record.asset.id === current.resume_asset_id);
      return selected ? { ...current, resume_asset: selected.asset } : current;
    });
    return records;
  }, []);

  const loadWorkspace = useCallback(async () => {
    setError(null);
    try {
      const [profileResponse, runsResponse, memberResponse] = await Promise.all([
        axiosInstance.get("/api/opportunities/profile"),
        axiosInstance.get("/api/opportunities/search-runs"),
        axiosInstance.get("/api/members/me"),
      ]);
      const savedProfile = profileResponse.data.profile as OpportunityProfile | null;
      const nextRuns = runsResponse.data.runs as SearchRun[];
      const nextProfileId = String(memberResponse.data.profile_id || "");
      setProfileId(nextProfileId || null);
      if (nextProfileId) {
        await refreshResumeAssets(nextProfileId);
      }
      if (savedProfile) {
        setProfile(withResumeAssetId(savedProfile));
        setHasProfile(true);
        setEditing(false);
        const planResponse = await axiosInstance.get("/api/opportunities/query-plan");
        setQueries(planResponse.data.queries ?? []);
      }
      setRuns(nextRuns);
      setSelectedRunId((current) => current ?? nextRuns[0]?.id ?? null);
      setDisclosure(runsResponse.data.disclosure ?? "");
    } catch (requestError) {
      setError(apiError(requestError, "Could not load the opportunity workspace."));
    } finally {
      setLoading(false);
    }
  }, [refreshResumeAssets]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null,
    [runs, selectedRunId],
  );

  const visibleOpportunities = useMemo(
    () => selectedRun?.opportunities.filter(({ opportunity }) => opportunity.state !== "rejected") ?? [],
    [selectedRun],
  );

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await axiosInstance.put("/api/opportunities/profile", profile);
      setProfile(withResumeAssetId(response.data.profile));
      setHasProfile(true);
      setEditing(false);
      const planResponse = await axiosInstance.get("/api/opportunities/query-plan");
      setQueries(planResponse.data.queries ?? []);
    } catch (requestError) {
      setError(apiError(requestError, "Could not save the opportunity profile."));
    } finally {
      setSaving(false);
    }
  };

  const addRun = (run: SearchRun) => {
    setRuns((current) => [run, ...current.filter((item) => item.id !== run.id)]);
    setSelectedRunId(run.id);
  };

  const runSearch = async (query = "") => {
    setSearching(true);
    setError(null);
    try {
      const response = await axiosInstance.post("/api/opportunities/search-runs", query ? { query } : {});
      const run = response.data.run as SearchRun;
      addRun(run);
      if (query) setAdHocQuery("");
      setDisclosure(response.data.disclosure ?? disclosure);
    } catch (requestError) {
      setError(apiError(requestError, "Dice search could not be completed."));
    } finally {
      setSearching(false);
    }
  };

  const importDiceURL = async () => {
    setImporting(true);
    setError(null);
    try {
      const response = await axiosInstance.post("/api/opportunities/imports/dice-url", { url: diceURL });
      addRun(response.data.run as SearchRun);
      setDiceURL("");
      setDisclosure(response.data.disclosure ?? disclosure);
    } catch (requestError) {
      setError(apiError(requestError, "The Dice opportunity could not be added."));
    } finally {
      setImporting(false);
    }
  };

  const uploadResume = async (file: File) => {
    if (!profileId) {
      setError("Your member profile is required before uploading a résumé.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Upload the résumé as a PDF.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("The résumé must be no larger than Dice's 2 MB limit.");
      return;
    }
    setUploadingResume(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", "document");
      form.append("privacy", "admins");
      form.append("folder_path", "resumes");
      form.append("title", file.name);
      const response = await axiosInstance.post(
        `/api/assets/managed/upload?sponsor_type=profile&sponsor_id=${profileId}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const record = response.data as ProfileAssetRecord;
      setResumeAssets((current) => [record, ...current.filter((item) => item.asset.id !== record.asset.id)]);
      setProfile((current) => ({
        ...current,
        resume_asset: record.asset,
        resume_asset_id: record.asset.id,
        resume_label: current.resume_label || file.name.replace(/\.pdf$/i, ""),
      }));
      if (record.asset.upload_status === "queued") {
        for (let attempt = 0; attempt < 8; attempt += 1) {
          await delay(1500);
          const records = await refreshResumeAssets(profileId);
          const uploaded = records.find((item) => item.asset.id === record.asset.id);
          if (!uploaded || uploaded.asset.upload_status !== "queued") break;
        }
      }
    } catch (requestError) {
      setError(apiError(requestError, "The résumé could not be uploaded."));
    } finally {
      setUploadingResume(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  };

  const previewResume = async (assetId: string) => {
    try {
      const response = await axiosInstance.get(`/api/assets/managed/${assetId}/presign`);
      window.open(response.data.url, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      setError(apiError(requestError, "The résumé preview could not be opened."));
    }
  };

  const updateOpportunity = async (opportunityId: string, state: Opportunity["state"]) => {
    setBusyCandidate(opportunityId);
    try {
      const response = await axiosInstance.patch(
        `/api/opportunities/candidates/${opportunityId}/state`,
        { state },
      );
      if (response.data.run) replaceRun(response.data.run);
    } catch (requestError) {
      setError(apiError(requestError, "Could not update the opportunity."));
    } finally {
      setBusyCandidate(null);
    }
  };

  const acquireDetails = async (opportunityId: string) => {
    setBusyCandidate(opportunityId);
    try {
      const response = await axiosInstance.post(`/api/opportunities/candidates/${opportunityId}/details`, {});
      replaceRun(response.data.run);
    } catch (requestError) {
      setError(apiError(requestError, "Could not retrieve the full Dice listing."));
    } finally {
      setBusyCandidate(null);
    }
  };

  const replaceRun = (run: SearchRun) => {
    setRuns((current) => current.map((item) => (item.id === run.id ? run : item)));
  };

  if (loading) {
    return (
      <Flex className="opws-loading" minH="55vh" align="center" justify="center">
        <Spinner size="lg" />
      </Flex>
    );
  }

  return (
    <Box className="opws-root" minH="100vh" bg="bg.subtle">
      <Box className="opws-header" bg="bg" borderBottomWidth="1px">
        <Container maxW="7xl" py={{ base: 6, md: 8 }}>
          <Flex justify="space-between" align={{ base: "start", md: "center" }} gap={5} wrap="wrap">
            <Box>
              <HStack gap={3} mb={2}>
                <BriefcaseBusiness size={24} aria-hidden />
                <Heading size="2xl">Opportunities</Heading>
              </HStack>
              <Text color="fg.muted">A current, reviewable view of work worth your attention.</Text>
            </Box>
            <Button
              colorPalette="teal"
              onClick={() => void runSearch()}
              loading={searching}
              disabled={!hasProfile || editing || queries.length === 0}
            >
              <Search size={17} />
              Search Dice
            </Button>
          </Flex>
        </Container>
      </Box>

      <Container className="opws-content" maxW="7xl" py={8}>
        {error && (
          <Box borderLeftWidth="3px" borderColor="red.500" bg="red.subtle" px={4} py={3} mb={6}>
            <Text color="red.fg">{error}</Text>
          </Box>
        )}

        <Box className="opws-acquisition" bg="bg" borderWidth="1px" p={{ base: 4, md: 5 }} mb={8}>
          <Flex justify="space-between" align="center" mb={4} gap={4} wrap="wrap">
            <Box>
              <Heading size="md">Find or add an opportunity</Heading>
              <Text fontSize="sm" color="fg.muted" mt={1}>Use a focused one-off query or bring in a listing you already found.</Text>
            </Box>
            {!hasProfile && <Badge colorPalette="orange">Save a Search Profile first</Badge>}
          </Flex>
          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={5}>
            <Field.Root>
              <Field.Label>Quick Dice search</Field.Label>
              <HStack align="stretch">
                <Input value={adHocQuery} onChange={(event) => setAdHocQuery(event.target.value)} placeholder="python AND typescript AND ai" />
                <Button
                  variant="outline"
                  onClick={() => void runSearch(adHocQuery)}
                  loading={searching && !!adHocQuery}
                  disabled={!hasProfile || editing || !adHocQuery.trim()}
                >
                  <Search size={16} /> Search
                </Button>
              </HStack>
            </Field.Root>
            <Field.Root>
              <Field.Label>Add Dice URL</Field.Label>
              <HStack align="stretch">
                <Input value={diceURL} onChange={(event) => setDiceURL(event.target.value)} placeholder="https://www.dice.com/job-detail/..." />
                <Button
                  variant="outline"
                  onClick={() => void importDiceURL()}
                  loading={importing}
                  disabled={!hasProfile || editing || !diceURL.trim()}
                >
                  <Link2 size={16} /> Add
                </Button>
              </HStack>
            </Field.Root>
          </Grid>
        </Box>

        <Grid className="opws-layout" templateColumns={{ base: "1fr", lg: "minmax(300px, 380px) minmax(0, 1fr)" }} gap={8}>
          <Stack className="opws-profile-rail" gap={6}>
            <Box bg="bg" borderWidth="1px" p={5}>
              <Flex justify="space-between" align="center" mb={5}>
                <Box>
                  <Text fontSize="xs" color="fg.muted" textTransform="uppercase">Search profile</Text>
                  <Heading size="md">{hasProfile ? `Version ${profile.version}` : "Not configured"}</Heading>
                </Box>
                {hasProfile && !editing && (
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    <SlidersHorizontal size={15} /> Edit
                  </Button>
                )}
              </Flex>

              {editing ? (
                <ProfileEditor
                  profile={profile}
                  resumeAssets={resumeAssets}
                  resumeInputRef={resumeInputRef}
                  uploadingResume={uploadingResume}
                  onUploadResume={uploadResume}
                  onPreviewResume={previewResume}
                  onChange={setProfile}
                  onSave={saveProfile}
                  saving={saving}
                />
              ) : (
                <ProfileSummary profile={profile} onPreviewResume={previewResume} />
              )}
            </Box>

            {hasProfile && !editing && (
              <Box bg="bg" borderWidth="1px" p={5}>
                <Text fontSize="xs" color="fg.muted" textTransform="uppercase" mb={3}>Next search</Text>
                <Stack gap={3}>
                  {queries.map((query) => (
                    <Box key={query.lane_id} borderLeftWidth="2px" borderColor="teal.500" pl={3}>
                      <Text fontWeight="semibold" fontSize="sm">{query.lane_label}</Text>
                      <Text fontSize="sm" color="fg.muted">{String(query.arguments.keyword)}</Text>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>

          <Stack className="opws-results" gap={6} minW={0}>
            <Flex className="opws-run-toolbar" justify="space-between" align="end" gap={4} wrap="wrap">
              <Box>
                <Text fontSize="xs" color="fg.muted" textTransform="uppercase">Working set</Text>
                <Heading size="lg">{selectedRun?.title ?? "No searches yet"}</Heading>
              </Box>
              {runs.length > 0 && (
                <NativeSelect.Root size="sm" width={{ base: "100%", md: "300px" }}>
                  <NativeSelect.Field value={selectedRunId ?? ""} onChange={(event) => setSelectedRunId(event.target.value)}>
                    {runs.map((run) => (
                      <option key={run.id} value={run.id}>{run.title}</option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              )}
            </Flex>

            {!selectedRun ? (
              <Box className="opws-empty" borderWidth="1px" borderStyle="dashed" bg="bg" p={{ base: 8, md: 12 }} textAlign="center">
                <BriefcaseBusiness size={28} style={{ margin: "0 auto 12px" }} aria-hidden />
                <Heading size="md" mb={2}>Begin with a search profile</Heading>
                <Text color="fg.muted">Save the roles and constraints that matter, inspect the planned searches, then run Dice.</Text>
              </Box>
            ) : (
              <>
                <HStack gap={2} wrap="wrap">
                  <Badge variant="subtle">{selectedRun.summary.materialized ?? 0} findings</Badge>
                  {(selectedRun.execution_metadata.query_results ?? []).map((result) => (
                    <Badge key={result.lane_label} variant="outline">
                      {result.lane_label}: {result.returned}
                    </Badge>
                  ))}
                </HStack>

                <Stack className="opws-opportunity-list" gap={0} bg="bg" borderWidth="1px">
                  {visibleOpportunities.length === 0 ? (
                    <Box p={8}><Text color="fg.muted">This search returned no reviewable opportunities.</Text></Box>
                  ) : visibleOpportunities.map(({ opportunity }, index) => (
                    <OpportunityRow
                      key={opportunity.id}
                      opportunity={opportunity}
                      isLast={index === visibleOpportunities.length - 1}
                      busy={busyCandidate === opportunity.id}
                      onState={updateOpportunity}
                      onDetails={acquireDetails}
                      onPrepare={(opportunity) => setApplicationOpportunity(opportunity)}
                    />
                  ))}
                </Stack>
                {disclosure && <Text fontSize="xs" color="fg.muted">{disclosure}</Text>}
              </>
            )}
          </Stack>
        </Grid>
      </Container>
      <OpportunityApplicationDrawer
        opportunity={applicationOpportunity}
        onClose={() => setApplicationOpportunity(null)}
      />
    </Box>
  );
}

function ProfileEditor({
  profile,
  resumeAssets,
  resumeInputRef,
  uploadingResume,
  onUploadResume,
  onPreviewResume,
  onChange,
  onSave,
  saving,
}: {
  profile: OpportunityProfile;
  resumeAssets: ProfileAssetRecord[];
  resumeInputRef: RefObject<HTMLInputElement | null>;
  uploadingResume: boolean;
  onUploadResume: (file: File) => void;
  onPreviewResume: (assetId: string) => void;
  onChange: (profile: OpportunityProfile) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const update = <K extends keyof OpportunityProfile>(key: K, value: OpportunityProfile[K]) => {
    onChange({ ...profile, [key]: value });
  };
  const toggleListValue = (key: "workplace_types" | "employment_types", value: string) => {
    const current = profile[key];
    update(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };
  const updateLane = (index: number, changes: Partial<QueryLane>) => {
    update("query_lanes", profile.query_lanes.map((lane, laneIndex) => laneIndex === index ? { ...lane, ...changes } : lane));
  };

  return (
    <Stack gap={5}>
      <Box className="opws-resume-assets" borderWidth="1px" p={4}>
        <Flex justify="space-between" align="center" gap={3} mb={3}>
          <Box>
            <Text fontWeight="semibold" fontSize="sm">Managed résumé</Text>
            <Text fontSize="xs" color="fg.muted">PDF · maximum 2 MB</Text>
          </Box>
          <Button size="sm" variant="outline" onClick={() => resumeInputRef.current?.click()} loading={uploadingResume}>
            <Upload size={15} /> Upload PDF
          </Button>
          <input
            ref={resumeInputRef}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUploadResume(file);
            }}
          />
        </Flex>
        <NativeSelect.Root size="sm">
          <NativeSelect.Field
            value={profile.resume_asset_id ?? ""}
            onChange={(event) => {
              const record = resumeAssets.find((item) => item.asset.id === event.target.value);
              onChange({
                ...profile,
                resume_asset_id: record?.asset.id ?? null,
                resume_asset: record?.asset ?? null,
                resume_label: record && !profile.resume_label
                  ? record.title || record.asset.file_name
                  : profile.resume_label,
              });
            }}
          >
            <option value="">No résumé selected</option>
            {resumeAssets.map((record) => (
              <option key={record.asset.id} value={record.asset.id}>
                {record.title || record.asset.file_name} · {record.asset.upload_status}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        {profile.resume_asset && (
          <HStack mt={3} justify="space-between" gap={3}>
            <HStack gap={2} minW={0}>
              <FileText size={15} aria-hidden />
              <Text fontSize="xs" color="fg.muted" truncate>{profile.resume_asset.file_name}</Text>
            </HStack>
            <Button
              size="xs"
              variant="ghost"
              disabled={profile.resume_asset.upload_status !== "completed"}
              onClick={() => onPreviewResume(profile.resume_asset!.id)}
            >
              <ExternalLink size={13} /> Preview
            </Button>
          </HStack>
        )}
      </Box>
      <Grid templateColumns="1fr 90px" gap={3}>
        <Field.Root>
          <Field.Label>Résumé</Field.Label>
          <Input value={profile.resume_label} onChange={(event) => update("resume_label", event.target.value)} placeholder="Canonical résumé" />
        </Field.Root>
        <Field.Root>
          <Field.Label>Version</Field.Label>
          <Input value={profile.resume_version} onChange={(event) => update("resume_version", event.target.value)} placeholder="0.4.2" />
        </Field.Root>
      </Grid>

      <Box>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontWeight="medium" fontSize="sm">Search lanes</Text>
          <Button size="xs" variant="ghost" onClick={() => update("query_lanes", [
            ...profile.query_lanes,
            { id: `lane-${Date.now()}`, label: "", keyword: "", enabled: true },
          ])}>
            <Plus size={14} /> Add
          </Button>
        </Flex>
        <Stack gap={3}>
          {profile.query_lanes.map((lane, index) => (
            <Box key={lane.id} borderWidth="1px" p={3}>
              <HStack mb={2}>
                <Input size="sm" value={lane.label} onChange={(event) => updateLane(index, { label: event.target.value })} placeholder="Lane name" />
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Remove search lane"
                  disabled={profile.query_lanes.length === 1}
                  onClick={() => update("query_lanes", profile.query_lanes.filter((_, laneIndex) => laneIndex !== index))}
                >
                  <Trash2 size={15} />
                </Button>
              </HStack>
              <Input size="sm" value={lane.keyword} onChange={(event) => updateLane(index, { keyword: event.target.value })} placeholder="Job title and skills" />
            </Box>
          ))}
        </Stack>
      </Box>

      <Field.Root>
        <Field.Label>Target roles</Field.Label>
        <Textarea defaultValue={csv(profile.target_roles)} onBlur={(event) => update("target_roles", fromCsv(event.target.value))} autoresize placeholder="Staff Python Engineer, Founding Engineer" />
      </Field.Root>
      <Field.Root>
        <Field.Label>Seniority</Field.Label>
        <Input defaultValue={csv(profile.seniority)} onBlur={(event) => update("seniority", fromCsv(event.target.value))} placeholder="Senior, Staff, Principal, Founding" />
      </Field.Root>
      <Field.Root>
        <Field.Label>Strong technologies</Field.Label>
        <Textarea defaultValue={csv(profile.strong_technologies)} onBlur={(event) => update("strong_technologies", fromCsv(event.target.value))} autoresize placeholder="Python, Django, FastAPI" />
      </Field.Root>
      <Field.Root>
        <Field.Label>Strong domains</Field.Label>
        <Textarea defaultValue={csv(profile.strong_domains)} onBlur={(event) => update("strong_domains", fromCsv(event.target.value))} autoresize placeholder="AI platforms, knowledge systems" />
      </Field.Root>
      <Field.Root>
        <Field.Label>Avoid</Field.Label>
        <Textarea defaultValue={csv(profile.exclusions)} onBlur={(event) => update("exclusions", fromCsv(event.target.value))} autoresize placeholder="ML research, computer vision" />
      </Field.Root>

      <Box>
        <Text fontWeight="medium" fontSize="sm" mb={2}>Workplace</Text>
        <HStack gap={4} wrap="wrap">
          {WORKPLACE_OPTIONS.map((option) => (
            <Checkbox.Root key={option} checked={profile.workplace_types.includes(option)} onCheckedChange={() => toggleListValue("workplace_types", option)}>
              <Checkbox.HiddenInput /><Checkbox.Control /><Checkbox.Label>{option}</Checkbox.Label>
            </Checkbox.Root>
          ))}
        </HStack>
      </Box>
      <Box>
        <Text fontWeight="medium" fontSize="sm" mb={2}>Engagement</Text>
        <HStack gap={4} wrap="wrap">
          {EMPLOYMENT_OPTIONS.map(([value, label]) => (
            <Checkbox.Root key={value} checked={profile.employment_types.includes(value)} onCheckedChange={() => toggleListValue("employment_types", value)}>
              <Checkbox.HiddenInput /><Checkbox.Control /><Checkbox.Label>{label}</Checkbox.Label>
            </Checkbox.Root>
          ))}
        </HStack>
      </Box>
      <Field.Root>
        <Field.Label>Posted within</Field.Label>
        <NativeSelect.Root>
          <NativeSelect.Field value={profile.freshness_hours} onChange={(event) => update("freshness_hours", Number(event.target.value) as 24 | 72 | 168)}>
            <option value={24}>24 hours</option>
            <option value={72}>3 days</option>
            <option value={168}>7 days</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Field.Root>
      <Button colorPalette="teal" onClick={onSave} loading={saving} disabled={!profile.query_lanes.some((lane) => lane.keyword.trim())}>
        <Save size={16} /> Save profile
      </Button>
    </Stack>
  );
}

function ProfileSummary({ profile, onPreviewResume }: {
  profile: OpportunityProfile;
  onPreviewResume: (assetId: string) => void;
}) {
  return (
    <Stack gap={4}>
      <Box>
        <Text fontSize="xs" color="fg.muted">Résumé</Text>
        <Text>{profile.resume_label || "Not linked"}{profile.resume_version ? ` · ${profile.resume_version}` : ""}</Text>
        {profile.resume_asset && (
          <Button
            size="xs"
            variant="ghost"
            mt={1}
            disabled={profile.resume_asset.upload_status !== "completed"}
            onClick={() => onPreviewResume(profile.resume_asset!.id)}
          >
            <FileText size={13} /> {profile.resume_asset.file_name}
          </Button>
        )}
      </Box>
      <Box>
        <Text fontSize="xs" color="fg.muted">Search lanes</Text>
        <Stack gap={1} mt={1}>{profile.query_lanes.map((lane) => <Text key={lane.id} fontSize="sm">{lane.label || lane.keyword}</Text>)}</Stack>
      </Box>
      <Box>
        <Text fontSize="xs" color="fg.muted">Signals</Text>
        <Text fontSize="sm">{[...profile.strong_domains, ...profile.strong_technologies].join(", ") || "None set"}</Text>
      </Box>
      <Box>
        <Text fontSize="xs" color="fg.muted">Constraints</Text>
        <Text fontSize="sm">{profile.workplace_types.join(", ")} · {profile.employment_types.join(", ")} · {profile.freshness_hours}h</Text>
      </Box>
    </Stack>
  );
}

function OpportunityRow({ opportunity, isLast, busy, onState, onDetails, onPrepare }: {
  opportunity: Opportunity;
  isLast: boolean;
  busy: boolean;
  onState: (id: string, state: Opportunity["state"]) => void;
  onDetails: (id: string) => void;
  onPrepare: (opportunity: Opportunity) => void;
}) {
  const fit = opportunity.payload.preliminary_fit;
  const fitColor = fit?.label === "promising" ? "green" : fit?.label === "caution" ? "orange" : "gray";
  return (
    <Box className="opws-opportunity-row" p={{ base: 4, md: 5 }} borderBottomWidth={isLast ? "0" : "1px"} opacity={busy ? 0.6 : 1}>
      <Flex justify="space-between" align="start" gap={5} wrap={{ base: "wrap", md: "nowrap" }}>
        <Box minW={0} flex={1}>
          <HStack gap={2} mb={1} wrap="wrap">
            <Badge colorPalette={fitColor} variant="subtle">{fit?.label ?? "review"}</Badge>
            <Badge variant="outline">{opportunity.payload.validation_status ?? "unverified"}</Badge>
            {opportunity.payload.easy_apply && <Badge colorPalette="teal" variant="outline">Easy Apply</Badge>}
            {opportunity.payload.employer_type && <Badge variant="outline">{opportunity.payload.employer_type}</Badge>}
            {opportunity.state === "interesting" && <Badge colorPalette="teal"><Check size={12} /> Interesting</Badge>}
          </HStack>
          <Heading size="md" mt={2}>{opportunity.payload.title || "Untitled opportunity"}</Heading>
          <Text fontWeight="medium" color="fg.muted" mt={1}>{opportunity.payload.organization || "Organization not listed"}</Text>
          <HStack gap={3} mt={2} color="fg.muted" fontSize="sm" wrap="wrap">
            {opportunity.payload.arrangement && <Text>{opportunity.payload.arrangement}</Text>}
            {opportunity.payload.engagement_type && <Text>{opportunity.payload.engagement_type}</Text>}
            {opportunity.observed_at && <Text>{new Date(opportunity.observed_at).toLocaleDateString()}</Text>}
          </HStack>
          <Text mt={3} lineClamp={opportunity.payload.detail_acquired_at ? undefined : 3} whiteSpace="pre-line">
            {opportunity.payload.description || "No summary supplied."}
          </Text>
          {(fit?.matched_terms?.length ?? 0) > 0 && (
            <Text mt={3} fontSize="sm" color="fg.muted">Matches: {fit?.matched_terms?.join(", ")}</Text>
          )}
          {(opportunity.payload.skills?.length ?? 0) > 0 && (
            <HStack mt={3} gap={2} wrap="wrap">
              {opportunity.payload.skills?.slice(0, 10).map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}
            </HStack>
          )}
          {opportunity.payload.recruiter_name && (
            <Text mt={3} fontSize="sm" color="fg.muted">Recruiter: {opportunity.payload.recruiter_name}</Text>
          )}
          {opportunity.payload.contact_email && (
            <Text mt={1} fontSize="sm" color="fg.muted">
              Contact: {opportunity.payload.contact_email} · verify before use
            </Text>
          )}
        </Box>
        <Stack minW={{ base: "100%", md: "150px" }} gap={2}>
          <Button size="sm" variant="outline" onClick={() => onState(opportunity.id, "interesting")} disabled={busy || opportunity.state === "interesting"}>
            <Check size={15} /> Keep
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDetails(opportunity.id)} disabled={busy}>
            <RefreshCw size={15} /> {opportunity.payload.detail_acquired_at ? "Refresh details" : "Full details"}
          </Button>
          {opportunity.payload.detail_acquired_at && (
            <Button size="sm" colorPalette="teal" onClick={() => onPrepare(opportunity)} disabled={busy}>
              <Sparkles size={15} /> Prepare application
            </Button>
          )}
          <Button size="sm" variant="ghost" colorPalette="red" onClick={() => onState(opportunity.id, "rejected")} disabled={busy}>
            <Trash2 size={15} /> Pass
          </Button>
          {(opportunity.payload.application_url || opportunity.source_url) && (
            <Link href={opportunity.payload.application_url || opportunity.source_url} target="_blank" rel="noreferrer" fontSize="sm" color="teal.fg" textAlign="center">
              {opportunity.payload.easy_apply ? "Open Easy Apply" : "Open on Dice"} <ExternalLink size={13} style={{ display: "inline" }} />
            </Link>
          )}
        </Stack>
      </Flex>
    </Box>
  );
}

function apiError(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
  }
  return fallback;
}

function withResumeAssetId(profile: OpportunityProfile): OpportunityProfile {
  return { ...profile, resume_asset_id: profile.resume_asset?.id ?? null };
}

function isPDFAsset(record: ProfileAssetRecord): boolean {
  return record.asset.type === "document" && record.asset.file_type === "application/pdf";
}

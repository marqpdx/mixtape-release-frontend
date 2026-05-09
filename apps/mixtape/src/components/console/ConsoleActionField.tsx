"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Field,
  HStack,
  Input,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useOrientation } from "@hooks/console/useConsole";
import {
  AgentCommandResponse,
  confirmAgentCommand,
  createAgentCommand,
} from "@mixtape/api/clients/initiatives/agentCommandsApi";
import {
  createInitiative,
} from "@mixtape/api/clients/initiatives/initiativesApi";

type SupportedVerb = "note" | "remind" | "task" | "workstream";
type ScopeOption = {
  label: string;
  value: string;
  initiativeId?: string;
  sponsorModel?: string;
  sponsorId?: string;
  slug?: string;
};

export type ActiveContext =
  | { kind: "personal" }
  | { kind: "group"; id: string; slug: string; title: string };

const SUPPORTED_VERBS: SupportedVerb[] = ["note", "remind", "task", "workstream"];

const WORKSTREAM_PREFIX = /^\/n\s+(.+)/i;
const CONTEXT_SWITCH_PREFIX = /^\/\/(.+)/;

function isSupportedVerb(value: string): value is SupportedVerb {
  return SUPPORTED_VERBS.includes(value as SupportedVerb);
}

function toDateTimeLocal(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string): string | null {
  if (!value.trim()) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildInitialFields(command: AgentCommandResponse): Record<string, string> {
  const fields = command.fields ?? {};

  if (command.verb === "task") {
    return {
      title: typeof fields.title === "string" ? fields.title : command.title || "",
      details:
        typeof fields.details === "string"
          ? fields.details
          : command.summary || "",
      due_at: toDateTimeLocal(fields.due_at),
    };
  }

  if (command.verb === "remind") {
    return {
      title: typeof fields.title === "string" ? fields.title : command.title || "",
      body:
        typeof fields.body === "string"
          ? fields.body
          : command.summary || command.title || "",
      remind_at: toDateTimeLocal(fields.remind_at),
    };
  }

  return {
    title: typeof fields.title === "string" ? fields.title : command.title || "",
    body:
      typeof fields.body === "string"
        ? fields.body
        : command.summary || command.title || "",
  };
}

function normalizeConfirmFields(
  command: AgentCommandResponse,
  draftFields: Record<string, string>,
): Record<string, unknown> {
  if (command.verb === "task") {
    return {
      title: draftFields.title,
      details: draftFields.details,
      due_at: fromDateTimeLocal(draftFields.due_at),
    };
  }

  if (command.verb === "remind") {
    return {
      title: draftFields.title,
      body: draftFields.body,
      remind_at: fromDateTimeLocal(draftFields.remind_at),
    };
  }

  return {
    title: draftFields.title,
    body: draftFields.body,
  };
}

function ResultSummary({ command }: { command: AgentCommandResponse }) {
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const result = command.result_payload ?? {};
  const objectType = typeof result.object_type === "string" ? result.object_type : "";

  return (
    <VStack align="stretch" gap={2}>
      <HStack gap={2}>
        <Badge colorPalette="green" variant="subtle">
          {command.result_type || "done"}
        </Badge>
        {objectType ? (
          <Text fontSize="sm" color={mutedColor}>
            Created {objectType}
          </Text>
        ) : null}
      </HStack>
      <Text fontSize="sm" color={mutedColor}>
        {command.executed_verb
          ? `Executed ${command.executed_verb}.`
          : "Command executed."}
      </Text>
      {command.routing?.target_screen ? (
        <Text fontSize="xs" color={mutedColor}>
          Routing target: {String(command.routing.target_screen)}
        </Text>
      ) : null}
    </VStack>
  );
}

export function ConsoleActionField({
  onContextSwitch,
}: {
  activeContext?: ActiveContext;
  onContextSwitch?: (ctx: ActiveContext) => void;
} = {}) {
  const [input, setInput] = useState("");
  const [command, setCommand] = useState<AgentCommandResponse | null>(null);
  const [draftFields, setDraftFields] = useState<Record<string, string>>({});
  const [selectedScope, setSelectedScope] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workstreamCreated, setWorkstreamCreated] = useState<{ id: string; title: string } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const workstreamMatch = WORKSTREAM_PREFIX.exec(input.trim());
  const workstreamName = workstreamMatch ? workstreamMatch[1].trim() : null;
  const contextSwitchMatch = CONTEXT_SWITCH_PREFIX.exec(input.trim());
  const contextSwitchQuery = contextSwitchMatch ? contextSwitchMatch[1].trim().toLowerCase() : null;
  const { data: orientation, isLoading: orientationLoading } = useOrientation();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const subtleBg = useColorModeValue("gray.50", "gray.900");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const noScope = !orientationLoading && !orientation?.initiatives?.length && !orientation?.groups?.length;

  const contextSwitchTarget = useMemo(() => {
    if (!contextSwitchQuery) return null;
    return (orientation?.groups ?? []).find(
      (g) => g.title.toLowerCase().includes(contextSwitchQuery) || g.slug.includes(contextSwitchQuery),
    ) ?? null;
  }, [contextSwitchQuery, orientation]);

  const scopeOptions = useMemo<ScopeOption[]>(() => {
    const initiativeItems = (orientation?.initiatives ?? []).map((initiative) => ({
      label: `Initiative: ${initiative.title}`,
      value: `initiative:${initiative.id}`,
      initiativeId: initiative.id,
    }));

    const groupItems = (orientation?.groups ?? []).map((group) => ({
      label: `Group: ${group.title}`,
      value: `group:${group.id}`,
      sponsorModel: "group",
      sponsorId: group.id,
      slug: group.slug,
    }));

    return [...initiativeItems, ...groupItems];
  }, [orientation]);


  const activeScope = useMemo(
    () => scopeOptions.find((scope) => scope.value === selectedScope) ?? null,
    [scopeOptions, selectedScope],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName ?? "";
      const isEditable =
        target?.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT";

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        return;
      }

      if (event.key === "/" && !isEditable) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (selectedScope || scopeOptions.length === 0) {
      return;
    }
    setSelectedScope(scopeOptions[0].value);
  }, [scopeOptions, selectedScope]);

  const supportedVerb = command?.verb && isSupportedVerb(command.verb) ? command.verb : null;
  const canConfirm = Boolean(command && supportedVerb && command.status === "parsed");

  const handleContextSwitch = () => {
    if (!contextSwitchTarget || !onContextSwitch) return;
    onContextSwitch({ kind: "group", id: contextSwitchTarget.id, slug: contextSwitchTarget.slug, title: contextSwitchTarget.title });
    setInput("");
  };

  const helpText = useMemo(() => {
    if (contextSwitchQuery) {
      return contextSwitchTarget
        ? `Press Switch to enter ${contextSwitchTarget.title} context.`
        : `No group matching "${contextSwitchQuery}".`;
    }
    if (workstreamName) {
      return activeScope?.slug
        ? `Press Create to start workstream "${workstreamName}" in ${activeScope.label}.`
        : "Select a group scope to create a workstream.";
    }
    if (!command) {
      return "Supports note, remind, and task. Use /n Name to start a workstream. Use // GroupName to switch context.";
    }
    if (!supportedVerb) {
      return `Parsed ${command.verb}, but desktop confirm is only wired for note, remind, and task right now.`;
    }
    if (command.needs_clarification) {
      return "Review and edit before confirming.";
    }
    return "Review the parsed command and confirm.";
  }, [command, supportedVerb, workstreamName, activeScope, contextSwitchQuery, contextSwitchTarget]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!activeScope) {
      setError("Choose a scope before parsing a command.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await createAgentCommand({
        text: trimmed,
        source: "desktop_initiatives",
        capture_mode: "typed",
        initiative_id: activeScope.initiativeId ?? null,
        sponsor_model: activeScope.sponsorModel,
        sponsor_id: activeScope.sponsorId ?? null,
      });
      setCommand(created);
      setDraftFields(buildInitialFields(created));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to parse the command.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!command || !supportedVerb) return;

    setConfirming(true);
    setError(null);
    try {
      const confirmed = await confirmAgentCommand(command.id, {
        confirm_action: "confirm",
        fields: normalizeConfirmFields(command, draftFields),
      });
      setCommand(confirmed);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to confirm the command.";
      setError(message);
    } finally {
      setConfirming(false);
    }
  };

  const handleCreateWorkstream = async () => {
    if (!workstreamName || !activeScope?.slug) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createInitiative(activeScope.slug, { title: workstreamName });
      setWorkstreamCreated({ id: created.id, title: created.title });
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workstream.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setCommand(null);
    setDraftFields({});
    setError(null);
    setInput("");
    setWorkstreamCreated(null);
    inputRef.current?.focus();
  };

  return (
    <Card.Root bg={cardBg} border="1px solid" borderColor={borderColor}>
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <Field.Root>
            <Field.Label>Universal Action Field</Field.Label>
            <Box mb={3}>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Scope</Text>
              <select
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value)}
                disabled={orientationLoading || scopeOptions.length === 0}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid",
                  borderColor: "inherit",
                  fontSize: "14px",
                  background: "transparent",
                  cursor: scopeOptions.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                {scopeOptions.length === 0 && (
                  <option value="">No initiatives or groups yet</option>
                )}
                {scopeOptions.map((scope) => (
                  <option key={scope.value} value={scope.value}>
                    {scope.label}
                  </option>
                ))}
              </select>
            </Box>
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type a command: note, remind, or task…"
              minH="112px"
              resize="vertical"
              disabled={noScope}
            />
            <Field.HelperText>{helpText}</Field.HelperText>
          </Field.Root>

          <HStack justify="space-between" align="center">
            <HStack gap={2}>
              <Badge variant="subtle">⌘K</Badge>
              <Text fontSize="xs" color={mutedColor}>
                Focus action field
              </Text>
            </HStack>
            {contextSwitchQuery ? (
              <Button
                colorPalette="purple"
                onClick={handleContextSwitch}
                disabled={!contextSwitchTarget || !onContextSwitch}
              >
                Switch Context
              </Button>
            ) : workstreamName ? (
              <Button
                colorPalette="teal"
                onClick={handleCreateWorkstream}
                disabled={!workstreamName || !activeScope?.slug || submitting}
                loading={submitting}
              >
                Create Workstream
              </Button>
            ) : (
              <Button
                colorPalette="blue"
                onClick={handleSubmit}
                disabled={!input.trim() || submitting || !activeScope}
                loading={submitting}
              >
                Parse Command
              </Button>
            )}
          </HStack>

          {workstreamCreated ? (
            <Box bg="teal.50" _dark={{ bg: "teal.950" }} borderRadius="md" px={3} py={2}>
              <HStack justify="space-between">
                <Text fontSize="sm" color="teal.700" _dark={{ color: "teal.300" }}>
                  Workstream created: <strong>{workstreamCreated.title}</strong>
                </Text>
                <Button size="xs" variant="ghost" onClick={reset}>Dismiss</Button>
              </HStack>
            </Box>
          ) : null}

          {error ? (
            <Box bg="red.50" _dark={{ bg: "red.950" }} borderRadius="md" px={3} py={2}>
              <Text fontSize="sm" color="red.500">
                {error}
              </Text>
            </Box>
          ) : null}

          {command ? (
            <Box bg={subtleBg} borderRadius="lg" px={4} py={4}>
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between" align="center">
                  <HStack gap={2}>
                    <Badge colorPalette={command.status === "executed" ? "green" : "purple"} variant="subtle">
                      {command.status}
                    </Badge>
                    <Badge variant="outline">{command.verb}</Badge>
                    <Text fontSize="xs" color={mutedColor}>
                      confidence {(command.confidence * 100).toFixed(0)}%
                    </Text>
                  </HStack>
                  {submitting || confirming ? <Spinner size="sm" /> : null}
                </HStack>

                {command.status === "executed" ? (
                  <ResultSummary command={command} />
                ) : (
                  <VStack align="stretch" gap={3}>
                    {command.clarification_reason ? (
                      <Text fontSize="sm" color={mutedColor}>
                        {command.clarification_reason}
                      </Text>
                    ) : null}

                    {supportedVerb === "task" ? (
                      <>
                        <Field.Root>
                          <Field.Label>Title</Field.Label>
                          <Input
                            value={draftFields.title ?? ""}
                            onChange={(event) =>
                              setDraftFields((current) => ({ ...current, title: event.target.value }))
                            }
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Details</Field.Label>
                          <Textarea
                            value={draftFields.details ?? ""}
                            onChange={(event) =>
                              setDraftFields((current) => ({ ...current, details: event.target.value }))
                            }
                            minH="96px"
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Due At</Field.Label>
                          <Input
                            type="datetime-local"
                            value={draftFields.due_at ?? ""}
                            onChange={(event) =>
                              setDraftFields((current) => ({ ...current, due_at: event.target.value }))
                            }
                          />
                        </Field.Root>
                      </>
                    ) : null}

                    {supportedVerb === "note" ? (
                      <>
                        <Field.Root>
                          <Field.Label>Title</Field.Label>
                          <Input
                            value={draftFields.title ?? ""}
                            onChange={(event) =>
                              setDraftFields((current) => ({ ...current, title: event.target.value }))
                            }
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Body</Field.Label>
                          <Textarea
                            value={draftFields.body ?? ""}
                            onChange={(event) =>
                              setDraftFields((current) => ({ ...current, body: event.target.value }))
                            }
                            minH="120px"
                          />
                        </Field.Root>
                      </>
                    ) : null}

                    {supportedVerb === "remind" ? (
                      <>
                        <Field.Root>
                          <Field.Label>Title</Field.Label>
                          <Input
                            value={draftFields.title ?? ""}
                            onChange={(event) =>
                              setDraftFields((current) => ({ ...current, title: event.target.value }))
                            }
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Reminder</Field.Label>
                          <Textarea
                            value={draftFields.body ?? ""}
                            onChange={(event) =>
                              setDraftFields((current) => ({ ...current, body: event.target.value }))
                            }
                            minH="96px"
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Remind At</Field.Label>
                          <Input
                            type="datetime-local"
                            value={draftFields.remind_at ?? ""}
                            onChange={(event) =>
                              setDraftFields((current) => ({ ...current, remind_at: event.target.value }))
                            }
                          />
                        </Field.Root>
                      </>
                    ) : null}

                    {!supportedVerb ? (
                      <Text fontSize="sm" color={mutedColor}>
                        Desktop confirm is not wired for <strong>{command.verb}</strong> yet.
                      </Text>
                    ) : null}

                    <HStack justify="space-between">
                      <Button variant="ghost" onClick={reset}>
                        Clear
                      </Button>
                      <Button
                        colorPalette="green"
                        onClick={handleConfirm}
                        disabled={!canConfirm || confirming}
                        loading={confirming}
                      >
                        Confirm {command.verb}
                      </Button>
                    </HStack>
                  </VStack>
                )}
              </VStack>
            </Box>
          ) : null}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

import { axiosInstance } from '@mixtape/api/lib/axiosInstance';
import type { ParsedInitiativeCommand } from '../../types/initiatives';

export interface InitiativesParseRequest {
  input: string;
  sponsorModel: string;
  sponsorId: string;
  captureMode?: 'typed' | 'voice';
}

export interface InitiativesConfirmRequest {
  parsed: ParsedInitiativeCommand;
  fields?: Record<string, unknown>;
}

export interface InitiativesParseResponse {
  parsed: ParsedInitiativeCommand;
}

export interface InitiativesExecuteResponse {
  parsed: ParsedInitiativeCommand;
}

export interface TranscribeJobStatus {
  jobId: string;
  status: 'processing' | 'complete' | 'failed';
  transcriptionText?: string;
  failureReason?: string;
}

export interface InitiativesCommandClient {
  parseCommand: (request: InitiativesParseRequest) => Promise<InitiativesParseResponse>;
  confirmCommand: (request: InitiativesConfirmRequest) => Promise<InitiativesExecuteResponse>;
  transcribeVoice: (audioUri: string, mimeType: string) => Promise<{ jobId: string }>;
  pollTranscribeJob: (jobId: string) => Promise<TranscribeJobStatus>;
}

interface AgentCommandDetailResponse {
  command_id?: string;
  verb: string | null;
  confidence: string | null;
  title: string;
  summary: string;
  fields: Record<string, unknown>;
  generated_text?: string;
  needs_clarification?: boolean;
  clarification_reason?: string;
  result_type?: 'acknowledgment' | 'generated_artifact' | 'search_results' | null;
  result_payload?: Record<string, unknown> | null;
  routing?: Record<string, unknown> | null;
}

function toInitiativeVerb(value: string | null): ParsedInitiativeCommand['verb'] {
  if (
    value === 'note' ||
    value === 'remind' ||
    value === 'task' ||
    value === 'draft' ||
    value === 'add' ||
    value === 'find' ||
    value === 'research' ||
    value === 'summarize'
  ) {
    return value;
  }
  return null;
}

function toConfidence(value: string | null): ParsedInitiativeCommand['confidence'] {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  return 'low';
}

function formatFieldLabel(key: string) {
  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatFieldValue(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatFieldValue(item)).filter(Boolean).join(', ');
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function mapAgentCommandResponse(
  data: AgentCommandDetailResponse,
  rawInput: string
): ParsedInitiativeCommand {
  const fields = Object.entries(data.fields ?? {})
    .map(([key, value]) => ({
      label: formatFieldLabel(key),
      value: formatFieldValue(value),
    }))
    .filter((field) => field.value.trim().length > 0);

  return {
    commandId: data.command_id,
    verb: toInitiativeVerb(data.verb),
    rawInput,
    confidence: toConfidence(data.confidence),
    title: data.title || 'Confirm command',
    summary: data.summary || 'Review the parsed action before execution.',
    fields,
    generatedText: data.generated_text || undefined,
    needsClarification: Boolean(data.needs_clarification),
    clarificationReason: data.clarification_reason || undefined,
    resultType: data.result_type ?? null,
    resultPayload: data.result_payload ?? null,
    routing: data.routing ?? null,
  };
}

const initiativesCommandClient: InitiativesCommandClient = {
  async parseCommand({ input, sponsorModel, sponsorId, captureMode = 'typed' }) {
    const response = await axiosInstance.post<AgentCommandDetailResponse>(
      '/api/initiatives/mobile/commands',
      {
        text: input,
        source: 'mobile_initiatives',
        capture_mode: captureMode,
        sponsor_model: sponsorModel,
        sponsor_id: sponsorId,
      }
    );

    return {
      parsed: mapAgentCommandResponse(response.data, input),
    };
  },

  async transcribeVoice(audioUri, mimeType) {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: mimeType,
      name: 'voice-command.m4a',
    } as unknown as Blob);
    formData.append('source', 'mobile_initiatives');

    const response = await axiosInstance.post<{ job_id: string }>(
      '/api/initiatives/mobile/transcribe',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return { jobId: response.data.job_id };
  },

  async pollTranscribeJob(jobId) {
    const response = await axiosInstance.get<{
      job_id: string;
      status: string;
      transcription_text?: string;
      failure_reason?: string;
    }>(`/api/initiatives/mobile/transcribe/${jobId}`);

    const { status, transcription_text, failure_reason } = response.data;

    return {
      jobId,
      status: (status === 'complete' || status === 'failed') ? status : 'processing',
      transcriptionText: transcription_text,
      failureReason: failure_reason,
    };
  },

  async confirmCommand({ parsed, fields = {} }) {
    if (!parsed.commandId) {
      throw new Error('Missing command id for confirm.');
    }

    const response = await axiosInstance.post<AgentCommandDetailResponse>(
      `/api/initiatives/mobile/commands/${parsed.commandId}/confirm`,
      {
        confirm_action: 'confirm',
        fields,
      }
    );

    return {
      parsed: mapAgentCommandResponse(response.data, parsed.rawInput),
    };
  },
};

export function getInitiativesCommandClient(): InitiativesCommandClient {
  return initiativesCommandClient;
}

// packages/api/src/clients/concord/concordApi.ts

/**
 * Concord API client
 * Audio recording, transcription, and interpretation operations
 */

import {
  Recording,
  RecordingListResponse,
  RecordingCreateRequest,
  RecordingUpdateRequest,
  RecordingStatus,
  RecordingSession,
  RecordingSessionListItem,
  SessionListResponse,
  SessionCreateRequest,
  SessionUpdateRequest,
  SessionStatus,
  SpeakerAnchor,
  SpeakerAnchorListItem,
  SpeakerAnchorListResponse,
  SpeakerAnchorCreateRequest,
  SpeakerAnchorUpdateRequest,
  Transcription,
  TranscriptionListItem,
  TranscriptionListResponse,
} from '@mixtape/core/types/concordTypes';
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

// ============================================================================
// RECORDING API FUNCTIONS
// ============================================================================

/**
 * List recordings for a group
 *
 * @param groupSlug - Group slug
 * @param status - Optional status filter
 * @returns List of recordings
 */
export async function fetchGroupRecordings(
  groupSlug: string,
  status?: RecordingStatus
): Promise<RecordingListResponse> {
  const params = new URLSearchParams();
  if (status) {
    params.set('status', status);
  }

  const url = `/api/concord/groups/${groupSlug}/recordings/${params.toString() ? '?' + params.toString() : ''}`;
  const response = await axiosInstance.get<RecordingListResponse>(url);
  return response.data;
}

/**
 * Create a new recording for a group
 *
 * @param groupSlug - Group slug
 * @param data - Recording data
 * @returns Created recording
 */
export async function createGroupRecording(
  groupSlug: string,
  data: {
    title?: string;
    summary?: string;
    recorded_at?: string;
    file?: File;
  }
): Promise<Recording> {
  // Use FormData if file is included
  if (data.file) {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.summary) formData.append('summary', data.summary);
    if (data.recorded_at) formData.append('recorded_at', data.recorded_at);
    formData.append('file', data.file);

    const response = await axiosInstance.post<Recording>(
      `/api/concord/groups/${groupSlug}/recordings/create/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  // Regular JSON request without file
  const response = await axiosInstance.post<Recording>(
    `/api/concord/groups/${groupSlug}/recordings/create/`,
    data
  );
  return response.data;
}

/**
 * Fetch a single recording by ID
 *
 * @param recordingId - Recording UUID
 * @returns Recording details
 */
export async function fetchRecording(recordingId: string): Promise<Recording> {
  const response = await axiosInstance.get<Recording>(
    `/api/concord/recordings/${recordingId}/`
  );
  return response.data;
}

/**
 * Update recording metadata
 *
 * @param recordingId - Recording UUID
 * @param data - Update data
 * @returns Updated recording
 */
export async function updateRecording(
  recordingId: string,
  data: RecordingUpdateRequest
): Promise<Recording> {
  const response = await axiosInstance.patch<Recording>(
    `/api/concord/recordings/${recordingId}/`,
    data
  );
  return response.data;
}

/**
 * Upload audio file to a recording
 *
 * @param recordingId - Recording UUID
 * @param file - Audio file
 * @param onProgress - Optional progress callback
 * @returns Updated recording
 */
export async function uploadRecordingAudio(
  recordingId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<Recording> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosInstance.post<Recording>(
    `/api/concord/recordings/${recordingId}/upload/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    }
  );
  return response.data;
}

/**
 * Transition recording to a new status
 *
 * @param recordingId - Recording UUID
 * @param status - New status
 * @returns Updated recording
 */
export async function transitionRecording(
  recordingId: string,
  status: RecordingStatus
): Promise<Recording> {
  const response = await axiosInstance.post<Recording>(
    `/api/concord/recordings/${recordingId}/transition/`,
    { status }
  );
  return response.data;
}

/**
 * Archive a recording (soft delete)
 *
 * @param recordingId - Recording UUID
 */
export async function archiveRecording(recordingId: string): Promise<void> {
  await axiosInstance.delete(`/api/concord/recordings/${recordingId}/`);
}

// ============================================================================
// GENERIC RECORDING API (by sponsor)
// ============================================================================

/**
 * List recordings for any sponsor type
 *
 * @param sponsorType - 'group' or 'user'
 * @param sponsorId - Sponsor UUID
 * @param status - Optional status filter
 * @returns List of recordings
 */
export async function fetchRecordings(
  sponsorType: 'group' | 'user',
  sponsorId: string,
  status?: RecordingStatus
): Promise<RecordingListResponse> {
  const params = new URLSearchParams({
    sponsor_type: sponsorType,
    sponsor_id: sponsorId,
  });
  if (status) {
    params.set('status', status);
  }

  const response = await axiosInstance.get<RecordingListResponse>(
    `/api/concord/recordings/?${params.toString()}`
  );
  return response.data;
}

/**
 * Create a new recording with explicit sponsor
 *
 * @param data - Recording data with sponsor
 * @returns Created recording
 */
export async function createRecording(
  data: RecordingCreateRequest
): Promise<Recording> {
  // Use FormData if file is included
  if (data.file) {
    const formData = new FormData();
    formData.append('sponsor_type', data.sponsor_type);
    formData.append('sponsor_id', data.sponsor_id);
    if (data.title) formData.append('title', data.title);
    if (data.summary) formData.append('summary', data.summary);
    if (data.recorded_at) formData.append('recorded_at', data.recorded_at);
    formData.append('file', data.file);

    const response = await axiosInstance.post<Recording>(
      '/api/concord/recordings/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  // Regular JSON request without file
  const response = await axiosInstance.post<Recording>(
    '/api/concord/recordings/',
    data
  );
  return response.data;
}

// ============================================================================
// RECORDING SESSION API FUNCTIONS
// ============================================================================

/**
 * List recording sessions for a group
 *
 * @param groupSlug - Group slug
 * @param status - Optional status filter
 * @returns List of sessions
 */
export async function fetchGroupSessions(
  groupSlug: string,
  status?: SessionStatus
): Promise<SessionListResponse> {
  const params = new URLSearchParams();
  if (status) {
    params.set('status', status);
  }

  const url = `/api/concord/groups/${groupSlug}/sessions/${params.toString() ? '?' + params.toString() : ''}`;
  const response = await axiosInstance.get<SessionListResponse>(url);
  return response.data;
}

/**
 * Create a new session for a group
 *
 * @param groupSlug - Group slug
 * @param data - Session data
 * @returns Created session
 */
export async function createGroupSession(
  groupSlug: string,
  data: Omit<SessionCreateRequest, 'sponsor_type' | 'sponsor_id'>
): Promise<RecordingSession> {
  const response = await axiosInstance.post<RecordingSession>(
    `/api/concord/groups/${groupSlug}/sessions/create/`,
    data
  );
  return response.data;
}

/**
 * List sessions for any sponsor type
 *
 * @param sponsorType - 'group' or 'user'
 * @param sponsorId - Sponsor UUID
 * @param status - Optional status filter
 * @returns List of sessions
 */
export async function fetchSessions(
  sponsorType: 'group' | 'user',
  sponsorId: string,
  status?: SessionStatus
): Promise<SessionListResponse> {
  const params = new URLSearchParams({
    sponsor_type: sponsorType,
    sponsor_id: sponsorId,
  });
  if (status) {
    params.set('status', status);
  }

  const response = await axiosInstance.get<SessionListResponse>(
    `/api/concord/sessions/?${params.toString()}`
  );
  return response.data;
}

/**
 * Create a new session with explicit sponsor
 *
 * @param data - Session data with sponsor
 * @returns Created session
 */
export async function createSession(
  data: SessionCreateRequest
): Promise<RecordingSession> {
  const response = await axiosInstance.post<RecordingSession>(
    '/api/concord/sessions/',
    data
  );
  return response.data;
}

/**
 * Fetch a single session by ID (includes segments)
 *
 * @param sessionId - Session UUID
 * @returns Session details with segments
 */
export async function fetchSession(sessionId: string): Promise<RecordingSession> {
  const response = await axiosInstance.get<RecordingSession>(
    `/api/concord/sessions/${sessionId}/`
  );
  return response.data;
}

/**
 * Update session metadata
 *
 * @param sessionId - Session UUID
 * @param data - Update data
 * @returns Updated session
 */
export async function updateSession(
  sessionId: string,
  data: SessionUpdateRequest
): Promise<RecordingSession> {
  const response = await axiosInstance.patch<RecordingSession>(
    `/api/concord/sessions/${sessionId}/`,
    data
  );
  return response.data;
}

/**
 * Archive a session (soft delete)
 *
 * @param sessionId - Session UUID
 */
export async function archiveSession(sessionId: string): Promise<void> {
  await axiosInstance.delete(`/api/concord/sessions/${sessionId}/`);
}

// ============================================================================
// SPEAKER ANCHOR API FUNCTIONS
// ============================================================================

/**
 * List speaker anchors for a session
 *
 * @param sessionId - Session UUID
 * @param includeInactive - Include inactive anchors
 * @returns List of anchors
 */
export async function fetchSessionAnchors(
  sessionId: string,
  includeInactive = false
): Promise<SpeakerAnchorListResponse> {
  const params = new URLSearchParams();
  if (includeInactive) {
    params.set('include_inactive', 'true');
  }

  const url = `/api/concord/sessions/${sessionId}/anchors/${params.toString() ? '?' + params.toString() : ''}`;
  const response = await axiosInstance.get<SpeakerAnchorListResponse>(url);
  return response.data;
}

/**
 * List speaker anchors (generic query)
 *
 * @param params - Query parameters
 * @returns List of anchors
 */
export async function fetchAnchors(params: {
  session_id?: string;
  group_id?: string;
  include_inactive?: boolean;
}): Promise<SpeakerAnchorListResponse> {
  const searchParams = new URLSearchParams();
  if (params.session_id) searchParams.set('session_id', params.session_id);
  if (params.group_id) searchParams.set('group_id', params.group_id);
  if (params.include_inactive) searchParams.set('include_inactive', 'true');

  const response = await axiosInstance.get<SpeakerAnchorListResponse>(
    `/api/concord/anchors/?${searchParams.toString()}`
  );
  return response.data;
}

/**
 * Create a new speaker anchor
 *
 * @param data - Anchor data
 * @returns Created anchor
 */
export async function createAnchor(
  data: SpeakerAnchorCreateRequest
): Promise<SpeakerAnchor> {
  const response = await axiosInstance.post<SpeakerAnchor>(
    '/api/concord/anchors/',
    data
  );
  return response.data;
}

/**
 * Fetch a single anchor by ID
 *
 * @param anchorId - Anchor UUID
 * @returns Anchor details
 */
export async function fetchAnchor(anchorId: string): Promise<SpeakerAnchor> {
  const response = await axiosInstance.get<SpeakerAnchor>(
    `/api/concord/anchors/${anchorId}/`
  );
  return response.data;
}

/**
 * Update anchor metadata
 *
 * @param anchorId - Anchor UUID
 * @param data - Update data
 * @returns Updated anchor
 */
export async function updateAnchor(
  anchorId: string,
  data: SpeakerAnchorUpdateRequest
): Promise<SpeakerAnchor> {
  const response = await axiosInstance.patch<SpeakerAnchor>(
    `/api/concord/anchors/${anchorId}/`,
    data
  );
  return response.data;
}

/**
 * Deactivate an anchor (soft delete)
 *
 * @param anchorId - Anchor UUID
 */
export async function deactivateAnchor(anchorId: string): Promise<void> {
  await axiosInstance.delete(`/api/concord/anchors/${anchorId}/`);
}

// ============================================================================
// TRANSCRIPTION API FUNCTIONS (Read-Only)
// ============================================================================

/**
 * List transcriptions for a recording
 *
 * @param recordingId - Recording UUID
 * @returns List of transcriptions
 */
export async function fetchRecordingTranscriptions(
  recordingId: string
): Promise<TranscriptionListResponse> {
  const response = await axiosInstance.get<TranscriptionListResponse>(
    `/api/concord/recordings/${recordingId}/transcriptions/`
  );
  return response.data;
}

/**
 * List transcriptions (generic query)
 *
 * @param recordingId - Recording UUID
 * @returns List of transcriptions
 */
export async function fetchTranscriptions(
  recordingId: string
): Promise<TranscriptionListResponse> {
  const params = new URLSearchParams({
    recording_id: recordingId,
  });

  const response = await axiosInstance.get<TranscriptionListResponse>(
    `/api/concord/transcriptions/?${params.toString()}`
  );
  return response.data;
}

/**
 * Fetch a single transcription by ID (includes all segments)
 *
 * @param transcriptionId - Transcription UUID
 * @returns Transcription with segments
 */
export async function fetchTranscription(
  transcriptionId: string
): Promise<Transcription> {
  const response = await axiosInstance.get<Transcription>(
    `/api/concord/transcriptions/${transcriptionId}/`
  );
  return response.data;
}


// ============================================================================
// UNIFIED UPLOAD API
// ============================================================================

export interface UploadResult {
  status: 'success' | 'error';
  batch_id: string;
  library_id: string | null;
  sessions_created: number;
  recordings_created: number;
  transcription_tasks_queued: number;
  sessions: Array<{
    id: string;
    title: string;
    recording_count: number;
  }>;
  errors: string[];
  warnings: string[];
}

export interface UploadOptions {
  autoTranscribe?: boolean;
  whisperModel?: 'tiny' | 'base' | 'small' | 'medium' | 'large' | 'large-v3';
  sessionTitle?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Unified upload for audio/video files.
 *
 * Handles multiple scenarios automatically:
 * - Single file → standalone Recording
 * - Multiple files → one Session with Recordings
 * - Directory (with webkitRelativePath) → Sessions per subdirectory
 * - Zip file → extracted, folders become Sessions
 *
 * @param groupSlug - Group slug
 * @param files - Array of files to upload
 * @param options - Upload options
 * @returns Upload result with created sessions/recordings
 */
export async function uploadFiles(
  groupSlug: string,
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResult> {
  const formData = new FormData();

  // Add files
  files.forEach((file) => {
    formData.append('files', file);
  });

  // Add paths (from webkitRelativePath if available, otherwise filename)
  const paths = files.map((file) => {
    // @ts-ignore - webkitRelativePath exists on File when using directory upload
    return file.webkitRelativePath || file.name;
  });
  formData.append('paths', JSON.stringify(paths));

  // Add options
  formData.append('auto_transcribe', String(options.autoTranscribe ?? true));
  formData.append('whisper_model', options.whisperModel || 'base');
  if (options.sessionTitle) {
    formData.append('session_title', options.sessionTitle);
  }

  const response = await axiosInstance.post<UploadResult>(
    `/api/concord/groups/${groupSlug}/upload/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (options.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(progress);
        }
      },
    }
  );

  return response.data;
}

/**
 * Trigger transcription for a recording.
 *
 * @param recordingId - Recording UUID
 * @param options - Transcription options
 * @returns Task info
 */
export async function triggerTranscription(
  recordingId: string,
  options: {
    model?: string;
    language?: string;
    force?: boolean;
  } = {}
): Promise<{
  status: string;
  task_id: string;
  recording_id: string;
  model: string;
  language: string | null;
}> {
  const response = await axiosInstance.post(
    `/api/concord/recordings/${recordingId}/transcribe/`,
    {
      model: options.model || 'base',
      language: options.language,
      force: options.force || false,
    }
  );
  return response.data;
}

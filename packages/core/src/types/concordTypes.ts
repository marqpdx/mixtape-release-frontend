/**
 * Concord types for audio transcription and interpretation
 * Corresponds to Recording, RecordingSession, SpeakerAnchor, Transcription models
 *
 * Recording and RecordingSession inherit from BaseContent, providing:
 * - title, slug, summary, body (content fields)
 * - sponsor (polymorphic GenericFK)
 * - author, author_name, submitted_by (authorship)
 * - tags, categories, published_at
 *
 * See: docs/planning/audio/architecture.md
 * See: docs/planning/audio/surfaces.md
 */

// ============================================================================
// Status Enums
// ============================================================================

export type RecordingStatus =
  | 'uploaded'
  | 'transcribing'
  | 'interpreting'
  | 'ready'
  | 'accepted'
  | 'promoted'
  | 'archived'
  | 'failed';

export type SessionStatus =
  | 'recording'
  | 'completed'
  | 'processing'
  | 'ready'
  | 'archived';

export type TrackType =
  | 'mixed'
  | 'microphone'
  | 'system'
  | 'speaker_sample';

// ============================================================================
// RecordingSession
// ============================================================================

/**
 * RecordingSession - groups segmented recordings from a single call/meeting
 * Per surfaces.md: segment at capture time (10-15 min segments)
 */
export interface RecordingSession {
  id: string; // UUID

  // BaseContent fields
  title: string;
  slug: string;
  summary: string;
  body: string;

  // Sponsor info
  sponsor_type: 'group' | 'user';
  sponsor_id: string;

  // Authorship
  submitted_by_id: string | null;
  submitted_by_name: string | null;

  // Session-specific
  external_call_id: string; // e.g., Zoom meeting ID
  session_started_at: string | null;
  session_ended_at: string | null;
  segment_duration_seconds: number;
  expected_participants: string[];
  status: SessionStatus;

  // Computed
  segment_count: number;
  total_duration_ms: number;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Nested segments (optional, from detail view)
  segments?: RecordingListItem[];
}

/**
 * Lightweight session for list views
 */
export interface RecordingSessionListItem {
  id: string;
  title: string;
  slug: string;
  status: SessionStatus;
  segment_count: number;
  total_duration_ms: number;
  session_started_at: string | null;
  created_at: string;
  submitted_by_name: string | null;
}

// ============================================================================
// Recording
// ============================================================================

/**
 * Recording model - individual audio segment
 * Can be standalone or part of a RecordingSession
 * Inherits from BaseContent for collection support
 */
export interface Recording {
  id: string; // UUID

  // BaseContent fields
  title: string;
  slug: string;
  summary: string;
  body: string; // Detailed notes/description

  // Sponsor info
  sponsor_type: 'group' | 'user';
  sponsor_id: string; // UUID

  // Authorship (from BaseContent)
  author_id: string | null;
  author_name: string;
  submitted_by_id: string | null;
  submitted_by_name: string | null;

  // Session link (for segmented recordings)
  session_id: string | null;
  segment_index: number | null;
  track_type: TrackType;
  is_voice_sample: boolean;

  // Audio metadata
  duration_ms: number | null;
  duration_formatted: string | null; // e.g., "2:34"
  recorded_at: string | null; // ISO datetime

  // Status
  status: RecordingStatus;
  status_changed_at: string; // ISO datetime

  // Storage
  audio_url: string | null;
  audio_content_type: string;
  audio_size_bytes: number | null;

  // Timestamps
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
  published_at: string | null; // ISO datetime

  // Processing
  processing_started_at: string | null;
  processing_completed_at: string | null;
  processing_error: string;
}

/**
 * Lightweight recording for list views
 */
export interface RecordingListItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: RecordingStatus;
  duration_formatted: string | null;
  created_at: string;
  submitted_by_name: string | null;

  // Session fields
  session_id: string | null;
  segment_index: number | null;
  track_type: TrackType;
}

// ============================================================================
// SpeakerAnchor (Voice Prints)
// ============================================================================

/**
 * SpeakerAnchor - voice print for contextual speaker identification
 * Per surfaces.md: NOT biometric authentication, NOT global identity
 * This IS contextual speaker anchoring within session/group scope
 */
export interface SpeakerAnchor {
  id: string; // UUID

  // Scope (at least one must be set)
  session_id: string | null;
  group_id: string | null;

  // Identity
  speaker_label: string; // Self-asserted name: "This is Mark speaking"
  user_id: string | null; // Mixtape user if known
  user_name: string | null;

  // Voice sample reference
  source_recording_id: string | null;
  sample_start_ms: number | null;
  sample_end_ms: number | null;

  // Embedding info (not the actual bytes)
  has_embedding: boolean;
  embedding_model: string;

  // Confidence & status
  confidence_score: number | null;
  is_active: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Lightweight anchor for list views
 */
export interface SpeakerAnchorListItem {
  id: string;
  speaker_label: string;
  user_name: string | null;
  has_embedding: boolean;
  confidence_score: number | null;
  is_active: boolean;
  created_at: string;
}

// ============================================================================
// Transcription
// ============================================================================

/**
 * Transcription - Whisper ASR output for a Recording
 */
export interface Transcription {
  id: string;
  recording_id: string;
  version: number;

  // Content
  text: string;
  language: string;

  // Quality
  confidence_avg: number | null;

  // Model info
  whisper_model: string;

  // Processing
  processing_started_at: string | null;
  processing_completed_at: string | null;

  // Timestamps
  created_at: string;

  // Nested segments (from detail view)
  segments: TranscriptSegment[];
}

/**
 * Lightweight transcription for list views
 */
export interface TranscriptionListItem {
  id: string;
  recording_id: string;
  version: number;
  language: string;
  whisper_model: string;
  confidence_avg: number | null;
  segment_count: number;
  created_at: string;
}

/**
 * TranscriptSegment - speaker turn within a transcription
 */
export interface TranscriptSegment {
  id: string;
  segment_index: number;
  start_ms: number;
  end_ms: number;
  duration_ms: number;
  text: string;

  // Speaker attribution
  speaker_anchor_id: string | null;
  speaker_label: string;
  speaker_confidence: number | null;

  // Quality
  confidence: number | null;
}

// ============================================================================
// API Request Types
// ============================================================================

/**
 * Create recording request
 */
export interface RecordingCreateRequest {
  sponsor_type: 'group' | 'user';
  sponsor_id: string;
  title?: string;
  summary?: string;
  body?: string;
  recorded_at?: string;
  session_id?: string;
  segment_index?: number;
  track_type?: TrackType;
  is_voice_sample?: boolean;
  file?: File;
}

/**
 * Update recording request
 */
export interface RecordingUpdateRequest {
  title?: string;
  summary?: string;
  body?: string;
  recorded_at?: string;
}

/**
 * Create session request
 */
export interface SessionCreateRequest {
  sponsor_type: 'group' | 'user';
  sponsor_id: string;
  title?: string;
  summary?: string;
  body?: string;
  external_call_id?: string;
  session_started_at?: string;
  segment_duration_seconds?: number;
  expected_participants?: string[];
}

/**
 * Update session request
 */
export interface SessionUpdateRequest {
  title?: string;
  summary?: string;
  body?: string;
  external_call_id?: string;
  session_started_at?: string;
  session_ended_at?: string;
  expected_participants?: string[];
  status?: SessionStatus;
}

/**
 * Create speaker anchor request
 */
export interface SpeakerAnchorCreateRequest {
  session_id?: string;
  group_id?: string;
  speaker_label: string;
  user_id?: string;
  source_recording_id?: string;
  sample_start_ms?: number;
  sample_end_ms?: number;
}

/**
 * Update speaker anchor request
 */
export interface SpeakerAnchorUpdateRequest {
  speaker_label?: string;
  user_id?: string | null;
  is_active?: boolean;
  confidence_score?: number | null;
}

/**
 * Status transition request
 */
export interface RecordingTransitionRequest {
  status: RecordingStatus;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Recording list response
 */
export interface RecordingListResponse {
  recordings: RecordingListItem[];
  count: number;
  group?: {
    id: string;
    slug: string;
    title: string;
  };
}

/**
 * Session list response
 */
export interface SessionListResponse {
  sessions: RecordingSessionListItem[];
  count: number;
  group?: {
    id: string;
    slug: string;
    title: string;
  };
}

/**
 * Speaker anchor list response
 */
export interface SpeakerAnchorListResponse {
  anchors: SpeakerAnchorListItem[];
  count: number;
  session_id?: string;
}

/**
 * Transcription list response
 */
export interface TranscriptionListResponse {
  transcriptions: TranscriptionListItem[];
  count: number;
  recording_id: string;
}

// ============================================================================
// Phase 2+ Types (Future)
// ============================================================================

/**
 * ConcordInterpretation - structural analysis (Phase 2)
 */
export interface ConcordInterpretation {
  id: string;
  transcription_id: string;
  version: number;
  speakers: Speaker[];
  speaker_count: number;
  voice_markers: VoiceMarker[];
  structure_proposals: StructureProposal[];
  diarization_confidence: number | null;
  has_ambiguities: boolean;
  ambiguity_notes: string;
}

/**
 * Speaker from diarization
 */
export interface Speaker {
  id: string;
  name: string | null;
  segments: SpeakerSegment[];
}

/**
 * Speaker segment
 */
export interface SpeakerSegment {
  start_ms: number;
  end_ms: number;
}

/**
 * Voice marker - spoken directive
 */
export interface VoiceMarker {
  type: 'voice_marker';
  directive: string;
  title?: string;
  start_ms: number;
  end_ms: number;
  speakers: string[];
  content: Record<string, unknown>;
}

/**
 * Structural proposal from Concord
 */
export interface StructureProposal {
  type: 'heading' | 'list' | 'category' | 'grouping';
  start_ms: number;
  end_ms: number;
  content: string;
  confidence: number;
}

/**
 * EchoLineSession - human review activity (Phase 2)
 */
export interface EchoLineSession {
  id: string;
  recording_id: string;
  interpretation_id: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  accepted_transcript: string;
  accepted_speakers: Speaker[] | null;
  accepted_voice_markers: VoiceMarker[] | null;
  accepted_structure: StructureProposal[] | null;
  reviewed_by_id: string;
  started_at: string;
  completed_at: string | null;
  mill_draft_id: string | null;
}

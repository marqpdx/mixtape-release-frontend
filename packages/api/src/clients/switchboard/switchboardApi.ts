import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export interface SummarizeAsyncRequest {
  text: string;
  words?: number;
  style?: string;
}

export interface SummarizeAsyncResponse {
  action_run_id: string;
}

export async function submitSummarizeAsync(
  payload: SummarizeAsyncRequest
): Promise<SummarizeAsyncResponse> {
  const res = await axiosInstance.post("/api/switchboard/summarize/async", payload);
  return res.data as SummarizeAsyncResponse;
}

export interface ClassifyAsyncRequest {
  text: string;
  max_tags?: number;
}

export interface ClassifyAsyncResponse {
  action_run_id: string;
}

export async function submitClassifyAsync(
  payload: ClassifyAsyncRequest
): Promise<ClassifyAsyncResponse> {
  const res = await axiosInstance.post("/api/switchboard/classify/async", payload);
  return res.data as ClassifyAsyncResponse;
}

export interface ContextShapeAsyncRequest {
  text: string;
  group_context?: string;
  surface?: string;
}

export interface ContextShapeAsyncResponse {
  action_run_id: string;
}

export async function submitContextShapeAsync(
  payload: ContextShapeAsyncRequest
): Promise<ContextShapeAsyncResponse> {
  const res = await axiosInstance.post("/api/switchboard/context-shape/async", payload);
  return res.data as ContextShapeAsyncResponse;
}

export type DraftContentType = 'email' | 'sop' | 'summary' | 'message' | 'document' | 'proposal';
export type DraftTone = 'professional' | 'friendly' | 'direct' | 'formal' | 'casual';
export type DraftLength = 'brief' | 'standard' | 'detailed';

export interface DraftAsyncRequest {
  content_type: DraftContentType;
  source_text: string;
  tone?: DraftTone;
  target_length?: DraftLength;
  audience?: string;
  additional_context?: string;
  surface?: 'console' | 'puddlejump';
  deferred?: boolean;
}

export interface DraftAsyncResponse {
  action_run_id: string;
}

export interface DraftActionResult {
  status: 'SUCCEEDED';
  tool: string;
  content_type: DraftContentType;
  draft_text: string;
  tone: DraftTone | null;
  target_length: DraftLength | null;
  input_hash: string;
  quality_signal: number | null;
  model_used: string | null;
  draft_refused: boolean;
}

export async function submitDraftAsync(
  payload: DraftAsyncRequest
): Promise<DraftAsyncResponse> {
  const res = await axiosInstance.post("/api/switchboard/draft/async", payload);
  return res.data as DraftAsyncResponse;
}

export type RefineLength = 'preserve' | 'shorten' | 'expand';

export interface RefineAsyncRequest {
  source_text: string;
  refinement_instruction: string;
  target_length?: RefineLength;
  additional_context?: string;
  surface?: 'console' | 'puddlejump';
  deferred?: boolean;
}

export interface RefineAsyncResponse {
  action_run_id: string;
}

export interface RefineActionResult {
  status: 'SUCCEEDED';
  tool: string;
  refined_text: string;
  target_length: RefineLength | null;
  input_hash: string;
  quality_signal: number | null;
  model_used: string | null;
  refine_refused: boolean;
}

export async function submitRefineAsync(
  payload: RefineAsyncRequest
): Promise<RefineAsyncResponse> {
  const res = await axiosInstance.post("/api/switchboard/refine/async", payload);
  return res.data as RefineAsyncResponse;
}

export interface AddRequest {
  list_title: string;
  items: string[];
  create_if_missing?: boolean;
  surface?: 'mobile' | 'desktop';
}

export interface AddResponse {
  id: string;
  title: string;
  body_text: string;
  action_run_id: string;
  items_added: number;
}

export async function submitAdd(payload: AddRequest): Promise<AddResponse> {
  const res = await axiosInstance.post("/api/switchboard/agent/add", payload);
  return res.data as AddResponse;
}

export interface FindResult {
  text: string;
  score: number;
  artifact_type: string;
  artifact_id: string;
  source_file_id: string;
}

export interface FindRequest {
  query: string;
  library_id?: string;
  limit?: number;
  score_threshold?: number;
  surface?: 'mobile' | 'desktop';
}

export interface FindResponse {
  results: FindResult[];
  query: string;
  library_id: string;
  result_count: number;
  action_run_id: string;
}

export async function submitFind(payload: FindRequest): Promise<FindResponse> {
  const res = await axiosInstance.post("/api/switchboard/agent/find", payload);
  return res.data as FindResponse;
}

export interface ResearchAsyncRequest {
  query: string;
  max_sources?: number;
  surface?: 'mobile' | 'desktop';
}

export interface ResearchAsyncResponse {
  action_run_id: string;
}

export interface ResearchActionResult {
  research_summary: string;
  key_points: string[];
  sources_used: string[];
  source_urls: string[];
  source_count: number;
  model_used: string | null;
  research_refused: boolean;
}

export async function submitResearchAsync(
  payload: ResearchAsyncRequest
): Promise<ResearchAsyncResponse> {
  const res = await axiosInstance.post("/api/switchboard/agent/research", payload);
  return res.data as ResearchAsyncResponse;
}

export interface PatternAsyncRequest {
  query: string;
  library_id?: string;
  max_sources?: number;
  surface?: 'mobile' | 'desktop';
}

export interface PatternAsyncResponse {
  action_run_id: string;
}

export interface PatternTheme {
  theme: string;
  description: string;
  frequency: 'high' | 'medium' | 'low';
}

export interface PatternCluster {
  cluster_name: string;
  description: string;
}

export interface PatternActionResult {
  pattern_summary: string;
  themes: PatternTheme[];
  style_observations: string[];
  content_gaps: string[];
  content_clusters: PatternCluster[];
  sources_analyzed: number;
  model_used: string | null;
  pattern_refused: boolean;
}

export async function submitPatternAsync(
  payload: PatternAsyncRequest
): Promise<PatternAsyncResponse> {
  const res = await axiosInstance.post("/api/switchboard/agent/pattern", payload);
  return res.data as PatternAsyncResponse;
}

// hooks/dispatch/useDispatchComments.ts
// Fetch and mutate DispatchComments for a single WritingPiece.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '@mixtape/api/lib/axiosInstance'

export interface DispatchCommentAuthor {
  id: number
  username: string
  display_name: string
}

export interface DispatchComment {
  id: string
  writing_piece: string
  author: DispatchCommentAuthor
  body: string
  block_id: string
  anchor_from: number | null
  anchor_to: number | null
  quoted_text: string
  parent: string | null
  replies: DispatchComment[]
  is_resolved: boolean
  resolved_at: string | null
  resolved_by: DispatchCommentAuthor | null
  created_at: string
  updated_at: string
}

export interface DispatchCommentCounts {
  total: number
  resolved: number
}

export interface DispatchCommentListResponse {
  comments: DispatchComment[]
  counts: DispatchCommentCounts
}

export interface CreateDispatchCommentPayload {
  writing_piece: string
  body: string
  block_id?: string
  anchor_from?: number
  anchor_to?: number
  quoted_text?: string
  parent?: string
}

const qk = (pieceId: string) => ['dispatch', 'comments', pieceId]

export function useDispatchComments(pieceId: string | null | undefined) {
  const qc = useQueryClient()

  const query = useQuery<DispatchCommentListResponse>({
    queryKey: qk(pieceId ?? ''),
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/dispatch/comments/${pieceId}`)
      return res.data
    },
    enabled: !!pieceId,
    staleTime: 10_000,
  })

  const invalidate = () => {
    if (pieceId) qc.invalidateQueries({ queryKey: qk(pieceId) })
  }

  const createComment = useMutation({
    mutationFn: (payload: CreateDispatchCommentPayload) =>
      axiosInstance.post('/api/dispatch/comments', payload).then((r) => r.data as DispatchComment),
    onSuccess: invalidate,
  })

  const editComment = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      axiosInstance.patch(`/api/dispatch/comments/${id}`, { body }).then((r) => r.data as DispatchComment),
    onSuccess: invalidate,
  })

  const deleteComment = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/api/dispatch/comments/${id}`),
    onSuccess: invalidate,
  })

  const resolveComment = useMutation({
    mutationFn: (id: string) =>
      axiosInstance.post(`/api/dispatch/comments/${id}/resolve`, {}).then((r) => r.data as DispatchComment),
    onSuccess: invalidate,
  })

  const unresolveComment = useMutation({
    mutationFn: (id: string) =>
      axiosInstance.post(`/api/dispatch/comments/${id}/unresolve`, {}).then((r) => r.data as DispatchComment),
    onSuccess: invalidate,
  })

  return {
    comments: query.data?.comments ?? [],
    counts: query.data?.counts,
    isLoading: query.isLoading,
    createComment,
    editComment,
    deleteComment,
    resolveComment,
    unresolveComment,
  }
}

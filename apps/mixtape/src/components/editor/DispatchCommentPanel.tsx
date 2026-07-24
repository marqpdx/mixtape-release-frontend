"use client"
// DispatchCommentPanel.tsx
// Right-hand margin panel for Dispatch doc inline comments.
// Shows thread cards sorted by created_at; supports compose, reply, edit,
// resolve/unresolve, and delete.

import { useRef, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Spinner,
  Stack,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react'
import { Tooltip } from '@components/ui/tooltip'
import { toaster } from '@components/ui/toaster'
import {
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconMessageCircle,
  IconPencil,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import type { Editor } from '@tiptap/react'
import type { DispatchComment } from '@mixtape/api/src/hooks/dispatch/useDispatchComments'
import { useDispatchComments } from '@mixtape/api/src/hooks/dispatch/useDispatchComments'

interface PendingComment {
  commentId: string
  blockId: string | null
  anchorFrom: number
  anchorTo: number
  quotedText: string
}

interface Props {
  pieceId: string
  editor: Editor | null
  canResolve: boolean   // editors: true; commenters: false
  currentUserId: number | undefined
  pendingComment: PendingComment | null
  onPendingCancel: () => void
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function CommentThreadCard({
  comment,
  pieceId: _pieceId,
  editor,
  canResolve,
  currentUserId,
  onResolve,
  onUnresolve,
  onEdit,
  onDelete,
  onReply,
}: {
  comment: DispatchComment
  pieceId: string
  editor: Editor | null
  canResolve: boolean
  currentUserId: number | undefined
  onResolve: (id: string) => void
  onUnresolve: (id: string) => void
  onEdit: (id: string, body: string) => void
  onDelete: (id: string) => void
  onReply: (parentId: string, body: string) => void
}) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [repliesExpanded, setRepliesExpanded] = useState(true)

  const highlightAnchor = () => {
    if (!editor || !comment.block_id) return
    // Find the mark in the doc and select it
    const { doc } = editor.state
    let found = false
    doc.descendants((node, pos) => {
      if (found) return false
      const mark = node.marks.find(
        (m) => m.type.name === 'commentMark' && m.attrs.commentId === comment.id
      )
      if (mark) {
        editor.commands.setTextSelection({ from: pos, to: pos + node.nodeSize })
        found = true
        return false
      }
    })
  }

  const isResolved = comment.is_resolved
  const isAuthor = comment.author.id === currentUserId

  return (
    <Box
      className="dcp-thread-card"
      borderWidth="1px"
      borderRadius="lg"
      p={3}
      opacity={isResolved ? 0.55 : 1}
      transition="opacity 0.15s"
      cursor="pointer"
      onClick={highlightAnchor}
      _hover={{ borderColor: 'yellow.300' }}
    >
      {/* Root comment */}
      <Stack gap={2}>
        {comment.quoted_text && (
          <Box
            borderLeftWidth="3px"
            borderColor="yellow.400"
            pl={2}
            py={0.5}
            bg="yellow.50"
            _dark={{ bg: 'yellow.900', borderColor: 'yellow.500' }}
            borderRadius="sm"
          >
            <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }} lineClamp={2} fontStyle="italic">
              {comment.quoted_text}
            </Text>
          </Box>
        )}

        <HStack gap={2} align="flex-start">
          <Avatar.Root size="xs">
            <Avatar.Fallback>{(comment.author.display_name || comment.author.username)[0].toUpperCase()}</Avatar.Fallback>
          </Avatar.Root>
          <Box flex={1} minW={0}>
            <HStack gap={1} mb={0.5}>
              <Text fontSize="xs" fontWeight="600">{comment.author.display_name || comment.author.username}</Text>
              <Text fontSize="xs" color="gray.400">{timeAgo(comment.created_at)}</Text>
            </HStack>

            {editingId === comment.id ? (
              <Stack gap={1} onClick={(e) => e.stopPropagation()}>
                <Textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  size="sm"
                  rows={2}
                  autoFocus
                />
                <HStack gap={1}>
                  <Button size="xs" onClick={() => { onEdit(comment.id, editBody); setEditingId(null) }}>Save</Button>
                  <Button size="xs" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </HStack>
              </Stack>
            ) : (
              <Text fontSize="sm" whiteSpace="pre-wrap">{comment.body}</Text>
            )}
          </Box>

          {/* Actions */}
          <HStack gap={0.5} flexShrink={0} onClick={(e) => e.stopPropagation()}>
            {canResolve && !isResolved && (
              <Tooltip content="Resolve">
                <IconButton aria-label="Resolve" size="xs" variant="ghost" onClick={() => onResolve(comment.id)}>
                  <IconCheck size={13} />
                </IconButton>
              </Tooltip>
            )}
            {canResolve && isResolved && (
              <Tooltip content="Reopen">
                <IconButton aria-label="Reopen" size="xs" variant="ghost" onClick={() => onUnresolve(comment.id)}>
                  <IconX size={13} />
                </IconButton>
              </Tooltip>
            )}
            {isAuthor && editingId !== comment.id && (
              <Tooltip content="Edit">
                <IconButton aria-label="Edit" size="xs" variant="ghost"
                  onClick={() => { setEditingId(comment.id); setEditBody(comment.body) }}>
                  <IconPencil size={13} />
                </IconButton>
              </Tooltip>
            )}
            {(isAuthor || canResolve) && (
              <Tooltip content="Delete">
                <IconButton aria-label="Delete" size="xs" variant="ghost" colorPalette="red"
                  onClick={() => onDelete(comment.id)}>
                  <IconTrash size={13} />
                </IconButton>
              </Tooltip>
            )}
          </HStack>
        </HStack>

        {/* Replies toggle + list */}
        {comment.replies.length > 0 && (
          <Box pl={6}>
            <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); setRepliesExpanded(v => !v) }}>
              {repliesExpanded ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
              <Text ml={1}>{comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</Text>
            </Button>
            {repliesExpanded && (
              <Stack gap={2} mt={1}>
                {comment.replies.map((reply) => (
                  <HStack key={reply.id} gap={2} align="flex-start">
                    <Avatar.Root size="xs">
                      <Avatar.Fallback>{(reply.author.display_name || reply.author.username)[0].toUpperCase()}</Avatar.Fallback>
                    </Avatar.Root>
                    <Box flex={1} minW={0}>
                      <HStack gap={1} mb={0.5}>
                        <Text fontSize="xs" fontWeight="600">{reply.author.display_name || reply.author.username}</Text>
                        <Text fontSize="xs" color="gray.400">{timeAgo(reply.created_at)}</Text>
                      </HStack>
                      <Text fontSize="sm" whiteSpace="pre-wrap">{reply.body}</Text>
                    </Box>
                    {reply.author.id === currentUserId && (
                      <IconButton aria-label="Delete reply" size="xs" variant="ghost" colorPalette="red"
                        onClick={(e) => { e.stopPropagation(); onDelete(reply.id) }}>
                        <IconTrash size={12} />
                      </IconButton>
                    )}
                  </HStack>
                ))}
              </Stack>
            )}
          </Box>
        )}

        {/* Reply input */}
        <Box pl={6} onClick={(e) => e.stopPropagation()}>
          {replyOpen ? (
            <Stack gap={1}>
              <Textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Reply…"
                size="sm"
                rows={2}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    onReply(comment.id, replyBody)
                    setReplyBody('')
                    setReplyOpen(false)
                  }
                  if (e.key === 'Escape') { setReplyOpen(false); setReplyBody('') }
                }}
              />
              <HStack gap={1}>
                <Button size="xs"
                  disabled={!replyBody.trim()}
                  onClick={() => { onReply(comment.id, replyBody); setReplyBody(''); setReplyOpen(false) }}>
                  Reply
                </Button>
                <Button size="xs" variant="ghost" onClick={() => { setReplyOpen(false); setReplyBody('') }}>Cancel</Button>
              </HStack>
            </Stack>
          ) : (
            <Button size="xs" variant="ghost" color="gray.400" onClick={() => setReplyOpen(true)}>
              <IconMessageCircle size={12} />
              <Text ml={1}>Reply</Text>
            </Button>
          )}
        </Box>
      </Stack>
    </Box>
  )
}

export function DispatchCommentPanel({
  pieceId,
  editor,
  canResolve,
  currentUserId,
  pendingComment,
  onPendingCancel,
}: Props) {
  const {
    comments,
    counts,
    isLoading,
    createComment,
    editComment,
    deleteComment,
    resolveComment,
    unresolveComment,
  } = useDispatchComments(pieceId)

  const [pendingBody, setPendingBody] = useState('')
  const pendingRef = useRef<HTMLTextAreaElement | null>(null)

  const submitPending = async () => {
    if (!pendingComment || !pendingBody.trim()) return
    try {
      await createComment.mutateAsync({
        writing_piece: pieceId,
        body: pendingBody.trim(),
        block_id: pendingComment.blockId ?? undefined,
        anchor_from: pendingComment.anchorFrom,
        anchor_to: pendingComment.anchorTo,
        quoted_text: pendingComment.quotedText,
      })
      setPendingBody('')
      onPendingCancel()
    } catch {
      toaster.error({ title: 'Could not save comment' })
    }
  }

  const cancelPending = () => {
    // Remove the mark from the editor since the comment was abandoned
    if (pendingComment && editor) {
      editor.commands.unsetCommentMark(pendingComment.commentId)
    }
    setPendingBody('')
    onPendingCancel()
  }

  const handleEdit = async (id: string, body: string) => {
    try {
      await editComment.mutateAsync({ id, body })
    } catch {
      toaster.error({ title: 'Could not edit comment' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteComment.mutateAsync(id)
      if (editor) editor.commands.unsetCommentMark(id)
    } catch {
      toaster.error({ title: 'Could not delete comment' })
    }
  }

  const handleResolve = async (id: string) => {
    try { await resolveComment.mutateAsync(id) } catch { toaster.error({ title: 'Could not resolve' }) }
  }

  const handleUnresolve = async (id: string) => {
    try { await unresolveComment.mutateAsync(id) } catch { toaster.error({ title: 'Could not reopen' }) }
  }

  const handleReply = async (parentId: string, body: string) => {
    if (!body.trim()) return
    try {
      await createComment.mutateAsync({ writing_piece: pieceId, body: body.trim(), parent: parentId })
    } catch {
      toaster.error({ title: 'Could not post reply' })
    }
  }

  return (
    <Box
      className="dcp-root"
      w="280px"
      flexShrink={0}
      h="100%"
      overflowY="auto"
      borderLeftWidth="1px"
      borderColor="theme.border"
      px={3}
      py={4}
    >
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontWeight="600" fontSize="sm">Comments</Text>
        {counts && (
          <Text fontSize="xs" color="gray.500">
            {counts.total - counts.resolved} open · {counts.resolved} resolved
          </Text>
        )}
      </Flex>

      {isLoading && (
        <Flex justify="center" py={6}><Spinner size="sm" /></Flex>
      )}

      <VStack gap={3} align="stretch">
        {/* Pending (new) comment compose box */}
        {pendingComment && (
          <Box borderWidth="1px" borderColor="yellow.400" borderRadius="lg" p={3} bg="yellow.50" _dark={{ bg: 'yellow.950' }}>
            {pendingComment.quotedText && (
              <Box borderLeftWidth="3px" borderColor="yellow.400" pl={2} mb={2}>
                <Text fontSize="xs" fontStyle="italic" lineClamp={2} color="gray.600" _dark={{ color: 'gray.300' }}>
                  {pendingComment.quotedText}
                </Text>
              </Box>
            )}
            <Textarea
              ref={pendingRef}
              value={pendingBody}
              onChange={(e) => setPendingBody(e.target.value)}
              placeholder="Add a comment…"
              size="sm"
              rows={3}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitPending()
                if (e.key === 'Escape') cancelPending()
              }}
            />
            <HStack gap={2} mt={2}>
              <Button size="xs" onClick={submitPending} disabled={!pendingBody.trim() || createComment.isPending}>
                Comment
              </Button>
              <Button size="xs" variant="ghost" onClick={cancelPending}>Cancel</Button>
            </HStack>
          </Box>
        )}

        {/* Existing threads */}
        {!isLoading && comments.length === 0 && !pendingComment && (
          <Text fontSize="sm" color="gray.400" textAlign="center" py={6}>
            Select text to add a comment.
          </Text>
        )}

        {comments.map((comment) => (
          <CommentThreadCard
            key={comment.id}
            comment={comment}
            pieceId={pieceId}
            editor={editor}
            canResolve={canResolve}
            currentUserId={currentUserId}
            onResolve={handleResolve}
            onUnresolve={handleUnresolve}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReply={handleReply}
          />
        ))}
      </VStack>
    </Box>
  )
}

// src/hooks/useRealtimeEvents.ts

import { useEffect, useCallback, useRef } from 'react'
import { useSocket } from '../useSocket' // Assumes you have this

type Entity = 'forum' | 'discussion'
type EventType = 'typing' | 'reaction' | 'post_created' | 'discussion_created'

interface RealtimeListener {
  entity: Entity
  entitySlug: string
  type: EventType
  callback: (payload: Record<string, unknown>, user: string) => void
}

export const useRealtimeEvents = () => {
  const socket = useSocket()
  const listenersRef = useRef<RealtimeListener[]>([])

  // Join a threadworks room
  const joinRoom = useCallback(
    (entity: Entity, entitySlug: string) => {
      if (!socket) return
      socket.emit('join_threadworks', { entity, entitySlug })
    },
    [socket]
  )

  // Leave a threadworks room
  const leaveRoom = useCallback(
    (entity: Entity, entitySlug: string) => {
      if (!socket) return
      socket.emit('leave_threadworks', { entity, entitySlug })
    },
    [socket]
  )

  // Subscribe to a specific event
  const subscribe = useCallback(
    (
      entity: Entity,
      entitySlug: string,
      type: EventType,
      callback: (payload: Record<string, unknown>, user: string) => void
    ) => {
      const listener: RealtimeListener = { entity, entitySlug, type, callback }
      listenersRef.current.push(listener)

      return () => {
        listenersRef.current = listenersRef.current.filter((existing) => existing !== listener)
      }
    },
    []
  )

  // Emit a threadworks event
  const emit = useCallback(
    (entity: Entity, entitySlug: string, type: EventType, payload: Record<string, unknown>) => {
      if (!socket) return
      socket.emit('threadworks:realtime_event', { entity, entitySlug, type, payload })
    },
    [socket]
  )

  // Listen for threadworks updates from server
  useEffect(() => {
    if (!socket) return

    const handleUpdate = (data: {
      entity: Entity
      entitySlug: string
      type: EventType
      payload: Record<string, unknown>
      user: string
      timestamp: number
    }) => {
      listenersRef.current.forEach((listener: RealtimeListener) => {
        if (
          listener.entity === data.entity &&
          listener.entitySlug === data.entitySlug &&
          listener.type === data.type
        ) {
          listener.callback(data.payload, data.user)
        }
      })
    }

    socket.on('threadworks:update', handleUpdate)

    return () => {
      socket.off('threadworks:update', handleUpdate)
    }
  }, [socket])

  return { joinRoom, leaveRoom, subscribe, emit }
}

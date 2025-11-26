export const SOCKET_EVENTS = {
  // Shared
  CONNECT: "connect",
  DISCONNECT: "disconnect",

  // Chat
  JOIN_CHAT: "join_chat",
  NEW_MESSAGE: "message",
  TYPING: "typing",

  // Docs
  JOIN_DOCUMENT_ROOM: "join_document_room",
  LEAVE_DOCUMENT_ROOM: "leave_document_room",
  DOC_UPDATE: "doc_update",
  DOC_AWARENESS: "doc_awareness",

  // Y.js specific events
  YJS_UPDATE: "yjs-update",
  AWARENESS_UPDATE: "awareness-update",
  REQUEST_SYNC: "request-sync",
  SYNC_COMPLETE: "sync-complete",
};

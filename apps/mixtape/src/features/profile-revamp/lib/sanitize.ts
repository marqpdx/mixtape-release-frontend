// Markdown-lite: allow only *em* and **strong** in Q&A answers. Strip everything else.

export function sanitizeQA(raw: string): string {
  return raw
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/<(?!\/?(strong|em)\b)[^>]*>/g, '')
    .trim();
}

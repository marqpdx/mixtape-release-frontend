import { isAxiosError } from "axios";

/** Preserve DRF's nested field paths instead of displaying [object Object]. */
export function argusErrorMessage(cause: unknown): string {
  if (isAxiosError(cause) && cause.response?.status === 400) {
    const messages: string[] = [];
    const visit = (value: unknown, path: string, depth: number) => {
      if (depth > 4 || messages.length >= 8) return;
      if (typeof value === "string") messages.push(path ? `${path}: ${value}` : value);
      else if (Array.isArray(value)) value.forEach((item) => visit(item, path, depth + 1));
      else if (value && typeof value === "object") {
        Object.entries(value).forEach(([key, item]) => visit(item, path ? `${path}.${key}` : key, depth + 1));
      }
    };
    visit(cause.response.data, "", 0);
    if (messages.length) return messages.join("; ");
  }
  return cause instanceof Error ? cause.message : "Request failed. Refresh status before trying again.";
}

// src/lib/utils/dateFormatters.ts

/**
 * Format a date string to a human-readable format
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "Jan 15, 2025 at 6:00 PM")
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'No date';

  try {
    const date = new Date(dateString);

    // Format: "Jan 15, 2025 at 6:00 PM"
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Format a date string to just the date (no time)
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "Jan 15, 2025")
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'No date';

  try {
    const date = new Date(dateString);

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Format a date string to just the time
 * @param dateString - ISO date string
 * @returns Formatted time string (e.g., "6:00 PM")
 */
export function formatTime(dateString: string | null | undefined): string {
  if (!dateString) return 'No time';

  try {
    const date = new Date(dateString);

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return dateString;
  }
}

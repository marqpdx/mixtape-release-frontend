// src/lib/almanac/recurrenceUtils.ts

import type { RecurrenceConfig } from '@/components/almanac/RecurrenceFeaturelet';

/**
 * Convert RecurrenceConfig to iCalendar RRULE string
 * https://icalendar.org/iCalendar-RFC-5545/3-8-5-3-recurrence-rule.html
 */
export function configToRRule(config: RecurrenceConfig): string | null {
  if (!config.pattern || config.pattern === 'custom') {
    return null;
  }

  const parts: string[] = [];

  // FREQ (required)
  const freqMap = {
    daily: 'DAILY',
    weekly: 'WEEKLY',
    monthly: 'MONTHLY',
    yearly: 'YEARLY',
  };
  parts.push(`FREQ=${freqMap[config.pattern]}`);

  // INTERVAL
  if (config.frequency > 1) {
    parts.push(`INTERVAL=${config.frequency}`);
  }

  // BYDAY (for weekly patterns)
  if (config.pattern === 'weekly' && config.daysOfWeek.length > 0) {
    const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const days = config.daysOfWeek.map(d => dayMap[d]).join(',');
    parts.push(`BYDAY=${days}`);
  }

  // End condition
  if (config.endType === 'on_date' && config.endDate) {
    // Convert to YYYYMMDD format
    const date = new Date(config.endDate);
    const until = date.toISOString().split('T')[0].replace(/-/g, '');
    parts.push(`UNTIL=${until}`);
  } else if (config.endType === 'after_count' && config.occurrenceCount) {
    parts.push(`COUNT=${config.occurrenceCount}`);
  }

  return parts.join(';');
}

/**
 * Parse RRULE string back to RecurrenceConfig
 * Useful for editing existing recurring events
 */
export function rruleToConfig(rrule: string): Partial<RecurrenceConfig> | null {
  if (!rrule) return null;

  const config: Partial<RecurrenceConfig> = {
    frequency: 1,
    daysOfWeek: [],
    endType: 'never',
    endDate: null,
    occurrenceCount: null,
  };

  const parts = rrule.split(';');

  for (const part of parts) {
    const [key, value] = part.split('=');

    switch (key) {
      case 'FREQ':
        const freqMap: Record<string, RecurrenceConfig['pattern']> = {
          'DAILY': 'daily',
          'WEEKLY': 'weekly',
          'MONTHLY': 'monthly',
          'YEARLY': 'yearly',
        };
        config.pattern = freqMap[value] || null;
        break;

      case 'INTERVAL':
        config.frequency = parseInt(value) || 1;
        break;

      case 'BYDAY':
        const dayMap: Record<string, number> = {
          'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6
        };
        config.daysOfWeek = value.split(',').map(d => dayMap[d]).filter(d => d !== undefined);
        break;

      case 'UNTIL':
        config.endType = 'on_date';
        // Parse YYYYMMDD format
        const year = value.substring(0, 4);
        const month = value.substring(4, 6);
        const day = value.substring(6, 8);
        config.endDate = `${year}-${month}-${day}`;
        break;

      case 'COUNT':
        config.endType = 'after_count';
        config.occurrenceCount = parseInt(value) || null;
        break;
    }
  }

  return config;
}

/**
 * Get human-readable description of recurrence pattern
 */
export function getRecurrenceDescription(rrule: string): string {
  const config = rruleToConfig(rrule);
  if (!config || !config.pattern) return '';

  let text = '';

  if (config.pattern === 'daily') {
    text = config.frequency === 1 ? 'Daily' : `Every ${config.frequency} days`;
  } else if (config.pattern === 'weekly') {
    text = config.frequency === 1 ? 'Weekly' : `Every ${config.frequency} weeks`;
    if (config.daysOfWeek && config.daysOfWeek.length > 0) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const selectedDays = config.daysOfWeek.map(d => dayNames[d]);
      text += ` on ${selectedDays.join(', ')}`;
    }
  } else if (config.pattern === 'monthly') {
    text = config.frequency === 1 ? 'Monthly' : `Every ${config.frequency} months`;
  } else if (config.pattern === 'yearly') {
    text = config.frequency === 1 ? 'Yearly' : `Every ${config.frequency} years`;
  }

  if (config.endType === 'on_date' && config.endDate) {
    text += `, until ${new Date(config.endDate).toLocaleDateString()}`;
  } else if (config.endType === 'after_count' && config.occurrenceCount) {
    text += `, ${config.occurrenceCount} times`;
  }

  return text;
}

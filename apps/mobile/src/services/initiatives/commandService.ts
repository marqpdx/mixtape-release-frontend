import type {
  InitiativeSessionItem,
  InitiativeVerb,
  ParsedInitiativeCommand,
} from '../../types/initiatives';

const VERBS: InitiativeVerb[] = [
  'note',
  'remind',
  'task',
  'draft',
  'add',
  'find',
  'research',
  'summarize',
];

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildAcknowledgmentBody(parsed: ParsedInitiativeCommand): string | null {
  const payload = parsed.resultPayload ?? {};
  const objectType = typeof payload.object_type === 'string' ? payload.object_type : null;

  if (objectType === 'note' && payload.note && typeof payload.note === 'object') {
    const note = payload.note as Record<string, unknown>;
    return [note.title, note.body].filter((value): value is string => typeof value === 'string' && value.length > 0).join('\n');
  }

  if (objectType === 'reminder' && payload.reminder && typeof payload.reminder === 'object') {
    const reminder = payload.reminder as Record<string, unknown>;
    return [
      reminder.title,
      reminder.body,
      typeof reminder.remind_at === 'string' ? `Remind at: ${reminder.remind_at}` : null,
    ]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join('\n');
  }

  if (objectType === 'task' && payload.task && typeof payload.task === 'object') {
    const task = payload.task as Record<string, unknown>;
    return [
      task.title,
      task.details,
      typeof task.status === 'string' ? `Status: ${task.status}` : null,
    ]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join('\n');
  }

  if (typeof payload.detail === 'string') {
    return payload.detail;
  }

  return null;
}

function buildGeneratedText(verb: InitiativeVerb, content: string) {
  if (verb === 'draft') {
    return `Subject: ${sentenceCase(content || 'Untitled draft')}\n\nHi team,\n\n${sentenceCase(
      content || 'Draft details go here.'
    )}.\n\nBest,\nMixtape`;
  }
  if (verb === 'summarize') {
    return `Summary:\n- ${sentenceCase(content || 'No source content provided yet.')}\n- Next action can be confirmed after backend routing is connected.`;
  }
  return undefined;
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseInitiativesCommand(rawInput: string): ParsedInitiativeCommand {
  const trimmed = rawInput.trim();
  const [firstWord, ...restWords] = trimmed.split(/\s+/);
  const normalizedVerb = firstWord?.toLowerCase();
  const content = restWords.join(' ').trim();

  if (!normalizedVerb || !VERBS.includes(normalizedVerb as InitiativeVerb)) {
    return {
      verb: null,
      rawInput,
      confidence: 'low',
      title: 'Confirm command',
      summary: 'The command surface could not confidently classify a verb yet.',
      fields: [
        { label: 'Input', value: trimmed || 'No input entered.' },
        {
          label: 'Suggestion',
          value:
            'Start with note, remind, task, draft, add, find, research, or summarize.',
        },
      ],
    };
  }

  const verb = normalizedVerb as InitiativeVerb;
  const generatedText = buildGeneratedText(verb, content);
  const fields =
    verb === 'remind'
      ? [
          { label: 'Verb', value: 'remind' },
          { label: 'Action', value: content || 'No reminder details yet.' },
          { label: 'Time', value: 'To be resolved by parse contract' },
        ]
      : verb === 'task'
        ? [
            { label: 'Verb', value: 'task' },
            { label: 'Task', value: content || 'No task details yet.' },
            { label: 'Assignee', value: 'To be resolved by parse contract' },
          ]
        : verb === 'add'
          ? [
              { label: 'Verb', value: 'add' },
              { label: 'Items', value: content || 'No items detected yet.' },
              { label: 'Target', value: 'To be resolved by parse contract' },
            ]
          : [
              { label: 'Verb', value: verb },
              { label: 'Content', value: content || 'No additional content detected yet.' },
            ];

  return {
    verb,
    rawInput,
    confidence: generatedText ? 'medium' : 'high',
    title: `${sentenceCase(verb)} command`,
    summary:
      verb === 'draft' || verb === 'summarize'
        ? 'Generated output is editable in place before confirmation.'
        : 'Review the parsed action before execution is wired to backend contracts.',
    fields,
    generatedText,
  };
}

export function createPendingCommandItem(rawInput: string): InitiativeSessionItem {
  return {
    id: makeId('command'),
    kind: 'command',
    title: 'Pending command',
    body: rawInput.trim(),
    createdAt: nowIso(),
    tone: 'neutral',
    verb: null,
  };
}

export function createVoiceProcessingItem(): InitiativeSessionItem {
  return {
    id: makeId('voice'),
    kind: 'processing_voice',
    title: 'Processing voice command',
    body: 'Native STT and server fallback are not wired yet. This placeholder reserves the Notebook-like processing path.',
    createdAt: nowIso(),
    tone: 'info',
    verb: null,
  };
}

export function createErrorItem(
  title: string,
  body: string,
  verb: InitiativeVerb | null = null
): InitiativeSessionItem {
  return {
    id: makeId('error'),
    kind: 'error',
    title,
    body,
    createdAt: nowIso(),
    tone: 'error',
    verb,
  };
}

export function createResultItem(parsed: ParsedInitiativeCommand): InitiativeSessionItem {
  const verbLabel = parsed.verb ? sentenceCase(parsed.verb) : 'Command';
  const detail = buildAcknowledgmentBody(parsed);
  const body = parsed.generatedText
    ? parsed.generatedText
    : detail || parsed.fields.map((field) => `${field.label}: ${field.value}`).join('\n');

  return {
    id: makeId('result'),
    kind: 'result',
    title: parsed.resultType === 'acknowledgment' ? `${verbLabel} saved` : `${verbLabel} ready`,
    body,
    createdAt: nowIso(),
    tone: 'success',
    verb: parsed.verb,
  };
}

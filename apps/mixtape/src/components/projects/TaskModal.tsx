'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Box,
  Button,
  createListCollection,
  Field,
  HStack,
  Input,
  Portal,
  Select,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from '@/components/ui/dialog';
import type {
  Task,
  TaskCreatePayload,
  TaskSeverity,
  TaskTimeliness,
  TaskType,
  TaskUpdatePayload,
} from '@mixtape/api/clients/projects/projectsApi';
import { MemberPicker, type MemberCandidate } from '@/components/common/MemberPicker';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: TaskCreatePayload | TaskUpdatePayload) => Promise<void>;
  onArchive?: () => Promise<void>;
  task?: Task | null;
  taskTypes: TaskType[];
  defaultColumnId?: string;
  columns: { id: string; title: string }[];
  memberCandidates?: MemberCandidate[];
}

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: '🔴 Critical' },
];

const TIMELINESS_OPTIONS = [
  { value: 'pressing', label: 'Pressing' },
  { value: 'normal', label: 'Normal' },
  { value: 'eventually', label: 'Eventually' },
];

function autoDate(severity: TaskSeverity, timeliness: TaskTimeliness): string {
  const today = new Date();
  if (severity === 'critical') return today.toISOString().slice(0, 10);
  if (timeliness === 'pressing') {
    today.setDate(today.getDate() + 1);
    return today.toISOString().slice(0, 10);
  }
  if (timeliness === 'normal') {
    today.setDate(today.getDate() + 7);
    return today.toISOString().slice(0, 10);
  }
  today.setDate(today.getDate() + 30);
  return today.toISOString().slice(0, 10);
}

export function TaskModal({
  open,
  onClose,
  onSave,
  onArchive,
  task,
  taskTypes,
  defaultColumnId,
  columns,
  memberCandidates = [],
}: TaskModalProps) {
  const isEdit = !!task;

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [typeId, setTypeId] = useState<string>('');
  const [severity, setSeverity] = useState<TaskSeverity>('low');
  const [timeliness, setTimeliness] = useState<TaskTimeliness>('normal');
  const [signOff, setSignOff] = useState('');
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [dueDateOverridden, setDueDateOverridden] = useState(false);
  const [columnId, setColumnId] = useState(defaultColumnId ?? '');
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [criticalConfirm, setCriticalConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setSummary(task.summary ?? '');
      setTypeId(task.task_type?.id ?? '');
      setSeverity(task.severity);
      setTimeliness(task.timeliness);
      setSignOff(task.sign_off_criteria ?? '');
      setAssigneeId(task.assignee_id ? Number(task.assignee_id) : null);
      setDueDate(task.due_date ?? '');
      setDueDateOverridden(task.due_date_overridden);
      setColumnId(task.column);
    } else {
      setTitle('');
      setSummary('');
      setTypeId('');
      setSeverity('low');
      setTimeliness('normal');
      setSignOff('');
      setAssigneeId(null);
      setDueDate(autoDate('low', 'normal'));
      setDueDateOverridden(false);
      setColumnId(defaultColumnId ?? '');
    }
    setCriticalConfirm(false);
    setError(null);
  }, [open, task, defaultColumnId]);

  // When severity changes to critical, lock timeliness to pressing and set date=today
  const handleSeverityChange = (next: TaskSeverity) => {
    if (next === 'critical' && !criticalConfirm) {
      setCriticalConfirm(true);
      return;
    }
    setSeverity(next);
    if (next === 'critical') {
      setTimeliness('pressing');
      if (!dueDateOverridden) setDueDate(autoDate('critical', 'pressing'));
    } else if (!dueDateOverridden) {
      setDueDate(autoDate(next, timeliness));
    }
  };

  const handleTimelinessChange = (next: TaskTimeliness) => {
    if (severity === 'critical') return;
    setTimeliness(next);
    if (!dueDateOverridden) setDueDate(autoDate(severity, next));
  };

  const handleDueDateChange = (value: string) => {
    setDueDate(value);
    setDueDateOverridden(true);
  };

  const handleConfirmCritical = () => {
    setCriticalConfirm(false);
    handleSeverityChange('critical');
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: TaskCreatePayload & TaskUpdatePayload = {
        title: title.trim(),
        summary: summary.trim() || undefined,
        task_type_id: typeId || null,
        severity,
        timeliness,
        assignee_id: assigneeId,
        sign_off_criteria: signOff.trim() || undefined,
        due_date: dueDate || null,
        ...(!isEdit && columnId ? { column_id: columnId } : {}),
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!onArchive) return;
    setArchiving(true);
    try {
      await onArchive();
      onClose();
    } finally {
      setArchiving(false);
    }
  };

  const typeCollection = useMemo(() => createListCollection({
    items: [
      { value: '', label: 'No type' },
      ...taskTypes.map(t => ({ value: t.id, label: t.name })),
    ],
  }), [taskTypes]);

  const severityCollection = useMemo(() => createListCollection({ items: SEVERITY_OPTIONS }), []);
  const timelinessCollection = useMemo(() => createListCollection({ items: TIMELINESS_OPTIONS }), []);
  const columnCollection = useMemo(() => createListCollection({
    items: columns.map(c => ({ value: c.id, label: c.title })),
  }), [columns]);

  const isCritical = severity === 'critical';

  return (
    <>
      <DialogRoot open={open} onOpenChange={({ open: o }) => { if (!o) onClose(); }} size="lg">
        <DialogContent className="tm-content">
          <DialogHeader className="tm-header">
            <Text fontWeight="semibold">{isEdit ? 'Edit task' : 'New task'}</Text>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody className="tm-body">
            {isCritical && (
              <Box
                mb={4}
                p={3}
                bg="red.50"
                borderWidth="1px"
                borderColor="red.200"
                borderRadius="md"
                _dark={{ bg: 'red.950', borderColor: 'red.700' }}
              >
                <Text fontSize="sm" fontWeight="semibold" color="red.700" _dark={{ color: 'red.300' }}>
                  🔴 Critical severity — now-level incident
                </Text>
                <Text fontSize="xs" color="red.600" mt={1} _dark={{ color: 'red.400' }}>
                  Critical should be rare. Due date is locked to today. Timeliness is forced to Pressing.
                </Text>
              </Box>
            )}

            <VStack gap={4} align="stretch">
              <Field.Root required>
                <Field.Label>Title</Field.Label>
                <Input
                  value={title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Description</Field.Label>
                <Textarea
                  value={summary}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setSummary(e.target.value)}
                  placeholder="More detail (optional)"
                  rows={3}
                />
              </Field.Root>

              <HStack gap={4} align="flex-start" flexWrap="wrap">
                <Field.Root flex={1} minW="140px">
                  <Field.Label>Type</Field.Label>
                  <Select.Root
                    collection={typeCollection}
                    value={[typeId]}
                    onValueChange={({ value }) => setTypeId(value[0] ?? '')}
                    size="sm"
                  >
                    <Select.Control>
                      <Select.Trigger><Select.ValueText placeholder="No type" /></Select.Trigger>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {typeCollection.items.map(item => (
                            <Select.Item key={item.value} item={item}>{item.label}</Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>

                <Field.Root flex={1} minW="140px">
                  <Field.Label>Severity</Field.Label>
                  <Select.Root
                    collection={severityCollection}
                    value={[severity]}
                    onValueChange={({ value }) => handleSeverityChange((value[0] ?? 'low') as TaskSeverity)}
                    size="sm"
                  >
                    <Select.Control>
                      <Select.Trigger><Select.ValueText /></Select.Trigger>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {severityCollection.items.map(item => (
                            <Select.Item key={item.value} item={item}>{item.label}</Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>

                <Field.Root flex={1} minW="140px">
                  <Field.Label>
                    Timeliness
                    {isCritical && <Text as="span" fontSize="xs" color="red.500" ml={1}>(locked)</Text>}
                  </Field.Label>
                  <Select.Root
                    collection={timelinessCollection}
                    value={[timeliness]}
                    onValueChange={({ value }) => handleTimelinessChange((value[0] ?? 'normal') as TaskTimeliness)}
                    size="sm"
                    disabled={isCritical}
                  >
                    <Select.Control>
                      <Select.Trigger><Select.ValueText /></Select.Trigger>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {timelinessCollection.items.map(item => (
                            <Select.Item key={item.value} item={item}>{item.label}</Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>
              </HStack>

              <HStack gap={4} flexWrap="wrap">
                <Field.Root flex={1} minW="160px">
                  <Field.Label>
                    Due date
                    {!dueDateOverridden && <Text as="span" fontSize="xs" color="gray.400" ml={1}>(auto)</Text>}
                    {dueDateOverridden && <Text as="span" fontSize="xs" color="blue.400" ml={1}>(overridden)</Text>}
                  </Field.Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleDueDateChange(e.target.value)}
                    disabled={isCritical}
                    size="sm"
                  />
                </Field.Root>

                {!isEdit && (
                  <Field.Root flex={1} minW="160px">
                    <Field.Label>Column</Field.Label>
                    <Select.Root
                      collection={columnCollection}
                      value={columnId ? [columnId] : []}
                      onValueChange={({ value }) => setColumnId(value[0] ?? '')}
                      size="sm"
                    >
                      <Select.Control>
                        <Select.Trigger><Select.ValueText placeholder="Choose column" /></Select.Trigger>
                      </Select.Control>
                      <Portal>
                        <Select.Positioner>
                          <Select.Content>
                            {columnCollection.items.map(item => (
                              <Select.Item key={item.value} item={item}>{item.label}</Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                  </Field.Root>
                )}
              </HStack>

              <Field.Root>
                <Field.Label>Sign-off criteria</Field.Label>
                <Textarea
                  value={signOff}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setSignOff(e.target.value)}
                  placeholder="How do we know this is done? e.g. 'Login works end-to-end in staging'"
                  rows={2}
                />
              </Field.Root>

              {memberCandidates.length > 0 && (
                <Field.Root>
                  <Field.Label>
                    Assignee
                    {assigneeId !== null && (
                      <Button
                        size="xs"
                        variant="ghost"
                        colorPalette="gray"
                        ml={2}
                        onClick={() => setAssigneeId(null)}
                      >
                        Clear
                      </Button>
                    )}
                  </Field.Label>
                  {assigneeId !== null && (
                    <Text fontSize="sm" color="blue.600" mb={1} _dark={{ color: 'blue.300' }}>
                      {memberCandidates.find(m => m.id === assigneeId)?.displayName ?? 'Assigned'}
                    </Text>
                  )}
                  <MemberPicker
                    candidates={memberCandidates}
                    selected={assigneeId !== null ? [assigneeId] : []}
                    onToggle={id => setAssigneeId(prev => prev === Number(id) ? null : Number(id))}
                    multiSelect={false}
                    maxH="160px"
                    emptyText="No group members available."
                  />
                </Field.Root>
              )}

              {error && <Text fontSize="sm" color="red.500">{error}</Text>}
            </VStack>
          </DialogBody>

          <DialogFooter className="tm-footer">
            <HStack justify="space-between" w="full">
              {isEdit && onArchive ? (
                <Button
                  variant="ghost"
                  colorPalette="red"
                  size="sm"
                  onClick={handleArchive}
                  loading={archiving}
                >
                  Archive
                </Button>
              ) : <Box />}
              <HStack gap={2}>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button
                  colorPalette={isCritical ? 'red' : 'blue'}
                  onClick={handleSave}
                  loading={saving}
                  disabled={!title.trim()}
                >
                  {isEdit ? 'Save changes' : 'Create task'}
                </Button>
              </HStack>
            </HStack>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Critical confirmation dialog */}
      <DialogRoot open={criticalConfirm} onOpenChange={({ open: o }) => { if (!o) setCriticalConfirm(false); }}>
        <DialogContent className="tm-critical-confirm" maxW="400px">
          <DialogHeader>
            <Text fontWeight="semibold">Mark as Critical?</Text>
          </DialogHeader>
          <DialogBody>
            <Text fontSize="sm">
              Critical severity signals a <strong>now-level incident</strong> — something broken or blocked that can't wait. It sets due date to today and locks timeliness to Pressing.
            </Text>
            <Text fontSize="sm" mt={2} color="gray.500">
              Critical should be rare. Use High severity for urgent-but-not-emergency work.
            </Text>
          </DialogBody>
          <DialogFooter>
            <HStack gap={2} justify="flex-end">
              <Button variant="ghost" onClick={() => setCriticalConfirm(false)}>Cancel</Button>
              <Button colorPalette="red" onClick={handleConfirmCritical}>
                Yes, mark Critical
              </Button>
            </HStack>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
}

// src/components/almanac/RecurrenceFeaturelet.tsx

'use client';

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Badge,
  Heading,
  RadioGroup,
  Field,
  type RadioGroupValueChangeDetails,
} from '@chakra-ui/react';
import {
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from '@/components/ui/dialog';

export interface RecurrenceConfig {
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | null;
  frequency: number; // Every N days/weeks/months
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  endType: 'never' | 'on_date' | 'after_count';
  endDate: string | null;
  occurrenceCount: number | null;
}

interface RecurrenceFeatureletProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: RecurrenceConfig) => void;
  initialConfig?: RecurrenceConfig;
}

const DEFAULT_CONFIG: RecurrenceConfig = {
  pattern: null,
  frequency: 1,
  daysOfWeek: [],
  endType: 'never',
  endDate: null,
  occurrenceCount: null,
};

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export function RecurrenceFeaturelet({
  isOpen,
  onClose,
  onSave,
  initialConfig,
}: RecurrenceFeatureletProps) {
  const [config, setConfig] = useState<RecurrenceConfig>(
    initialConfig || DEFAULT_CONFIG
  );

  const handlePatternChange = (pattern: string | null) => {
    setConfig(prev => ({
      ...prev,
      pattern: pattern as RecurrenceConfig['pattern'],
      // Reset days of week when pattern changes
      daysOfWeek: pattern === 'weekly' ? prev.daysOfWeek : [],
    }));
  };

  const handleDayToggle = (day: number) => {
    setConfig(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const handleCancel = () => {
    setConfig(initialConfig || DEFAULT_CONFIG);
    onClose();
  };

  const getPreviewText = () => {
    if (!config.pattern) return 'No recurrence set';

    let text = '';

    // Pattern description
    if (config.pattern === 'daily') {
      text = config.frequency === 1 ? 'Daily' : `Every ${config.frequency} days`;
    } else if (config.pattern === 'weekly') {
      text = config.frequency === 1 ? 'Weekly' : `Every ${config.frequency} weeks`;
      if (config.daysOfWeek.length > 0) {
        const dayNames = config.daysOfWeek.map(d => DAYS_OF_WEEK[d].label);
        text += ` on ${dayNames.join(', ')}`;
      }
    } else if (config.pattern === 'monthly') {
      text = config.frequency === 1 ? 'Monthly' : `Every ${config.frequency} months`;
    } else if (config.pattern === 'yearly') {
      text = config.frequency === 1 ? 'Yearly' : `Every ${config.frequency} years`;
    }

    // End description
    if (config.endType === 'on_date' && config.endDate) {
      text += `, until ${new Date(config.endDate).toLocaleDateString()}`;
    } else if (config.endType === 'after_count' && config.occurrenceCount) {
      text += `, ${config.occurrenceCount} times`;
    }

    return text;
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={({ open }: { open: boolean }) => !open && handleCancel()} size="lg">
      <DialogBackdrop />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Recurrence</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody>
          <VStack align="stretch" gap={6}>
            {/* Pattern Selection */}
            <Field.Root>
              <Field.Label>Recurrence Pattern</Field.Label>
              <RadioGroup.Root
                value={config.pattern || ''}
                onValueChange={(details: RadioGroupValueChangeDetails) =>
                  handlePatternChange(details.value as NonNullable<RecurrenceConfig['pattern']>)
                }
              >
                <VStack align="stretch" gap={2}>
                  <RadioGroup.Item value="daily">
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator />
                    <RadioGroup.ItemText>Daily</RadioGroup.ItemText>
                  </RadioGroup.Item>
                  <RadioGroup.Item value="weekly">
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator />
                    <RadioGroup.ItemText>Weekly</RadioGroup.ItemText>
                  </RadioGroup.Item>
                  <RadioGroup.Item value="monthly">
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator />
                    <RadioGroup.ItemText>Monthly</RadioGroup.ItemText>
                  </RadioGroup.Item>
                  <RadioGroup.Item value="yearly">
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator />
                    <RadioGroup.ItemText>Yearly</RadioGroup.ItemText>
                  </RadioGroup.Item>
                  <RadioGroup.Item value="custom">
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator />
                    <RadioGroup.ItemText>Custom Schedule</RadioGroup.ItemText>
                  </RadioGroup.Item>
                </VStack>
              </RadioGroup.Root>
            </Field.Root>

            {/* Frequency */}
            {config.pattern && config.pattern !== 'custom' && (
              <Field.Root>
                <Field.Label>Repeat every</Field.Label>
                <HStack>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={config.frequency}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setConfig(prev => ({
                        ...prev,
                        frequency: parseInt(e.target.value) || 1,
                      }))
                    }
                    width="100px"
                  />
                  <Text>
                    {config.pattern === 'daily' && 'day(s)'}
                    {config.pattern === 'weekly' && 'week(s)'}
                    {config.pattern === 'monthly' && 'month(s)'}
                    {config.pattern === 'yearly' && 'year(s)'}
                  </Text>
                </HStack>
              </Field.Root>
            )}

            {/* Days of Week (for weekly pattern) */}
            {config.pattern === 'weekly' && (
              <Field.Root>
                <Field.Label>Repeat on</Field.Label>
                <HStack gap={2} flexWrap="wrap">
                  {DAYS_OF_WEEK.map(day => (
                    <Button
                      key={day.value}
                      size="sm"
                      variant={config.daysOfWeek.includes(day.value) ? 'solid' : 'outline'}
                      colorScheme={config.daysOfWeek.includes(day.value) ? 'blue' : 'gray'}
                      onClick={() => handleDayToggle(day.value)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </HStack>
              </Field.Root>
            )}

            {/* Custom Schedule Note */}
            {config.pattern === 'custom' && (
              <Box p={4} bg="blue.50" borderRadius="md">
                <Text fontSize="sm" color="blue.900">
                  Custom schedule allows you to specify specific dates for this event series.
                  After saving, you'll be able to add individual occurrence dates.
                </Text>
              </Box>
            )}

            {/* End Condition */}
            {config.pattern && config.pattern !== 'custom' && (
              <>
                <Field.Root>
                  <Field.Label>Ends</Field.Label>
                  <RadioGroup.Root
                    value={config.endType}
                    onValueChange={(details: RadioGroupValueChangeDetails) =>
                      setConfig(prev => ({
                        ...prev,
                        endType: details.value as RecurrenceConfig['endType'],
                      }))
                    }
                  >
                    <VStack align="stretch" gap={3}>
                      <RadioGroup.Item value="never">
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText>Never</RadioGroup.ItemText>
                      </RadioGroup.Item>

                      <HStack>
                        <RadioGroup.Item value="on_date">
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator />
                          <RadioGroup.ItemText>On</RadioGroup.ItemText>
                        </RadioGroup.Item>
                        <Input
                          type="date"
                          value={config.endDate || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setConfig(prev => ({
                              ...prev,
                              endDate: e.target.value,
                              endType: 'on_date',
                            }))
                          }
                          disabled={config.endType !== 'on_date'}
                          size="sm"
                        />
                      </HStack>

                      <HStack>
                        <RadioGroup.Item value="after_count">
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator />
                          <RadioGroup.ItemText>After</RadioGroup.ItemText>
                        </RadioGroup.Item>
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          value={config.occurrenceCount || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setConfig(prev => ({
                              ...prev,
                              occurrenceCount: parseInt(e.target.value) || null,
                              endType: 'after_count',
                            }))
                          }
                          disabled={config.endType !== 'after_count'}
                          width="100px"
                          size="sm"
                        />
                        <Text fontSize="sm">occurrences</Text>
                      </HStack>
                    </VStack>
                  </RadioGroup.Root>
                </Field.Root>
              </>
            )}

            {/* Preview */}
            {config.pattern && (
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontWeight="semibold" fontSize="sm" mb={2}>
                  Preview
                </Text>
                <Text fontSize="sm" color="gray.700">
                  {getPreviewText()}
                </Text>
              </Box>
            )}
          </VStack>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            disabled={!config.pattern}
          >
            Save Recurrence
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

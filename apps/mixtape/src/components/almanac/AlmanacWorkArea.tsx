// src/components/almanac/AlmanacWorkArea.tsx
'use client';

import { useState } from 'react';
import { Button, HStack, VStack } from '@chakra-ui/react';
import { EventDraftList } from './EventDraftList';
import { EventPublishedList } from './EventPublishedList';
import { EventDetailView } from './EventDetailView';
import { EventCalendar } from './EventCalendar';

interface AlmanacWorkAreaProps {
  section: string;
  sectionParams?: Record<string, string>;
  setActiveSection: (section: string, params?: Record<string, string>) => void;
  groupSlug: string;
}

export function AlmanacWorkArea({ groupSlug }: AlmanacWorkAreaProps) {
  const [view, setView] = useState<'drafts' | 'published' | 'calendar' | 'event-detail'>('drafts');
  const [selectedEventSlug, setSelectedEventSlug] = useState<string | null>(null);

  // View: Event Detail
  if (view === 'event-detail' && selectedEventSlug) {
    return (
      <EventDetailView
        groupSlug={groupSlug}
        eventSlug={selectedEventSlug}
        onBack={() => {
          setView('drafts');
          setSelectedEventSlug(null);
        }}
        onEdit={() => {
          // TODO: Navigate to edit view
          console.log('Edit event:', selectedEventSlug);
        }}
      />
    );
  }

  // View: Draft List (default)
  return (
    <VStack align="stretch" gap={6}>
      {/* Navigation Tabs */}
      <HStack gap={2} borderBottom="1px" borderColor="gray.200" pb={2}>
        <Button
          variant={view === 'drafts' ? 'solid' : 'ghost'}
          onClick={() => setView('drafts')}
          size="sm"
        >
          Drafts
        </Button>
        <Button
          variant={view === 'published' ? 'solid' : 'ghost'}
          onClick={() => setView('published')}
          size="sm"
        >
          Published
        </Button>
        <Button
          variant={view === 'calendar' ? 'solid' : 'ghost'}
          onClick={() => setView('calendar')}
          size="sm"
        >
          Calendar
        </Button>
      </HStack>

      {/* Content */}
      {view === 'drafts' && (
        <EventDraftList
          groupSlug={groupSlug}
          onViewEvent={(slug) => {
            setSelectedEventSlug(slug);
            setView('event-detail');
          }}
        />
      )}

      {view === 'published' && (
        <EventPublishedList
          groupSlug={groupSlug}
          onViewEvent={(slug) => {
            setSelectedEventSlug(slug);
            setView('event-detail');
          }}
        />
      )}

      {view === 'calendar' && (
        <EventCalendar
          groupSlug={groupSlug}
          onViewEvent={(slug) => {
            setSelectedEventSlug(slug);
            setView('event-detail');
          }}
        />
      )}
    </VStack>
  );
}

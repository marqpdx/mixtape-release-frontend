'use client';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import type { ProfileDTO, SectionEntry, SectionId } from '../../api/types';
import SectionListItem from '../controls/SectionListItem';

interface Props {
  profile: ProfileDTO;
  onLayoutChange: (layout: SectionEntry[]) => void;
}

export default function LayoutPanel({ profile, onLayoutChange }: Props) {
  const layout = profile.sectionLayout;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = layout.findIndex(s => s.id === active.id);
    const newIndex = layout.findIndex(s => s.id === over.id);
    if (oldIndex === 0 || newIndex === 0) return; // header locked at 0
    onLayoutChange(arrayMove(layout, oldIndex, newIndex));
  }

  function handleToggle(id: SectionId, visible: boolean) {
    if (id === 'header') return;
    onLayoutChange(layout.map(s => s.id === id ? { ...s, visible } : s));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={layout.map(s => s.id)} strategy={verticalListSortingStrategy}>
        <ul style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {layout.map(entry => (
            <SectionListItem
              key={entry.id}
              id={entry.id}
              visible={entry.visible}
              locked={entry.id === 'header'}
              onToggle={handleToggle}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

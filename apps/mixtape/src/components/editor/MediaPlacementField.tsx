'use client'

import { Field, NativeSelect } from '@chakra-ui/react'
import { normaliseMediaAlignment, type MediaAlignment } from '@mixtape/content/mediaLayout'

export function MediaPlacementField({ label, value, onChange }: { label: string; value: MediaAlignment; onChange: (value: MediaAlignment) => void }) {
  return <Field.Root><Field.Label>{label}</Field.Label><NativeSelect.Root>
    <NativeSelect.Field aria-label={label} value={value} onChange={event => onChange(normaliseMediaAlignment(event.target.value))}>
      <option value="center">Centered — no text wrapping</option>
      <option value="left">Left — text wraps on the right</option>
      <option value="right">Right — text wraps on the left</option>
    </NativeSelect.Field><NativeSelect.Indicator />
  </NativeSelect.Root></Field.Root>
}

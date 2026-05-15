'use client';
import { useRef } from 'react';

interface Props {
  value: string;
  field: string;
  maxLength?: number;
  multiline?: boolean;
  onCommit: (field: string, value: string) => void;
  style?: React.CSSProperties;
}

export default function EditableText({ value, field, maxLength, multiline, onCommit, style }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  function handleBlur() {
    const raw = ref.current?.innerText ?? '';
    const trimmed = maxLength ? raw.slice(0, maxLength).trim() : raw.trim();
    onCommit(field, trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      ref.current?.blur();
    }
    if (e.key === 'Escape') {
      if (ref.current) ref.current.innerText = value;
      ref.current?.blur();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      data-field={field}
      style={{
        outline: '2px solid transparent',
        borderRadius: 4,
        transition: 'outline 0.1s',
        ...style,
      }}
      onFocus={e => { (e.target as HTMLElement).style.outline = '2px solid var(--accent)'; }}
      onBlurCapture={e => { (e.target as HTMLElement).style.outline = '2px solid transparent'; }}
    >
      {value}
    </span>
  );
}

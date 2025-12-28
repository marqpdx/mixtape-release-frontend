// src/components/write/composer/TitleInput.tsx

import React from 'react';
import { useColorModeValue } from '@components/ui/color-mode';
import { Input } from '@/theme/recipes/input.recipe';
// import { Input } from '/theme/recipes/input.recipe';

export interface TitleInputProps {
  title: string;
  setTitle: (title: string) => void;
  placeholder?: string;
}

export function TitleInput({
  title,
  setTitle,
  placeholder = "Enter your title..."
}: TitleInputProps) {
  const borderColor = useColorModeValue("border.default", "border.default");

  return (
    <Input
      className="title-input"
      placeholder={placeholder}
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      size="lg"
      fontSize="xl"
      fontWeight="semibold"
      paddingInline={"0.75em !important"}
      border={`1px solid ${borderColor}`}
      _focus={{
        boxShadow: "none",
        borderColor: "transparent"
      }}
      _placeholder={{ color: "text.secondary" }}
    />
  );
}
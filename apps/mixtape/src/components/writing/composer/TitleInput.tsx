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
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const focusBorderColor = useColorModeValue("theme.accent", "theme.accent");

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
      borderColor={borderColor}
      bg={bgColor}
      _focus={{
        boxShadow: "none",
        borderColor: focusBorderColor
      }}
      _placeholder={{ color: "text.secondary" }}
    />
  );
}

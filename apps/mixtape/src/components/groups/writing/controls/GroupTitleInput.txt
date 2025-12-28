// src/components/groups/writing/controls/GroupTitleInput.tsx

'use client';

import { Box, Input } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';

interface GroupTitleInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function GroupTitleInput({
  value,
  onChange,
  placeholder = "Enter your title...",
  autoFocus = false
}: GroupTitleInputProps) {
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("blue.500", "blue.300");

  return (
    <Box>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        size="lg"
        fontSize="2xl"
        fontWeight="bold"
        border="none"
        borderBottom="2px solid"
        borderColor={borderColor}
        borderRadius="none"
        px={0}
        py={3}
        _focus={{
          borderBottomColor: focusBorderColor,
          boxShadow: "none"
        }}
        _placeholder={{
          color: "gray.400"
        }}
      />
    </Box>
  );
}
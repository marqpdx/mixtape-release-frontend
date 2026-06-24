"use client";

import { KeyboardEvent, useRef, useState } from "react";
import { Box, Flex, Spinner, Textarea } from "@chakra-ui/react";
import { IconSend } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";

interface AtriumComposeBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  streaming?: boolean;
}

export function AtriumComposeBar({ onSend, disabled, streaming }: AtriumComposeBarProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const iconColor = useColorModeValue("blue.500", "blue.300");
  const disabledColor = useColorModeValue("gray.300", "gray.600");

  const canSend = value.trim().length > 0 && !disabled && !streaming;

  function handleSend() {
    const msg = value.trim();
    if (!msg || !canSend) return;
    setValue("");
    onSend(msg);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      px={4}
      py={3}
    >
      <Flex align="flex-end" gap={3}>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything… or /find, /add (Enter to send, Shift+Enter for new line)"
          rows={1}
          resize="none"
          border="none"
          outline="none"
          _focus={{ boxShadow: "none" }}
          fontSize="sm"
          flex="1"
          disabled={disabled || streaming}
          minH="36px"
          maxH="160px"
          overflow="auto"
        />
        <Box
          as="button"
          onClick={handleSend}
          aria-disabled={!canSend}
          _disabled={{ cursor: "not-allowed" }}
          color={canSend ? iconColor : disabledColor}
          cursor={canSend ? "pointer" : "not-allowed"}
          flexShrink={0}
          mb={1}
          transition="color 0.15s"
          _hover={{ color: canSend ? "blue.600" : disabledColor }}
        >
          {streaming ? <Spinner size="sm" /> : <IconSend size={18} />}
        </Box>
      </Flex>
    </Box>
  );
}

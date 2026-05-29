// src/components/write/composer/WorkspaceToggle.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, IconButton, VStack } from '@chakra-ui/react';
import { IconSparkles, IconBook2 } from '@tabler/icons-react';

interface WorkspaceToggleProps {
  workspaceOpen: boolean;
  onToggle: () => void;
  isLb?: boolean;
  lbDeskOpen?: boolean;
  onLbToggle?: () => void;
}

export function WorkspaceToggle({
  workspaceOpen,
  onToggle,
  isLb,
  lbDeskOpen,
  onLbToggle,
}: WorkspaceToggleProps) {
  const [lbHighlighted, setLbHighlighted] = useState(false);
  const prevIsLb = useRef(false);

  // Fire attention animation when isLb first becomes true
  useEffect(() => {
    if (isLb && !prevIsLb.current) {
      setLbHighlighted(true);
      const t = setTimeout(() => setLbHighlighted(false), 3000);
      prevIsLb.current = true;
      return () => clearTimeout(t);
    }
    if (!isLb) prevIsLb.current = false;
  }, [isLb]);

  if (workspaceOpen || lbDeskOpen) return null;

  return (
    <>
      {lbHighlighted && (
        <style>{`
          @keyframes lb-arrive {
            0%   { transform: translateX(-50%) scale(0.6); opacity: 0; box-shadow: 0 0 0 0 rgba(49,151,149,0.6); }
            30%  { transform: translateX(-50%) scale(1.15); opacity: 1; box-shadow: 0 0 0 8px rgba(49,151,149,0.2); }
            55%  { transform: translateX(-50%) scale(0.95); box-shadow: 0 0 0 14px rgba(49,151,149,0.08); }
            70%  { transform: translateX(-50%) scale(1.05); box-shadow: 0 0 0 10px rgba(49,151,149,0.12); }
            85%  { transform: translateX(-50%) scale(1.0);  box-shadow: 0 0 0 16px rgba(49,151,149,0.04); }
            100% { transform: translateX(-50%) scale(1.0);  box-shadow: 0 0 0 0   rgba(49,151,149,0); opacity: 1; }
          }
          .lb-btn-arrive {
            animation: lb-arrive 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards,
                       lb-arrive 0.9s cubic-bezier(0.34,1.56,0.64,1) 1.1s forwards;
          }
        `}</style>
      )}

      <Box
        w="48px"
        bg="gray.50"
        borderLeft="1px solid"
        borderColor="gray.200"
        h="100%"
        position="relative"
      >
        <VStack
          position="absolute"
          top="16px"
          left="50%"
          transform="translateX(-50%)"
          gap={2}
          zIndex={1001}
        >
          <IconButton
            size="sm"
            variant="ghost"
            bg="green.50"
            border="1px solid"
            borderColor="green.200"
            borderRadius="full"
            shadow="sm"
            onClick={onToggle}
            title="Open Copy Desk"
            _hover={{ bg: 'green.100', shadow: 'md' }}
          >
            <IconSparkles size={16} color="green" />
          </IconButton>

          {isLb && onLbToggle && (
            <IconButton
              size="sm"
              variant="ghost"
              bg="teal.50"
              border="1px solid"
              borderColor="teal.200"
              borderRadius="full"
              shadow="sm"
              onClick={onLbToggle}
              title="Open Living Book Desk"
              _hover={{ bg: 'teal.100', shadow: 'md' }}
              className={lbHighlighted ? 'lb-btn-arrive' : undefined}
              style={lbHighlighted ? { position: 'relative', left: '50%', transform: 'translateX(-50%)' } : undefined}
            >
              <IconBook2 size={16} color="teal" />
            </IconButton>
          )}
        </VStack>
      </Box>
    </>
  );
}

// src/components/write/copydesk/shared/AgentContainer.tsx

import React from 'react';
import {
  Accordion,
  Box,
  VStack,
  HStack,
  Text,
  Badge
} from '@chakra-ui/react';
import { AgentStatus } from './AgentStatus';

export type AgentState = 'idle' | 'loading' | 'ready' | 'error' | 'disabled';

export interface AgentContainerProps {
  id: string;
  title: string;
  subtitle?: string;
  state: AgentState;
  stateMessage?: string;
  icon: React.ReactNode;
  iconColor: string;
  badge?: {
    text: string;
    colorScheme: string;
  };
  children: React.ReactNode;
  className?: string;
}

export function AgentContainer({
  id,
  title,
  subtitle,
  state,
  stateMessage,
  icon,
  iconColor,
  badge,
  children,
  className = ''
}: AgentContainerProps) {
  return (
    <Accordion.Item value={id} className={`copy-desk-agent ${className}`}>
      <Accordion.ItemTrigger>
        <HStack gap={3} flex="1">
          {/* Agent Icon */}
          <Box
            w="20px"
            h="20px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color={iconColor}
          >
            {icon}
          </Box>

          {/* Agent Info */}
          <VStack align="start" gap={0} flex="1">
            <HStack gap={2} align="center">
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                {title}
              </Text>

              {/* Badge */}
              {badge && (
                <Badge colorScheme={badge.colorScheme} size="sm">
                  {badge.text}
                </Badge>
              )}
            </HStack>

            {/* Subtitle & Status */}
            <HStack gap={2} align="center">
              {/* Status Indicator */}
              <AgentStatus state={state} />

              <Text fontSize="xs" color="gray.500">
                {stateMessage || subtitle || getDefaultStateMessage(state)}
              </Text>
            </HStack>
          </VStack>
        </HStack>

        <Accordion.ItemIndicator />
      </Accordion.ItemTrigger>

      <Accordion.ItemContent>
        <Accordion.ItemBody pt={2}>
          {children}
        </Accordion.ItemBody>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
}

function getDefaultStateMessage(state: AgentState): string {
  switch (state) {
    case 'loading':
      return 'Processing...';
    case 'ready':
      return 'Ready';
    case 'error':
      return 'Error occurred';
    case 'disabled':
      return 'Coming soon';
    default:
      return 'Idle';
  }
}
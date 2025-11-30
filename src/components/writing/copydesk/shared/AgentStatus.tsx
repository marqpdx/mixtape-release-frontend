// src/components/write/copydesk/shared/AgentStatus.tsx

import React from 'react';
import { Box } from '@chakra-ui/react';
import { AgentState } from './AgentContainer';

export interface AgentStatusProps {
  state: AgentState;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG = {
  idle: {
    color: '#60A5FA', // blue-400
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  },
  loading: {
    color: '#FB923C', // orange-400
    animation: 'spin 1s linear infinite'
  },
  ready: {
    color: '#34D399', // green-400
    animation: 'none'
  },
  error: {
    color: '#F87171', // red-400
    animation: 'none'
  },
  disabled: {
    color: '#9CA3AF', // gray-400
    animation: 'none'
  }
} as const;

const SIZE_CONFIG = {
  sm: { width: '8px', height: '8px', strokeWidth: '1' },
  md: { width: '12px', height: '12px', strokeWidth: '1.5' },
  lg: { width: '16px', height: '16px', strokeWidth: '2' }
} as const;

export function AgentStatus({ state, size = 'md' }: AgentStatusProps) {
  if (state === 'disabled') {
    return null; // No status indicator for disabled agents
  }

  const statusConfig = STATUS_CONFIG[state];
  const sizeConfig = SIZE_CONFIG[size];

  const getTitle = (): string => {
    switch (state) {
      case 'idle':
        return 'Waiting...';
      case 'loading':
        return 'Processing...';
      case 'ready':
        return 'Ready';
      case 'error':
        return 'Error occurred';
      default:
        return '';
    }
  };

  return (
    <Box
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w={sizeConfig.width}
      h={sizeConfig.height}
      cursor="help"
      title={getTitle()}
    >
      <svg
        width={sizeConfig.width}
        height={sizeConfig.height}
        viewBox="0 0 12 12"
        fill="none"
        style={{
          color: statusConfig.color,
          animation: statusConfig.animation
        }}
      >
        {/* Claude-style janky asterisk */}
        <g stroke="currentColor" strokeWidth={sizeConfig.strokeWidth} strokeLinecap="round">
          <line x1="6" y1="1" x2="6" y2="11" />
          <line x1="1" y1="6" x2="11" y2="6" />
          <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" />
          <line x1="9.5" y1="2.5" x2="2.5" y2="9.5" />
        </g>
      </svg>
    </Box>
  );
}

// Utility function for getting status props in other components
export function getAgentStatusProps(state: AgentState) {
  return STATUS_CONFIG[state];
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input, IconButton, HStack, Text } from '@chakra-ui/react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import debounce from 'lodash.debounce';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  minLength?: number;
  maxLength?: number;
  disabled?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Search library...',
  debounceMs = 300,
  minLength = 3,
  maxLength = 500,
  disabled = false,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [charCount, setCharCount] = useState(value.length);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      if (searchValue.length >= minLength && searchValue.length <= maxLength) {
        onSearch(searchValue);
      }
    }, debounceMs),
    [onSearch, minLength, maxLength, debounceMs]
  );

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setCharCount(newValue.length);
    onChange(newValue);

    // Trigger debounced search
    if (newValue.length >= minLength) {
      debouncedSearch(newValue);
    }
  };

  // Handle clear
  const handleClear = () => {
    setLocalValue('');
    setCharCount(0);
    onChange('');
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && localValue.length >= minLength) {
      onSearch(localValue);
    }
  };

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
    setCharCount(value.length);
  }, [value]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const isValid = charCount >= minLength && charCount <= maxLength;
  const showError = charCount > 0 && charCount < minLength;
  const showWarning = charCount > maxLength;

  return (
    <div>
      <HStack gap={2}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Input
            value={localValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            size="lg"
            paddingLeft="40px"
            paddingRight={localValue ? '40px' : undefined}
            borderColor={showError || showWarning ? 'red.500' : undefined}
          />
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          >
            <MagnifyingGlassIcon style={{ width: '20px', height: '20px', opacity: 0.5 }} />
          </div>
          {localValue && (
            <div
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              <IconButton
                aria-label="Clear search"
                size="sm"
                variant="ghost"
                onClick={handleClear}
              >
                <XMarkIcon style={{ width: '16px', height: '16px' }} />
              </IconButton>
            </div>
          )}
        </div>
      </HStack>

      {/* Character count and validation feedback */}
      <HStack justify="space-between" mt={1} px={1}>
        <Text fontSize="xs" color={showError || showWarning ? 'red.500' : 'gray.500'}>
          {showError && `Minimum ${minLength} characters`}
          {showWarning && `Maximum ${maxLength} characters exceeded`}
          {!showError && !showWarning && charCount > 0 && charCount < minLength * 2 &&
            `${minLength - charCount} more characters needed`}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {charCount}/{maxLength}
        </Text>
      </HStack>
    </div>
  );
}

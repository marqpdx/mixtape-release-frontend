import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchMentionSuggestions } from '@mixtape/api/clients/chat/chatApi';
import type { MentionSuggestion } from '@mixtape/api/clients/chat/chatApi';

interface MentionSuggestionListProps {
  query: string;
  onSelect: (username: string) => void;
}

export function MentionSuggestionList({ query, onSelect }: MentionSuggestionListProps) {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchMentionSuggestions(query).then((results) => {
        setSuggestions(results.filter((r) => r.type === 'user').slice(0, 6));
      });
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.scroll}
      >
        {suggestions.map((s) => {
          const username = s.username || s.display_name;
          return (
            <TouchableOpacity
              key={s.id}
              style={styles.chip}
              onPress={() => onSelect(username)}
              activeOpacity={0.75}
            >
              <Text style={styles.chipText}>@{username}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#D7E8F5',
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  scroll: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#B8D4EE',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E5AA7',
  },
});

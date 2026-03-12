import { Image, StyleSheet, Text, View } from 'react-native';
import type { Leaf } from '@mixtape/core/types/leaf';

interface HomeLeafCardProps {
  leaf: Leaf;
  showAuthor?: boolean;
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return 'Draft';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function HomeLeafCard({ leaf, showAuthor = false }: HomeLeafCardProps) {
  const body = leaf.body_text?.trim() || leaf.caption?.trim() || 'No text yet.';
  const imageUrl = leaf.image_file || leaf.link_preview?.image || null;
  const timestamp = formatTimestamp(leaf.published_at || leaf.created_at);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          {showAuthor ? (
            <Text style={styles.author}>
              {leaf.author.display_name || leaf.author.username}
            </Text>
          ) : (
            <Text style={styles.author}>My Storyline</Text>
          )}
          <Text style={styles.meta}>
            {leaf.kind.toUpperCase()} {timestamp ? `· ${timestamp}` : ''}
          </Text>
        </View>
        <View style={styles.visibilityPill}>
          <Text style={styles.visibilityText}>{leaf.visibility}</Text>
        </View>
      </View>

      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : null}

      <Text style={styles.body}>{body}</Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{leaf.comment_count} comments</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  author: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D2235',
  },
  meta: {
    fontSize: 12,
    color: '#526170',
  },
  visibilityPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#E9F2FB',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  visibilityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4F7A',
    textTransform: 'capitalize',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    backgroundColor: '#D7E0EA',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#13293D',
  },
  footer: {
    paddingTop: 2,
  },
  footerText: {
    fontSize: 12,
    color: '#6A7785',
  },
});

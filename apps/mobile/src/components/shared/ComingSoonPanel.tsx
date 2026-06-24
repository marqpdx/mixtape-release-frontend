import { StyleSheet, Text, View } from 'react-native';

interface ComingSoonPanelProps {
  title: string;
  body: string;
}

export function ComingSoonPanel({ title, body }: ComingSoonPanelProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#13293D',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#627181',
  },
});

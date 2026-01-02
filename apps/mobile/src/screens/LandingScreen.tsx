import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type LandingScreenProps = NativeStackScreenProps<RootStackParamList, 'Landing'>;

export default function LandingScreen({ navigation }: LandingScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mixtape</Text>
      <Text style={styles.subtitle}>Where do you want to go?</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Messages')}
        activeOpacity={0.8}
      >
        <Text style={styles.cardTitle}>Messages</Text>
        <Text style={styles.cardDescription}>
          Catch up on conversations and continue chatting.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Groups')}
        activeOpacity={0.8}
      >
        <Text style={styles.cardTitle}>Groups</Text>
        <Text style={styles.cardDescription}>
          Browse your groups and explore new spaces.
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b6b6b',
  },
});

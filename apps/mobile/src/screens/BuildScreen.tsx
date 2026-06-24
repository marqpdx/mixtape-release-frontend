import { StyleSheet, View } from 'react-native';
import { CrossroadsHeader } from '../components/CrossroadsHeader';
import { ComingSoonPanel } from '../components/shared/ComingSoonPanel';

export default function BuildScreen() {
  return (
    <View style={styles.container}>
      <CrossroadsHeader routeLabel="build" />
      <ComingSoonPanel
        title="Build is on the way"
        body="Long-running AI dialogue per initiative, started and continued from mobile. Coming soon."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4F8',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },
});

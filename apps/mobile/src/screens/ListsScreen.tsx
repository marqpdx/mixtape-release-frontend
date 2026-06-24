import { StyleSheet, View } from 'react-native';
import { CrossroadsHeader } from '../components/CrossroadsHeader';
import { ComingSoonPanel } from '../components/shared/ComingSoonPanel';

export default function ListsScreen() {
  return (
    <View style={styles.container}>
      <CrossroadsHeader routeLabel="lists" />
      <ComingSoonPanel
        title="Lists is on the way"
        body="Don't-forget actionables — speak or type, and it'll parse into a checklist. Coming soon."
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

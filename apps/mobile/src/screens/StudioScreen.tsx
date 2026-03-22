import { StyleSheet, View } from 'react-native';
import { useHomeStore } from '../stores/homeStore';
import { IdeaStudio } from '../components/home/IdeaStudio';
import { CrossroadsHeader } from '../components/CrossroadsHeader';

export default function StudioScreen() {
  const seedToDevelop = useHomeStore((state) => state.seedToDevelop);
  const setSeedToDevelop = useHomeStore((state) => state.setSeedToDevelop);

  return (
    <View style={styles.container}>
      <CrossroadsHeader routeLabel="studio" />
      <IdeaStudio
        keyboardVerticalOffset={0}
        onFocusChange={() => {}}
        seedToDevelop={seedToDevelop}
        onDraftConsumed={() => setSeedToDevelop(null)}
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

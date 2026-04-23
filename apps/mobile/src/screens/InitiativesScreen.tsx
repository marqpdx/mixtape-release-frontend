import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CrossroadsHeader } from '../components/CrossroadsHeader';
import { InitiativesCommandSurface } from '../components/initiatives/InitiativesCommandSurface';

export default function InitiativesScreen() {
  const [composerFocused, setComposerFocused] = useState(false);

  return (
    <View style={styles.container}>
      {!composerFocused ? <CrossroadsHeader routeLabel="initiatives" /> : null}
      <InitiativesCommandSurface onFocusChange={setComposerFocused} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4F8',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
});

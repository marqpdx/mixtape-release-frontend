import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CrossroadsHeader } from '../components/CrossroadsHeader';
import { ConsoleMobileSurface } from '../components/console/ConsoleMobileSurface';

export default function ConsoleScreen() {
  const [actionFocused, setActionFocused] = useState(false);

  return (
    <View style={styles.container}>
      {!actionFocused ? <CrossroadsHeader routeLabel="console" /> : null}
      <ConsoleMobileSurface onActionFocusChange={setActionFocused} />
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

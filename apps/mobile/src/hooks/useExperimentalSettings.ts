import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DISPATCH_INPUT_KEY = 'mixtape.mobile.experimental.dispatchInput';

export function useExperimentalSettings() {
  const [dispatchInputEnabled, setDispatchInputEnabledState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(DISPATCH_INPUT_KEY).then((value) => {
      setDispatchInputEnabledState(value === 'true');
      setLoaded(true);
    });
  }, []);

  const setDispatchInputEnabled = async (enabled: boolean) => {
    setDispatchInputEnabledState(enabled);
    if (enabled) {
      await AsyncStorage.setItem(DISPATCH_INPUT_KEY, 'true');
    } else {
      await AsyncStorage.removeItem(DISPATCH_INPUT_KEY);
    }
  };

  return { dispatchInputEnabled, setDispatchInputEnabled, loaded };
}

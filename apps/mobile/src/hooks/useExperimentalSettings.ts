import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DISPATCH_INPUT_KEY = 'mixtape.mobile.experimental.dispatchInput';
// Message memory defaults OFF per Puddlejump OQ-4 decision — privacy default
const MESSAGE_MEMORY_KEY = 'mixtape.mobile.privacy.messageMemory';

export function useExperimentalSettings() {
  const [dispatchInputEnabled, setDispatchInputEnabledState] = useState(false);
  const [messageMemoryEnabled, setMessageMemoryEnabledState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void Promise.all([
      AsyncStorage.getItem(DISPATCH_INPUT_KEY),
      AsyncStorage.getItem(MESSAGE_MEMORY_KEY),
    ]).then(([dispatch, memory]) => {
      setDispatchInputEnabledState(dispatch === 'true');
      setMessageMemoryEnabledState(memory === 'true');
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

  const setMessageMemoryEnabled = async (enabled: boolean) => {
    setMessageMemoryEnabledState(enabled);
    if (enabled) {
      await AsyncStorage.setItem(MESSAGE_MEMORY_KEY, 'true');
    } else {
      await AsyncStorage.removeItem(MESSAGE_MEMORY_KEY);
    }
  };

  return {
    dispatchInputEnabled,
    setDispatchInputEnabled,
    messageMemoryEnabled,
    setMessageMemoryEnabled,
    loaded,
  };
}

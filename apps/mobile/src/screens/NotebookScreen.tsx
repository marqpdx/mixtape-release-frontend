import { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useHomeStore } from '../stores/homeStore';
import { SeedNotebook } from '../components/home/SeedNotebook';
import { CrossroadsHeader } from '../components/CrossroadsHeader';
import { useExperimentalSettings } from '../hooks/useExperimentalSettings';
import type { MainTabParamList } from '../navigation/AppNavigator';

const GUIDE_VISIBILITY_VERSION = 'v1';
const GUIDE_COLLAPSED_KEY = `mixtape.mobile.guideCollapsed.${GUIDE_VISIBILITY_VERSION}`;

type NotebookScreenProps = BottomTabScreenProps<MainTabParamList, 'Notebook'>;

function NotebookGuide() {
  return (
    <>
      <Text style={guideStyles.item}>
        <Text style={guideStyles.label}>Notebook </Text>
        <Text style={guideStyles.text}>— capture fast. Seeds autosave while you type. Tap Develop to send to Studio.</Text>
      </Text>
      <Text style={guideStyles.item}>
        <Text style={guideStyles.label}>Studio </Text>
        <Text style={guideStyles.text}>— shape and refine. Long-form drafts live here.</Text>
      </Text>
      <Text style={guideStyles.item}>
        <Text style={guideStyles.label}>Recent Seeds </Text>
        <Text style={guideStyles.text}>— last 90 min, or your latest 8 if things are quiet.</Text>
      </Text>
      <Text style={guideStyles.item}>
        <Text style={guideStyles.label}>Messages & Groups </Text>
        <Text style={guideStyles.text}>— community stays secondary to capture.</Text>
      </Text>
    </>
  );
}

const guideStyles = StyleSheet.create({
  item: {
    fontSize: 13,
    lineHeight: 19,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  text: {
    color: '#9DB9D4',
    fontSize: 13,
  },
});

export default function NotebookScreen({ navigation }: NotebookScreenProps) {
  const setSeedToDevelop = useHomeStore((state) => state.setSeedToDevelop);
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [editorFocused, setEditorFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { dispatchInputEnabled } = useExperimentalSettings();

  useEffect(() => {
    void AsyncStorage.getItem(GUIDE_COLLAPSED_KEY).then((value) => {
      setGuideExpanded(value === 'true');
    });
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(GUIDE_COLLAPSED_KEY, guideExpanded ? 'true' : 'false');
  }, [guideExpanded]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const headerHidden = Platform.OS === 'android' ? keyboardVisible : editorFocused || keyboardVisible;

  return (
    <View style={styles.container}>
      <View
        style={[styles.headerWrap, headerHidden ? styles.headerHidden : styles.headerVisible]}
        pointerEvents={headerHidden ? 'none' : 'auto'}
      >
        <CrossroadsHeader
          routeLabel="notebook"
          guideExpanded={guideExpanded}
          onToggleGuide={() => setGuideExpanded((v) => !v)}
          guideContent={<NotebookGuide />}
        />
      </View>

      <SeedNotebook
        keyboardVerticalOffset={0}
        onFocusChange={setEditorFocused}
        onDevelopSeed={(seed) => {
          setSeedToDevelop(seed);
          navigation.navigate('Studio');
        }}
        dispatchEnabled={dispatchInputEnabled}
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
    paddingBottom: 10,
  },
  headerWrap: {
    overflow: 'hidden',
  },
  headerVisible: {
    opacity: 1,
  },
  headerHidden: {
    opacity: 0,
    maxHeight: 0,
  },
});

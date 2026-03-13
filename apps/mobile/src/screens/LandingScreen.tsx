import { useEffect, useState } from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Seed } from '@mixtape/api/clients/writing/seedApi';
import { useHeaderHeight } from '@react-navigation/elements';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SeedNotebook } from '../components/home/SeedNotebook';
import { IdeaStudio } from '../components/home/IdeaStudio';
import { CommunityWindow } from '../components/home/CommunityWindow';
import { useAuthStore } from '../stores/authStore';

type LandingScreenProps = NativeStackScreenProps<RootStackParamList, 'Landing'>;
type HomeTab = 'notebook' | 'studio' | 'community';

const HOME_TAB_KEY = 'mixtape.mobile.homeTab';
const GUIDE_VISIBILITY_VERSION = 'v1';
const GUIDE_COLLAPSED_KEY = `mixtape.mobile.guideCollapsed.${GUIDE_VISIBILITY_VERSION}`;

function HomeTabButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function LandingScreen({ navigation }: LandingScreenProps) {
  const headerHeight = useHeaderHeight();
  const currentUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<HomeTab>('notebook');
  const [hasLoadedSavedTab, setHasLoadedSavedTab] = useState(false);
  const [seedToDevelop, setSeedToDevelop] = useState<Seed | null>(null);
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const [editorFocused, setEditorFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(HOME_TAB_KEY)
      .then((savedTab) => {
        if (
          savedTab === 'notebook' ||
          savedTab === 'studio' ||
          savedTab === 'community'
        ) {
          setActiveTab(savedTab);
        }
      })
      .finally(() => {
        setHasLoadedSavedTab(true);
      });
  }, []);

  useEffect(() => {
    void AsyncStorage.getItem(GUIDE_COLLAPSED_KEY).then((value) => {
      if (value === 'true') {
        setHeroCollapsed(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedTab) {
      return;
    }

    void AsyncStorage.setItem(HOME_TAB_KEY, activeTab);
  }, [activeTab, hasLoadedSavedTab]);

  useEffect(() => {
    void AsyncStorage.setItem(GUIDE_COLLAPSED_KEY, heroCollapsed ? 'true' : 'false');
  }, [heroCollapsed]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const chromeHidden =
    Platform.OS === 'android' ? keyboardVisible : editorFocused || keyboardVisible;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.chromeWrap,
          chromeHidden ? styles.chromeWrapHidden : styles.chromeWrapVisible,
        ]}
        pointerEvents={chromeHidden ? 'none' : 'auto'}
      >
        <TouchableOpacity
          style={[styles.hero, heroCollapsed && styles.heroCollapsed]}
          activeOpacity={0.9}
          onPress={() => setHeroCollapsed((value) => !value)}
        >
          <View style={styles.heroHeader}>
            <View style={styles.heroTitleWrap}>
              <Text style={styles.eyebrow}>Mixtape Mobile</Text>
              <Text style={styles.title}>
                {currentUser?.display_name || currentUser?.username || 'Mixtape'}
              </Text>
            </View>
            <Text style={styles.heroToggle}>
              {heroCollapsed ? 'Show guide' : 'Hide guide'}
            </Text>
          </View>

          {!heroCollapsed ? (
            <View style={styles.heroBody}>
              <Text style={styles.subtitle}>
                Pocket notebook, idea studio, and community window.
              </Text>
              <Text style={styles.heroGuide}>
                Capture first. Curate later. Share intentionally. The notebook stays fast, the studio is for shaping, and community stays secondary.
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <View style={styles.tabsRow}>
          <HomeTabButton
            label="Notebook"
            isActive={activeTab === 'notebook'}
            onPress={() => setActiveTab('notebook')}
          />
          <HomeTabButton
            label="Studio"
            isActive={activeTab === 'studio'}
            onPress={() => setActiveTab('studio')}
          />
          <HomeTabButton
            label="Community"
            isActive={activeTab === 'community'}
            onPress={() => setActiveTab('community')}
          />
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === 'notebook' ? (
          <SeedNotebook
            keyboardVerticalOffset={Math.max(headerHeight - 96, 0)}
            onFocusChange={setEditorFocused}
            onDevelopSeed={(seed) => {
              setSeedToDevelop(seed);
              setActiveTab('studio');
            }}
          />
        ) : activeTab === 'studio' ? (
          <IdeaStudio
            keyboardVerticalOffset={Math.max(headerHeight - 96, 0)}
            onFocusChange={setEditorFocused}
            seedToDevelop={seedToDevelop}
            onDraftConsumed={() => {
              setSeedToDevelop(null);
            }}
          />
        ) : null}

        {activeTab === 'community' ? (
          <CommunityWindow
            onOpenMessages={() => navigation.navigate('Messages')}
            onOpenGroups={() => navigation.navigate('Groups')}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4F8',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
  },
  chromeWrap: {
    overflow: 'hidden',
  },
  chromeWrapVisible: {
    opacity: 1,
  },
  chromeWrapHidden: {
    opacity: 0,
    maxHeight: 0,
  },
  hero: {
    backgroundColor: '#0D2235',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
  },
  heroCollapsed: {
    paddingBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
  },
  heroTitleWrap: {
    flex: 1,
  },
  eyebrow: {
    color: '#9DB9D4',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#D4E1EC',
  },
  heroBody: {
    marginTop: 10,
    gap: 10,
  },
  heroGuide: {
    fontSize: 13,
    lineHeight: 19,
    color: '#9DB9D4',
  },
  heroToggle: {
    color: '#9DB9D4',
    fontSize: 12,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#DCE6EE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  tabButtonActive: {
    backgroundColor: '#0E5AA7',
  },
  tabText: {
    color: '#34516B',
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});

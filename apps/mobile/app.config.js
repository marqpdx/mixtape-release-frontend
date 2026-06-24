// Production/store builds should be standalone. Development builds can opt into
// the Expo dev client with EXPO_INCLUDE_DEV_CLIENT=true before prebuild/build.
//
// Push can be controlled per platform so Android production can keep push while
// iOS USB/free-account testing can omit the aps-environment entitlement:
//   PUSH_NOTIFICATIONS_ENABLED=false
//   ANDROID_PUSH_NOTIFICATIONS_ENABLED=false
//   IOS_PUSH_NOTIFICATIONS_ENABLED=false
const { withEntitlementsPlist } = require('@expo/config-plugins');

const globalPushEnabled = process.env.PUSH_NOTIFICATIONS_ENABLED !== 'false';
const isPushEnabledForPlatform = (name) => {
  const value = process.env[name];
  return typeof value === 'string' ? value !== 'false' : globalPushEnabled;
};
const androidPushEnabled = isPushEnabledForPlatform('ANDROID_PUSH_NOTIFICATIONS_ENABLED');
const iosPushEnabled = isPushEnabledForPlatform('IOS_PUSH_NOTIFICATIONS_ENABLED');
const includeDevClient =
  process.env.EXPO_INCLUDE_DEV_CLIENT === 'true' ||
  process.env.EXPO_PUBLIC_INCLUDE_DEV_CLIENT === 'true';

// Strips aps-environment so free Apple accounts can sign without Push Notifications capability
const withNoPushEntitlements = (config) =>
  withEntitlementsPlist(config, (mod) => {
    delete mod.modResults['aps-environment'];
    return mod;
  });

const notificationsPlugin = [
  "expo-notifications",
  {
    icon: "./assets/crossroads2-grayscale.png",
    color: "#6B7280",
    defaultChannel: "messages",
  },
];

module.exports = {
  expo: {
    name: "Mixtape",
    slug: "mixtape-mobile",
    scheme: "mixtape",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/crossroads2.png",
    userInterfaceStyle: "light",
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mixtape.mobile",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSMicrophoneUsageDescription:
          "Mixtape uses your microphone so you can capture voice Seeds.",
      },
    },
    android: {
      package: "com.mixtape.mobile",
      googleServicesFile: "./google-services.json",
      permissions: [
        "RECORD_AUDIO",
        ...(androidPushEnabled ? ["POST_NOTIFICATIONS"] : []),
      ],
      softwareKeyboardLayoutMode: "resize",
      edgeToEdgeEnabled: false,
      predictiveBackGestureEnabled: false,
      adaptiveIcon: {
        foregroundImage: "./assets/crossroads2-adaptive.png",
        backgroundColor: "#ffffff",
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      ...(includeDevClient ? ["expo-dev-client"] : []),
      ...(androidPushEnabled || iosPushEnabled ? [notificationsPlugin] : []),
      ...(iosPushEnabled ? [] : [withNoPushEntitlements]),
    ],
    extra: {
      eas: {
        projectId: "d35d123f-dd50-4020-b6b7-b21c861eb627",
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      livewireUrl: process.env.EXPO_PUBLIC_LIVEWIRE_URL,
    },
    owner: "marqpdx",
  },
};

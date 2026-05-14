// To disable push notifications (e.g. iOS free Apple Developer account):
//   Set PUSH_NOTIFICATIONS_ENABLED=false in .env and re-run: npx expo prebuild --clean
// To build a standalone iOS alpha app (no Expo dev client):
//   Set IOS_ALPHA_STANDALONE=true in .env and re-run: npx expo prebuild --clean --platform ios
const { withEntitlementsPlist } = require('@expo/config-plugins');

const pushEnabled = process.env.PUSH_NOTIFICATIONS_ENABLED !== 'false';
const iosAlphaStandalone = process.env.IOS_ALPHA_STANDALONE === 'true';

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
      bundleIdentifier: pushEnabled ? "com.mixtape.mobile" : "com.marklilly.mixtape.dev",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSMicrophoneUsageDescription:
          "Mixtape uses your microphone so you can capture voice Seeds.",
      },
    },
    android: {
      package: "com.mixtape.mobile",
      googleServicesFile: "./google-services.json",
      permissions: ["RECORD_AUDIO", "POST_NOTIFICATIONS"],
      adaptiveIcon: {
        foregroundImage: "./assets/crossroads2-adaptive.png",
        backgroundColor: "#ffffff",
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      ...(iosAlphaStandalone ? [] : ["expo-dev-client"]),
      ...(pushEnabled ? [notificationsPlugin] : [withNoPushEntitlements]),
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

export default {
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
      permissions: ["RECORD_AUDIO"],
      adaptiveIcon: {
        foregroundImage: "./assets/crossroads2-adaptive.png",
        backgroundColor: "#ffffff",
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-dev-client",
      [
        "expo-notifications",
        {
          color: "#001f3f",
          defaultChannel: "messages",
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "d35d123f-dd50-4020-b6b7-b21c861eb627",
      },
      // Make environment variables available to the app
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      livewireUrl: process.env.EXPO_PUBLIC_LIVEWIRE_URL,
    },
    owner: "marqpdx",
  },
};

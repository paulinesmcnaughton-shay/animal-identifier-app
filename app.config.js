require('dotenv').config()

const { withXcodeProject } = require('@expo/config-plugins')

function withDisableUserScriptSandboxing(config) {
  return withXcodeProject(config, (config) => {
    const configurations = config.modResults.pbxXCBuildConfigurationSection()

    for (const key of Object.keys(configurations)) {
      const entry = configurations[key]
      if (typeof entry === 'object' && entry.buildSettings) {
        entry.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = 'NO'
      }
    }

    return config
  })
}

function envString(name) {
  const raw = process.env[name] ?? ''
  return raw.replace(/^['"]|['"]$/g, '').trim()
}

// Set APP_ENV=production in the EAS production build profile so dev-only
// tooling (expo-dev-client, local-network permissions) stays out of the
// binary App Review sees.
const isProduction = process.env.APP_ENV === 'production'

module.exports = {
  name: 'WildKind',
  slug: 'wildkind-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/WildKind-app-icon-store.png',
  scheme: 'wildkind',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.wildkind.app',
    buildNumber: '1',
    usesAppleSignIn: true,
    infoPlist: {
      NSCameraUsageDescription: 'WildKind uses your camera to identify animals and plants in the wild.',
      NSPhotoLibraryUsageDescription: 'Allow WildKind to identify creatures from photos in your library.',
      NSPhotoLibraryAddUsageDescription: 'Save WildKind photos to your library.',
      NSLocationWhenInUseUsageDescription: 'WildKind tags your sightings with where you saw them and shows nearby species.',
      NSMicrophoneUsageDescription: 'WildKind records nearby animal calls to help identification.',
      // App uses only standard HTTPS encryption, so it qualifies for the exemption.
      ITSAppUsesNonExemptEncryption: false,
      ...(isProduction
        ? {}
        : {
            NSLocalNetworkUsageDescription:
              'WildKind connects to the development server on your local network while you are building the app.',
            NSBonjourServices: ['_expo._tcp'],
          }),
      MBXAccessToken: process.env.MAPBOX_ACCESS_TOKEN ?? '',
    },
  },
  android: {
    package: 'com.wildkind.app',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#1a3d2b',
      foregroundImage: './assets/images/WildKind-app-icon.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/WildKind-app-icon.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    withDisableUserScriptSandboxing,
    ...(isProduction ? [] : ['expo-dev-client']),
    'expo-secure-store',
    'expo-router',
    'expo-apple-authentication',
    'expo-web-browser',
    [
      'expo-camera',
      {
        cameraPermission: 'WildKind uses your camera to identify animals and plants in the wild.',
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission: 'Allow WildKind to identify creatures from photos in your library.',
        savePhotosPermission: 'Save WildKind photos to your library.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'WildKind tags your sightings with where you saw them and shows nearby species.',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/WildKind-splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#1a3d2b',
        dark: { backgroundColor: '#1a3d2b' },
      },
    ],
    '@rnmapbox/maps',
    '@react-native-community/datetimepicker',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    mapboxToken: process.env.MAPBOX_ACCESS_TOKEN ?? '',
    SUPABASE_URL: envString('SUPABASE_URL') || 'https://wiysesftlprovkpouvqu.supabase.co',
    SUPABASE_PUBLISHABLE_KEY:
      envString('SUPABASE_PUBLISHABLE_KEY') ||
      'sb_publishable_QLe0faP1klanHt3V_HFy1w_K8EDJmUD',
    supabaseUrl: envString('SUPABASE_URL') || 'https://wiysesftlprovkpouvqu.supabase.co',
    supabasePublishableKey:
      envString('SUPABASE_PUBLISHABLE_KEY') ||
      'sb_publishable_QLe0faP1klanHt3V_HFy1w_K8EDJmUD',
    googleClientId: envString('GOOGLE_CLIENT_ID'),
  },
}
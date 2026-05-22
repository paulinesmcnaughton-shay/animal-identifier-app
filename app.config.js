require('dotenv').config()

function envString(name) {
  const raw = process.env[name] ?? ''
  return raw.replace(/^['"]|['"]$/g, '').trim()
}

module.exports = {
  name: 'WildKind',
  slug: 'wildkind',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'wildkind',
  userInterfaceStyle: 'automatic',
  newArchEnabled: false,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.pauline.wildkind',
    usesAppleSignIn: true,
    infoPlist: {
      NSCameraUsageDescription: 'WildKind uses your camera to identify animals and plants in the wild.',
      NSPhotoLibraryUsageDescription: 'Allow WildKind to identify creatures from photos in your library.',
      NSPhotoLibraryAddUsageDescription: 'Save WildKind photos to your library.',
      NSLocationWhenInUseUsageDescription: 'WildKind tags your sightings with where you saw them and shows nearby species.',
      NSMicrophoneUsageDescription: 'WildKind records nearby animal calls to help identification.',
      MBXAccessToken: process.env.MAPBOX_ACCESS_TOKEN ?? '',
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#1a3d2b',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-dev-client',
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
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#1a3d2b',
        dark: { backgroundColor: '#1a3d2b' },
      },
    ],
    '@rnmapbox/maps',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    mapboxToken: process.env.MAPBOX_ACCESS_TOKEN ?? '',
    anthropicApiKey: envString('ANTHROPIC_API_KEY'),
    plantnetApiKey: envString('PLANTNET_API_KEY'),
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
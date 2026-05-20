require('dotenv').config()

function envString(name) {
  const raw = process.env[name] ?? ''
  return raw.replace(/^['"]|['"]$/g, '').trim()
}

module.exports = {
  name: 'Wildr',
  slug: 'wildr',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'wildr',
  userInterfaceStyle: 'automatic',
  newArchEnabled: false,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.pauline.wildr',
    infoPlist: {
      NSCameraUsageDescription: 'Wildr uses your camera to identify animals and insects in the wild.',
      NSPhotoLibraryUsageDescription: 'Allow Wildr to identify creatures from photos in your library.',
      NSPhotoLibraryAddUsageDescription: 'Save Wildr photos to your library.',
      NSLocationWhenInUseUsageDescription: 'Wildr tags your sightings with where you saw them and shows nearby species.',
      NSMicrophoneUsageDescription: 'Wildr records nearby animal calls to help identification.',
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
    [
      'expo-camera',
      {
        cameraPermission: 'Wildr uses your camera to identify animals and insects in the wild.',
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission: 'Allow Wildr to identify creatures from photos in your library.',
        savePhotosPermission: 'Save Wildr photos to your library.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Wildr tags your sightings with where you saw them and shows nearby species.',
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
    inaturalistToken: process.env.INATURALIST_API_TOKEN ?? '',
    inaturalistOAuthToken: process.env.INATURALIST_OAUTH_TOKEN ?? '',
    inaturalistClientId: process.env.INATURALIST_CLIENT_ID ?? '',
    inaturalistClientSecret: process.env.INATURALIST_CLIENT_SECRET ?? '',
    anthropicApiKey: envString('ANTHROPIC_API_KEY'),
    googleVisionApiKey: envString('GOOGLE_VISION_API_KEY'),
    SUPABASE_URL: envString('SUPABASE_URL') || 'https://wiysesftlprovkpouvqu.supabase.co',
    SUPABASE_PUBLISHABLE_KEY:
      envString('SUPABASE_PUBLISHABLE_KEY') ||
      'sb_publishable_QLe0faP1klanHt3V_HFy1w_K8EDJmUD',
    supabaseUrl: envString('SUPABASE_URL') || 'https://wiysesftlprovkpouvqu.supabase.co',
    supabasePublishableKey:
      envString('SUPABASE_PUBLISHABLE_KEY') ||
      'sb_publishable_QLe0faP1klanHt3V_HFy1w_K8EDJmUD',
  },
}

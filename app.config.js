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
      backgroundColor: '#15B981',
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
        backgroundColor: '#15B981',
        dark: { backgroundColor: '#15B981' },
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
    googleVisionApiKey: envString('GOOGLE_VISION_API_KEY'),
  },
}

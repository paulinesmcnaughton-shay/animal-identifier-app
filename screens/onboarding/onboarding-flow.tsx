import {
    BricolageGrotesque_800ExtraBold,
    useFonts as useBricolageFonts,
} from '@expo-google-fonts/bricolage-grotesque'
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, useFonts as useNunitoFonts } from '@expo-google-fonts/nunito'
import { type Href, useRouter } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    type ListRenderItem,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors } from '@/design/tokens'
import { CollectSlide } from '@/screens/onboarding/slides/collect-slide'
import { SnapSlide } from '@/screens/onboarding/slides/snap-slide'
import { WelcomeSlide } from '@/screens/onboarding/slides/welcome-slide'

void SplashScreen.preventAutoHideAsync()

const SLIDE_COUNT = 3

const FONT_DISPLAY = 'BricolageGrotesque_800ExtraBold'
const FONT_BODY = 'Nunito_400Regular'
const FONT_BODY_SEMI = 'Nunito_600SemiBold'
const FONT_BODY_BOLD = 'Nunito_700Bold'

function PaginationDots({ activeIndex, variant }: { activeIndex: number; variant: 'light' | 'dark' }) {
  const activeBg = variant === 'light' ? colors.card : colors.green
  const idleBg = variant === 'light' ? 'rgba(255,255,255,0.55)' : 'rgba(21,33,48,0.22)'

  return (
    <View style={styles.dotsRow} accessibilityLabel={`Onboarding page ${activeIndex + 1} of ${SLIDE_COUNT}`}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.dotBase,
            i === activeIndex ? [styles.dotActive, { backgroundColor: activeBg }] : [styles.dotIdle, { backgroundColor: idleBg }],
          ]}
        />
      ))}
    </View>
  )
}

export function OnboardingFlow() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width, height } = Dimensions.get('window')
  const listRef = useRef<FlatList>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const [bricolageLoaded] = useBricolageFonts({ BricolageGrotesque_800ExtraBold })
  const [nunitoLoaded] = useNunitoFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  })

  const fontsReady = bricolageLoaded && nunitoLoaded

  useEffect(() => {
    if (fontsReady) void SplashScreen.hideAsync()
  }, [fontsReady])

  const goNext = useCallback(() => {
    setActiveIndex((prev) => {
      const next = Math.min(SLIDE_COUNT - 1, prev + 1)
      listRef.current?.scrollToIndex({ index: next, animated: true })
      return next
    })
  }, [])

  const goHome = useCallback(() => {
    router.push('/signup' as Href)
  }, [router])

  const goLogin = useCallback(() => {
    router.push('/login' as Href)
  }, [router])

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x
      const i = Math.round(x / width)
      setActiveIndex(Math.min(SLIDE_COUNT - 1, Math.max(0, i)))
    },
    [width],
  )

  const renderItem: ListRenderItem<number> = useCallback(
    ({ index }) => (
      <View style={{ width, height }}>
        {index === 0 ? (
          <WelcomeSlide
            insets={insets}
            onStart={goNext}
            onLogin={goLogin}
            displayFont={FONT_DISPLAY}
            bodyFont={FONT_BODY_SEMI}
            slideHeight={height}
          />
        ) : null}
        {index === 1 ? (
          <SnapSlide
            insets={insets}
            onContinue={goNext}
            onSkip={goHome}
            displayFont={FONT_DISPLAY}
            bodyFont={FONT_BODY}
            bodyBoldFont={FONT_BODY_BOLD}
            slideHeight={height}
          />
        ) : null}
        {index === 2 ? (
          <CollectSlide
            insets={insets}
            onFinish={goHome}
            onSkip={goHome}
            displayFont={FONT_DISPLAY}
            bodyFont={FONT_BODY}
            slideHeight={height}
          />
        ) : null}
      </View>
    ),
    [goHome, goNext, height, insets, width],
  )

  if (!fontsReady) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  return (
    <View style={[styles.root, { height }]}>
      <FlatList
        ref={listRef}
        data={[0, 1, 2]}
        keyExtractor={(item) => String(item)}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        initialNumToRender={3}
        windowSize={3}
        style={{ flex: 1 }}
      />
      <View style={[styles.dotsOverlay, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]} pointerEvents="none">
        <PaginationDots activeIndex={activeIndex} variant={activeIndex === 0 ? 'light' : 'dark'} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  dotsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingTop: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotBase: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  dotIdle: {
    width: 8,
  },
})

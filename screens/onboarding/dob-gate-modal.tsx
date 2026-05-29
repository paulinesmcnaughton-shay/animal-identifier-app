import {
  BricolageGrotesque_800ExtraBold,
  useFonts as useBricolageFonts,
} from '@expo-google-fonts/bricolage-grotesque'
import { Nunito_400Regular, Nunito_700Bold, useFonts as useNunitoFonts } from '@expo-google-fonts/nunito'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { WildKindLogo } from '@/components/WildKindLogo'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { PrivacyTermsModal } from '@/screens/onboarding/privacy-terms-modal'

const UNSET = '---'
const MONTHS = [UNSET, 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const DAYS = [UNSET, ...Array.from({ length: 31 }, (_, i) => String(i + 1))]
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [UNSET, ...Array.from({ length: 110 }, (_, i) => String(CURRENT_YEAR - i))]

const ITEM_H = 64
const VISIBLE_ITEMS = 3

const FLOATING_ANIMALS = [
  { emoji: '🦊', top: '5%',  left: '5%',   size: 36 },
  { emoji: '🦋', top: '12%', right: '8%',  size: 28 },
  { emoji: '🐢', top: '19%', left: '14%',  size: 32 },
  { emoji: '🦁', top: '26%', right: '5%',  size: 40 },
  { emoji: '🐸', top: '33%', left: '4%',   size: 28 },
  { emoji: '🦜', top: '40%', right: '10%', size: 34 },
  { emoji: '🦉', top: '47%', left: '16%',  size: 30 },
  { emoji: '🐝', top: '54%', right: '6%',  size: 26 },
  { emoji: '🦎', top: '61%', left: '6%',   size: 32 },
  { emoji: '🦅', top: '68%', right: '12%', size: 34 },
  { emoji: '🦦', top: '75%', left: '12%',  size: 28 },
  { emoji: '🦔', top: '82%', right: '5%',  size: 28 },
  { emoji: '🦌', top: '89%', left: '5%',   size: 30 },
  { emoji: '🦩', top: '89%', right: '12%', size: 28 },
] as const

function FloatingAnimal({ emoji, size, style }: { emoji: string; size: number; style: object }) {
  const opacity = useRef(new Animated.Value(0.18)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.45, duration: 2400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.12, duration: 2800, useNativeDriver: true }),
      ])
    ).start()
  }, [opacity])

  return (
    <Animated.Text style={[{ position: 'absolute', fontSize: size, opacity }, style]}>
      {emoji}
    </Animated.Text>
  )
}

function DrumColumn({
  items,
  defaultValue,
  onChange,
  width,
}: {
  items: string[]
  defaultValue: string
  onChange: (v: string) => void
  width: number
}) {
  const scrollRef = useRef<ScrollView>(null)
  const defaultIdx = Math.max(0, items.indexOf(defaultValue))

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: defaultIdx * ITEM_H, animated: false })
    }, 80)
    return () => clearTimeout(timer)
  }, [defaultIdx])

  return (
    <View style={[styles.drum, { width }]}>
      <View style={styles.drumHighlight} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_H }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H)
          onChange(items[Math.max(0, Math.min(idx, items.length - 1))])
        }}
      >
        {items.map((item) => (
          <View key={item} style={styles.drumItem}>
            <Text style={styles.drumText}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

interface DobGateModalProps {
  visible: boolean
  isLoading: boolean
  onSubmit: (dob: Date) => void
}

export function DobGateModal({ visible, isLoading, onSubmit }: DobGateModalProps) {
  const insets = useSafeAreaInsets()

  const [month, setMonth] = useState(UNSET)
  const [day, setDay] = useState(UNSET)
  const [year, setYear] = useState(UNSET)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const [bricolageLoaded] = useBricolageFonts({ BricolageGrotesque_800ExtraBold })
  const [nunitoLoaded] = useNunitoFonts({ Nunito_400Regular, Nunito_700Bold })
  const fontsReady = bricolageLoaded && nunitoLoaded

  const allFilled = month !== UNSET && day !== UNSET && year !== UNSET

  const handleSubmit = () => {
    if (!allFilled) return
    const monthIdx = MONTHS.indexOf(month) - 1
    const dob = new Date(parseInt(year, 10), monthIdx, parseInt(day, 10))
    onSubmit(dob)
  }

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent presentationStyle="fullScreen">
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, space[24]) }]}>

        {FLOATING_ANIMALS.map(({ emoji, size, ...pos }) => (
          <FloatingAnimal key={emoji} emoji={emoji} size={size} style={pos} />
        ))}

        <View style={styles.logoWrap}>
          {fontsReady
            ? <WildKindLogo width={200} color="#FFFFFF" />
            : null}
        </View>

        <View style={styles.content}>
          <Text style={[styles.prompt, fontsReady && { fontFamily: 'Nunito_700Bold' }]}>
            Please enter your date of birth.
          </Text>

          <View style={styles.drumsRow}>
            <DrumColumn items={MONTHS} defaultValue={month} onChange={setMonth} width={100} />
            <DrumColumn items={DAYS} defaultValue={day} onChange={setDay} width={76} />
            <DrumColumn items={YEARS} defaultValue={year} onChange={setYear} width={108} />
          </View>

          <View style={[styles.ctaWrap, (!allFilled || isLoading) && styles.ctaWrapDisabled]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Submit date of birth"
              onPress={handleSubmit}
              disabled={isLoading || !allFilled}
              style={({ pressed }) => [
                styles.cta,
                pressed && allFilled && styles.ctaPressed,
                (!allFilled || isLoading) && styles.ctaDisabled,
              ]}>
              {isLoading
                ? <ActivityIndicator color={colors.switchOff} />
                : <Text style={[
                    styles.ctaText,
                    fontsReady && { fontFamily: 'BricolageGrotesque_800ExtraBold' },
                    (!allFilled || isLoading) && styles.ctaTextDisabled,
                  ]}>Submit</Text>
              }
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Privacy and Terms"
            onPress={() => setShowPrivacy(true)}
            style={({ pressed }) => [styles.privacyBtn, pressed && { opacity: 0.6 }]}>
            <Text style={[styles.privacyText, fontsReady && { fontFamily: 'Nunito_400Regular' }]}>
              Privacy & Terms
            </Text>
          </Pressable>
        </View>
      </View>
      <PrivacyTermsModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.green,
    alignItems: 'center',
  },
  logoWrap: {
    marginTop: space[48],
    marginBottom: space[16],
    zIndex: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[24],
    zIndex: 2,
    width: '100%',
  },
  prompt: {
    fontSize: typeTokens.size.title,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: space[32],
    lineHeight: 26,
  },
  drumsRow: {
    flexDirection: 'row',
    gap: space[8],
    marginBottom: space[40],
  },
  drum: {
    height: ITEM_H * VISIBLE_ITEMS,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  drumHighlight: {
    position: 'absolute',
    top: ITEM_H,
    left: 0,
    right: 0,
    height: ITEM_H,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.greenLight,
    zIndex: 1,
  },
  drumItem: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drumText: {
    fontSize: typeTokens.size.displaySM,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  ctaWrap: {
    width: '100%',
    backgroundColor: colors.greenDeep,
    borderRadius: radius.lg,
    paddingBottom: 4,
    marginBottom: space[24],
  },
  ctaWrapDisabled: {
    backgroundColor: colors.hairline,
  },
  cta: {
    backgroundColor: colors.greenLight,
    borderRadius: radius.lg,
    paddingVertical: space[16],
    alignItems: 'center',
  },
  ctaPressed: { transform: [{ translateY: 2 }] },
  ctaDisabled: { backgroundColor: '#E4E9EE' },
  ctaText: {
    color: '#FFFFFF',
    fontSize: typeTokens.size.displaySM,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  ctaTextDisabled: { color: colors.switchOff },
  privacyBtn: {
    paddingVertical: space[8],
  },
  privacyText: {
    fontSize: typeTokens.size.caption,
    color: 'rgba(255,255,255,0.55)',
    textDecorationLine: 'underline',
  },
})

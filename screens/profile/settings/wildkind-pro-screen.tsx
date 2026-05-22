import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

import { SettingsDetailShell } from '@/components/settings/SettingsDetailShell'
import { Button } from '@/design/atoms/Button'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'

const PRO_FEATURES = [
  { icon: 'scan' as const, title: 'Unlimited IDs', body: 'No daily cap on wildlife scans' },
  { icon: 'volume-high' as const, title: 'Species sounds', body: 'Calls and songs in the field guide' },
  { icon: 'map' as const, title: 'Offline maps', body: 'Download regions for backcountry spots' },
  { icon: 'star' as const, title: 'Pro badges', body: 'Exclusive collector medals' },
]

export function WildKindProScreenContent() {
  const router = useRouter()

  return (
    <SettingsDetailShell title="WildKind Pro" onBack={() => router.back()} contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="star" size={28} color={colors.card} />
        </View>
        <Text style={styles.heroTitle}>Go Pro</Text>
        <Text style={styles.heroBody}>
          Unlock unlimited identifications, species sounds, and offline maps for serious naturalists.
        </Text>
      </View>

      <View style={styles.featureGroup}>
        {PRO_FEATURES.map((feature, index) => (
          <View
            key={feature.title}
            style={[styles.featureRow, index < PRO_FEATURES.length - 1 && styles.featureRowBorder]}>
            <View style={styles.featureIcon}>
              <Ionicons name={feature.icon} size={18} color={colors.coral} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureBody}>{feature.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.ctaWrap}>
        <Button label="Start free trial" onPress={() => {}} />
        <Text style={styles.priceHint}>$4.99/month · cancel anytime</Text>
      </View>
    </SettingsDetailShell>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: space[24],
    paddingTop: space[8],
  },
  hero: {
    alignItems: 'center',
    gap: space[8],
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  heroBody: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: space[16],
  },
  featureGroup: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[16],
    padding: space[16],
  },
  featureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
  },
  featureBody: {
    fontSize: typeTokens.size.bodySM,
    color: colors.dim,
  },
  ctaWrap: {
    gap: space[8],
  },
  priceHint: {
    fontSize: typeTokens.size.caption,
    color: colors.dim,
    textAlign: 'center',
  },
})

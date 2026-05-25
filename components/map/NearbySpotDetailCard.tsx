import { Ionicons } from '@expo/vector-icons'
import { Image, type ImageSource } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { KingdomBadge } from '@/design/atoms/KingdomBadge'
import { VerifiedIcon } from '@/components/map/VerifiedIcon'
import { SpeciesPhotoLightbox } from '@/components/map/SpeciesPhotoLightbox'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import {
  nearbySafetyLabel,
  type NearbyFieldGuide,
} from '@/features/map/nearby-field-guide'
import type { NearbyMapSighting } from '@/features/map/map-sighting'
import { useNearbySpotDetail } from '@/features/map/use-nearby-spot-detail'
import { getLocalSpeciesHeroImage } from '@/features/species/resolve-species-hero-image'
import { NEARBY_RADIUS_MILES } from '@/features/map/nearby-radius'
import {
  type DistanceUnit,
  formatDistance,
} from '@/features/settings/distance-unit'

const PRIVATE_PROPERTY_NOTICE =
  'Stay on public paths and open spaces only. Never enter private property, yards, or fenced land to get closer — you can be fined or hurt, and wildlife is stressed by trespassing.'

interface NearbySpotDetailCardProps {
  sighting: NearbyMapSighting
  distanceUnit: DistanceUnit
  /** Label on the back row (e.g. "Nearby" or "My Sightings"). */
  listLabel?: string
  canTakeMeThere?: boolean
  onBack: () => void
  onTakeMeThere: () => void
}

export function NearbySpotDetailCard({
  sighting,
  distanceUnit,
  listLabel = 'Nearby',
  canTakeMeThere = true,
  onBack,
  onTakeMeThere,
}: NearbySpotDetailCardProps) {
  const { species, guide, remotePhotoUrl, isHeroImageLoading } = useNearbySpotDetail(sighting)
  const localHero = getLocalSpeciesHeroImage(sighting.speciesId ?? sighting.name)
  const [remoteImageFailed, setRemoteImageFailed] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    setRemoteImageFailed(false)
    setLightboxOpen(false)
  }, [remotePhotoUrl, sighting.id])

  const showRemoteHero = Boolean(remotePhotoUrl && !remoteImageFailed)
  const showHeroSpinner = isHeroImageLoading && !localHero && !showRemoteHero

  const heroSource = useMemo((): ImageSource | null => {
    if (localHero != null) return localHero as ImageSource
    if (showRemoteHero && remotePhotoUrl) return { uri: remotePhotoUrl }
    return null
  }, [localHero, remotePhotoUrl, showRemoteHero])

  const canExpandPhoto = heroSource !== null

  const handleCloseLightbox = () => {
    setLightboxOpen(false)
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to nearby list"
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
          <Text style={styles.backText}>{listLabel}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole={canExpandPhoto ? 'button' : undefined}
          accessibilityLabel={
            canExpandPhoto ? `View full photo of ${sighting.name}` : undefined
          }
          disabled={!canExpandPhoto}
          onPress={() => setLightboxOpen(true)}
          style={styles.heroWrap}>
          {localHero ? (
            <Image source={localHero} style={styles.heroImage} contentFit="cover" />
          ) : showRemoteHero ? (
            <Image
              source={{ uri: remotePhotoUrl! }}
              style={styles.heroImage}
              contentFit="cover"
              onError={() => setRemoteImageFailed(true)}
            />
          ) : (
            <LinearGradient
              colors={[...species.gradient]}
              style={styles.heroImage}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          {showHeroSpinner ? (
            <View style={styles.heroLoading}>
              <ActivityIndicator color={colors.card} />
            </View>
          ) : null}
          {canExpandPhoto ? (
            <View style={styles.expandChip} pointerEvents="none">
              <Ionicons name="expand-outline" size={16} color={colors.card} />
            </View>
          ) : null}
        </Pressable>

        <SpeciesPhotoLightbox
          visible={lightboxOpen}
          source={heroSource}
          speciesName={sighting.name}
          onClose={handleCloseLightbox}
        />

        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <Text style={styles.name}>{sighting.name}</Text>
            {species.latinName ? (
              <Text style={styles.latin}>{species.latinName}</Text>
            ) : null}
            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                {formatDistance(sighting.distanceM, distanceUnit)}
                {sighting.source === 'user'
                  ? ' · Your sighting'
                  : sighting.isVerified
                    ? ' · '
                    : ' · Community sighting'}
              </Text>
              {sighting.source !== 'user' && sighting.isVerified ? (
                <>
                  <VerifiedIcon size={12} />
                  <Text style={styles.meta}>Verified sighting</Text>
                </>
              ) : null}
            </View>
          </View>
          <KingdomBadge kind={sighting.kingdom} />
        </View>

        <GuideSection title="What is it?" body={guide.whatIsIt} />
        <SafetySection guide={guide} />
        <GuideSection title="How to approach (for photos)" body={guide.approachTip} />
        <GuideSection title="Best time to spot" body={guide.bestTimeToSpot} />

        <View style={styles.noticeBox}>
          <Ionicons name="home-outline" size={18} color={colors.earth} />
          <Text style={styles.noticeText}>{PRIVATE_PROPERTY_NOTICE}</Text>
        </View>

        {canTakeMeThere ? (
          <View style={styles.btnWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Get walking directions"
              onPress={onTakeMeThere}
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
              <Ionicons name="walk" size={18} color={colors.card} />
              <Text style={styles.btnText}>Get directions</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.outOfRangeNote}>
            In-app directions only work for spots within {NEARBY_RADIUS_MILES} miles of your
            current location.
          </Text>
        )}
      </ScrollView>
    </View>
  )
}

function GuideSection({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  )
}

function SafetySection({ guide }: { guide: NearbyFieldGuide }) {
  const isHigh = guide.safetyLevel === 'high'
  const isModerate = guide.safetyLevel === 'moderate'
  const tint = isHigh ? colors.coral : isModerate ? colors.sun : colors.green

  return (
    <View style={[styles.safetyBox, { borderColor: `${tint}55`, backgroundColor: `${tint}18` }]}>
      <View style={styles.safetyHeader}>
        <Ionicons
          name={isHigh ? 'warning' : isModerate ? 'alert-circle' : 'shield-checkmark'}
          size={18}
          color={tint}
        />
        <Text style={[styles.safetyTitle, { color: tint }]}>
          {nearbySafetyLabel(guide.safetyLevel)}
        </Text>
      </View>
      <Text style={styles.sectionBody}>{guide.safetyNote}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space[8],
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    paddingVertical: space[4],
  },
  backText: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
  },
  pressed: {
    opacity: 0.7,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: space[16],
    gap: space[8],
  },
  heroWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.hairline,
  },
  heroImage: {
    width: '100%',
    height: 140,
  },
  heroLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21, 33, 48, 0.2)',
  },
  expandChip: {
    position: 'absolute',
    right: space[8],
    bottom: space[8],
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(21, 33, 48, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[8],
  },
  titleText: {
    flex: 1,
    gap: space[4],
  },
  name: {
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.display.weight,
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  latin: {
    fontSize: typeTokens.size.bodySM,
    fontStyle: 'italic',
    color: colors.dim,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    flexWrap: 'wrap',
  },
  meta: {
    fontSize: typeTokens.size.caption,
    color: colors.dim,
    fontWeight: typeTokens.body.weights.medium,
  },
  section: {
    gap: space[4],
  },
  sectionTitle: {
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBody: {
    fontSize: typeTokens.size.bodySM,
    color: colors.ink2,
    lineHeight: 20,
  },
  safetyBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space[16],
    gap: space[8],
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  safetyTitle: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[8],
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    padding: space[16],
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  noticeText: {
    flex: 1,
    fontSize: typeTokens.size.caption,
    color: colors.ink2,
    lineHeight: 18,
  },
  btnWrap: {
    backgroundColor: colors.greenDeep,
    borderRadius: radius.lg,
    paddingBottom: 4,
    marginTop: space[4],
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    backgroundColor: colors.green,
    paddingVertical: space[16],
    borderRadius: radius.lg,
  },
  btnPressed: {
    transform: [{ translateY: 2 }],
  },
  btnText: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.card,
  },
  outOfRangeNote: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    textAlign: 'center',
    paddingVertical: space[16],
  },
})

import { Ionicons } from '@expo/vector-icons'
import { Link, router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CollectionStatsCard } from '@/components/collection-stats-card'
import { DexCollectionEmpty } from '@/components/dex/DexCollectionEmpty'
import { DexCard, type DexCardSpecies } from '@/components/DexCard'
import { DEX_COLLECTION_SIZE } from '@/data/dex-collection'
import { KINGDOM, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { contentTopInset, screenLayout } from '@/design/screen-layout'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { deleteUserSighting } from '@/features/sightings/delete-user-sighting'
import { useAccountProfile } from '@/features/settings/account-profile'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useUserSightingsData } from '@/features/sightings/use-user-sightings-data'
import { speciesDetailRouteParamsFromId } from '@/features/species/species-latin-names'
import { useAuth } from '@/lib/auth/auth-context'

const H_PAD = screenLayout.padH
const GAP = space[8]

const FILTERS: { key: string; label: string; kind: KingdomKey | null }[] = [
  { key: 'all', label: `All ${DEX_COLLECTION_SIZE}`, kind: null },
  { key: 'mammal', label: 'Mammals', kind: 'mammal' },
  { key: 'bird', label: 'Birds', kind: 'bird' },
  { key: 'insect', label: 'Insects', kind: 'insect' },
]

export function CollectionScreen() {
  const insets = useSafeAreaInsets()
  const [activeFilter, setActiveFilter] = useState('all')
  const { isAuthenticated } = useAuth()
  const { spotsCaptured, streakDays, badgesCount, isLoading, isReady } = useAccountProfile()
  const { dexEntries, isLoading: dexDataLoading } = useUserSightingsData()

  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<DexCardSpecies | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pendingDeleteHasJournalData, setPendingDeleteHasJournalData] = useState(false)

  // Check if the species being deleted has any sightings with notes/journal/caption.
  // Fetches up to 20 active sightings and checks in JS to avoid unreliable PostgREST NULL syntax.
  useEffect(() => {
    if (!pendingDelete) { setPendingDeleteHasJournalData(false); return }
    console.log('PENDING DELETE SET species id:', pendingDelete.id)
    const supabase = getSupabaseClient()
    if (!supabase) return
    let cancelled = false
    void (async () => {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId || cancelled) return
      const { data } = await supabase
        .from('user_sightings')
        .select('notes, journal_entry, user_caption')
        .eq('user_id', userId)
        .eq('species_id', pendingDelete.id)
        .eq('is_deleted', false)
        .limit(20)
      if (!cancelled) {
        const hasData = (data ?? []).some(
          (r) => r.notes || r.journal_entry || r.user_caption,
        )
        setPendingDeleteHasJournalData(hasData)
      }
    })()
    return () => { cancelled = true }
  }, [pendingDelete])

  const colWidth = useMemo(() => {
    const w = Dimensions.get('window').width
    return (w - H_PAD * 2 - GAP * 2) / 3
  }, [])

  const rows = useMemo(() => {
    if (spotsCaptured === 0) return []

    const filtered =
      activeFilter === 'all'
        ? dexEntries
        : dexEntries.filter((entry) => entry.kingdom === activeFilter)

    const result: DexCardSpecies[][] = []
    for (let i = 0; i < filtered.length; i += 3) {
      result.push(filtered.slice(i, i + 3))
    }
    return result
  }, [activeFilter, dexEntries, spotsCaptured])

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    console.log('CONFIRM DELETE PRESSED species id:', pendingDelete.id)
    setIsDeleting(true)
    const result = await deleteUserSighting(pendingDelete.id)
    console.log('DELETE RESULT:', result)
    setIsDeleting(false)
    setPendingDelete(null)
    setPendingDeleteHasJournalData(false)
  }

  if (isLoading || !isReady || (isAuthenticated && dexDataLoading && spotsCaptured > 0)) {
    return (
      <View style={[styles.screen, styles.loading, { paddingTop: contentTopInset(insets.top) }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: contentTopInset(insets.top) }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>YOUR COLLECTION</Text>
            <Text style={styles.title}>Wild Dex</Text>
          </View>
          {isDeleteMode ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Exit edit mode"
              onPress={() => setIsDeleteMode(false)}
              style={({ pressed }) => [styles.doneBtn, pressed && styles.doneBtnPressed]}>
              <Text style={styles.doneBtnLabel}>Done</Text>
            </Pressable>
          ) : (
            <Link href="/dex/search" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Filter collection"
                style={({ pressed }) => [styles.filterBtn, pressed && styles.filterBtnPressed]}>
                <Ionicons name="funnel-outline" size={22} color={colors.ink2} />
              </Pressable>
            </Link>
          )}
        </View>

        <CollectionStatsCard
          collected={spotsCaptured}
          total={DEX_COLLECTION_SIZE}
          streakDays={streakDays}
          trophies={badgesCount}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
          style={styles.chipsWrap}>
          {FILTERS.map((f) => {
            const active = activeFilter === f.key
            const kingdom = f.kind ? KINGDOM[f.kind] : null
            const activeBg = kingdom ? kingdom.bg : colors.green
            return (
              <Pressable
                key={f.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setActiveFilter(f.key)}
                style={[
                  styles.chip,
                  active
                    ? [styles.chipActive, { backgroundColor: activeBg, borderColor: activeBg }]
                    : styles.chipIdle,
                ]}>
                <Text style={[styles.chipLabel, active ? styles.chipLabelActive : styles.chipLabelIdle]}>
                  {kingdom ? `${kingdom.emoji} ` : ''}{f.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {spotsCaptured === 0 ? (
          <DexCollectionEmpty />
        ) : (
          <View style={styles.grid}>
            {rows.map((row, ri) => (
              <View key={`row-${ri}`} style={styles.gridRow}>
                {row.map((species) => (
                  <DexCard
                    key={species.id}
                    species={species}
                    width={colWidth}
                    isDeleteMode={isDeleteMode}
                    onLongPress={() => setIsDeleteMode(true)}
                    onDeletePress={() => setPendingDelete(species)}
                    onPress={() =>
                      router.push({
                        pathname: '/species/[id]',
                        params: speciesDetailRouteParamsFromId({
                          id: species.id,
                          name: species.name,
                          number: species.number,
                          kingdom: species.kingdom,
                        }) as { id: string } & Record<string, string>,
                      })
                    }
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <DeleteConfirmModal
        species={pendingDelete}
        isDeleting={isDeleting}
        hasJournalData={pendingDeleteHasJournalData}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  )
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

interface DeleteConfirmModalProps {
  species: DexCardSpecies | null
  isDeleting: boolean
  hasJournalData: boolean
  onConfirm: () => void
  onCancel: () => void
}

function DeleteConfirmModal({ species, isDeleting, hasJournalData, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <Modal
      visible={species !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={() => {}}>
          <View style={styles.dialogIconWrap}>
            <Ionicons name="trash-outline" size={28} color={colors.coral} />
          </View>
          <Text style={styles.dialogTitle}>Remove from Wild Dex?</Text>
          <Text style={styles.dialogBody}>
            <Text style={styles.dialogSpeciesName}>{species?.name}</Text>
            {' '}will be permanently removed from your collection. All sightings of this species will be deleted.
          </Text>
          {hasJournalData ? (
            <View style={styles.journalWarning}>
              <Ionicons name="journal-outline" size={16} color={colors.earth} />
              <Text style={styles.journalWarningText}>
                This sighting has saved notes or journal entries. You may want to export your journal before deleting.
              </Text>
            </View>
          ) : null}
          <View style={styles.dialogActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [styles.actionBtn, styles.cancelBtn, pressed && styles.actionBtnPressed]}>
              <Text style={styles.cancelBtnLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              disabled={isDeleting}
              style={({ pressed }) => [styles.actionBtn, styles.deleteConfirmBtn, pressed && styles.actionBtnPressed]}>
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.card} />
              ) : (
                <Text style={styles.deleteConfirmBtnLabel}>
                  {hasJournalData ? 'Delete Anyway' : 'Delete'}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: H_PAD,
    gap: space[16],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: screenLayout.iconBtnSize,
  },
  headerText: {
    flex: 1,
    gap: space[4],
  },
  kicker: {
    fontSize: typeTokens.size.micro,
    fontWeight: '700',
    color: colors.dim,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: typeTokens.size.displayMD,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  filterBtn: {
    width: screenLayout.iconBtnSize,
    height: screenLayout.iconBtnSize,
    borderRadius: screenLayout.iconBtnSize / 2,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  filterBtnPressed: {
    opacity: 0.92,
  },
  doneBtn: {
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    borderRadius: radius.pill,
    backgroundColor: colors.green,
  },
  doneBtnPressed: {
    opacity: 0.8,
  },
  doneBtnLabel: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '700',
    color: colors.card,
  },
  chipsWrap: {
    marginHorizontal: -H_PAD,
  },
  chipsScroll: {
    paddingHorizontal: H_PAD,
    gap: space[8],
    paddingVertical: space[4],
  },
  chip: {
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipIdle: {
    backgroundColor: colors.card,
    borderColor: colors.hairline,
  },
  chipLabel: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: colors.card,
  },
  chipLabelIdle: {
    color: colors.ink,
  },
  grid: {
    gap: GAP,
    paddingTop: space[8],
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: GAP,
  },
  // ── Modal ──
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[32],
  },
  dialog: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: space[24],
    alignItems: 'center',
    gap: space[16],
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 16,
  },
  dialogIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.coral}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontSize: typeTokens.size.title,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  dialogBody: {
    fontSize: typeTokens.size.bodySM,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 20,
  },
  dialogSpeciesName: {
    fontWeight: '700',
    color: colors.ink,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: space[8],
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: space[16],
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPressed: {
    opacity: 0.75,
  },
  cancelBtn: {
    backgroundColor: colors.bg2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  cancelBtnLabel: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '700',
    color: colors.ink,
  },
  deleteConfirmBtn: {
    backgroundColor: colors.coral,
  },
  deleteConfirmBtnLabel: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '700',
    color: colors.card,
  },
  journalWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[8],
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    marginTop: space[8],
  },
  journalWarningText: {
    flex: 1,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.earth,
    lineHeight: 18,
  },
})

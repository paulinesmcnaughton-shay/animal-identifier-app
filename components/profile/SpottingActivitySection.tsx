import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { dexCardHairline } from '@/design/dex-card-shell'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'

const HEATMAP_MONTHS = 12
const HEATMAP_DAYS = 7

const HEAT_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const HEAT_MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

const HEAT_CELL = 10
const HEAT_GAP = 3
const HEAT_DAY_LABEL_W = 30
const HEAT_MONTH_ROW_H = 16

const HEAT_THEME = {
  card: colors.card,
  label: colors.dim,
  total: colors.green,
  future: colors.hairline,
  levels: ['#E7EDF3', '#A7D4BA', '#6BBF98', '#3DA876', colors.green] as const,
}

interface SpottingHeatmap {
  monthCount: number
  monthLabels: string[]
  levels: (number | null)[]
}

function mockActivityLevel(year: number, monthIndex: number, dayIndex: number): number {
  const seed = year * 372 + monthIndex * 31 + dayIndex
  const rand = (Math.sin(seed) + 1) / 2
  if (rand < 0.15) return 0
  if (rand < 0.35) return 1
  if (rand < 0.60) return 2
  if (rand < 0.80) return 3
  return 4
}

function buildSpottingHeatmap(today: Date, hasActivity: boolean): SpottingHeatmap {
  const year = today.getFullYear()
  const currentMonth = today.getMonth()
  const monthLabels = [...HEAT_MONTH_SHORT]

  const levels: (number | null)[] = []
  for (let monthIndex = 0; monthIndex < HEATMAP_MONTHS; monthIndex++) {
    for (let dayIndex = 0; dayIndex < HEATMAP_DAYS; dayIndex++) {
      if (monthIndex > currentMonth) {
        levels.push(null)
        continue
      }

      levels.push(
        hasActivity ? mockActivityLevel(year, monthIndex, dayIndex) : 0,
      )
    }
  }

  return { monthCount: HEATMAP_MONTHS, monthLabels, levels }
}

function cellFill(level: number | null): string {
  if (level === null) return HEAT_THEME.future
  return HEAT_THEME.levels[level]
}

interface SpottingActivitySectionProps {
  spotsCaptured: number
}

export function SpottingActivitySection({ spotsCaptured }: SpottingActivitySectionProps) {
  const hasActivity = spotsCaptured > 0
  const spottingHeatmap = useMemo(
    () => buildSpottingHeatmap(new Date(), hasActivity),
    [hasActivity],
  )

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Spotting activity</Text>
      <View style={styles.heatCard}>
        <View style={styles.heatHeader}>
          <Text style={styles.heatPeriod}>Current year</Text>
          <Text style={styles.heatTotal}>{spotsCaptured} spots</Text>
        </View>

        <View style={styles.heatChart}>
          <View style={styles.heatChartBody}>
            <View style={styles.heatDayLabelsCol}>
              <View style={{ height: HEAT_MONTH_ROW_H }} />
              {HEAT_DAY_LABELS.map((dayLabel) => (
                <View key={dayLabel} style={styles.heatDayLabelCell}>
                  <Text style={[styles.heatAxisLabel, styles.heatDayLabel]}>{dayLabel}</Text>
                </View>
              ))}
            </View>

            <View style={styles.heatGrid}>
              <View style={styles.heatMonthRow}>
                {spottingHeatmap.monthLabels.map((label, monthIndex) => (
                  <Text
                    key={`month-${monthIndex}`}
                    style={[styles.heatAxisLabel, styles.heatMonthLabel]}
                    numberOfLines={1}>
                    {label}
                  </Text>
                ))}
              </View>

              {HEAT_DAY_LABELS.map((dayLabel, dayIndex) => (
                <View key={dayLabel} style={styles.heatGridRow}>
                  {Array.from({ length: spottingHeatmap.monthCount }, (_, monthIndex) => {
                    const level =
                      spottingHeatmap.levels[monthIndex * HEATMAP_DAYS + dayIndex]
                    const month = spottingHeatmap.monthLabels[monthIndex]
                    return (
                      <View
                        key={monthIndex}
                        accessibilityLabel={`${dayLabel}, ${month}, ${level === null ? 'no activity yet' : level === 0 ? 'no spots' : `activity level ${level}`}`}
                        style={[styles.heatCell, { backgroundColor: cellFill(level) }]}
                      />
                    )
                  })}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.heatLegendRow}>
            <View style={{ flex: 1 }} />
            <View style={styles.heatLegend}>
              <Text style={styles.heatLegendText}>Less</Text>
              {HEAT_THEME.levels.map((fill, i) => (
                <View key={i} style={[styles.heatLegendCell, { backgroundColor: fill }]} />
              ))}
              <Text style={styles.heatLegendText}>More</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: space[16],
    marginTop: space[24],
  },
  sectionTitle: {
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.body.weights.black,
    color: colors.ink,
  },
  heatCard: {
    backgroundColor: HEAT_THEME.card,
    borderRadius: radius.lg,
    padding: space[16],
    marginTop: space[16],
    ...dexCardHairline,
    ...shadow.card,
  },
  heatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[8],
  },
  heatPeriod: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: HEAT_THEME.label,
  },
  heatTotal: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: HEAT_THEME.total,
  },
  heatChart: {
    gap: space[8],
  },
  heatChartBody: {
    flexDirection: 'row',
  },
  heatDayLabelsCol: {
    width: HEAT_DAY_LABEL_W,
  },
  heatDayLabelCell: {
    flex: 1,
    marginBottom: HEAT_GAP,
    justifyContent: 'center',
  },
  heatDayLabel: {
    textAlign: 'right',
    paddingRight: space[8],
  },
  heatGrid: {
    flex: 1,
  },
  heatMonthRow: {
    flexDirection: 'row',
    height: HEAT_MONTH_ROW_H,
    marginBottom: space[4],
    gap: HEAT_GAP,
  },
  heatMonthLabel: {
    flex: 1,
    textAlign: 'center',
  },
  heatGridRow: {
    flexDirection: 'row',
    gap: HEAT_GAP,
    marginBottom: HEAT_GAP,
  },
  heatAxisLabel: {
    fontSize: 9,
    fontWeight: typeTokens.body.weights.medium,
    color: HEAT_THEME.label,
    textAlign: 'center',
  },
  heatCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  heatLegendRow: {
    flexDirection: 'row',
    marginTop: space[8],
  },
  heatLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  heatLegendText: {
    fontSize: 9,
    fontWeight: typeTokens.body.weights.medium,
    color: HEAT_THEME.label,
  },
  heatLegendCell: {
    width: HEAT_CELL,
    height: HEAT_CELL,
    borderRadius: 2,
  },
})

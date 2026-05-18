import { useLocalSearchParams } from 'expo-router'

import { resolveRouteParam } from '@/data/species-catalog'
import { SpeciesDetailScreen } from '@/screens/species/species-detail-screen'

export default function SpeciesDetailRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const id = resolveRouteParam(params.id) ?? 'unknown'

  return <SpeciesDetailScreen key={id} />
}

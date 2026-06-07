import { useLocalSearchParams } from 'expo-router'

import { VenueDetailScreen } from '@/screens/venues/venue-detail-screen'

export default function VenueDetailRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? ''
  return <VenueDetailScreen key={id} />
}

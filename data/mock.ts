import type { SpeciesDto } from '@/data/schemas'

export const mockSpecies: SpeciesDto[] = [
  { id: '1', commonName: 'Red Fox', scientificName: 'Vulpes vulpes' },
  { id: '2', commonName: 'Robin', scientificName: 'Erithacus rubecula' },
]

export const mockUser = {
  name: 'Eli',
  avatar: '🦊',
  level: 14,
  streakDays: 12,
}

export const mockWeeklyQuest = {
  title: 'Spot 3 insects this week',
  daysLeft: 4,
  current: 2,
  total: 3,
  xpReward: 50,
  progressEmoji: ['🪲', '🐝'],
}

export const mockCreatureOfDay = {
  id: 'gecko',
  commonName: 'Crested Gecko',
  scientificName: 'Correlophus ciliatus',
  kingdom: 'Reptile',
  description: 'Look up — they cling to leaves and branches with sticky toe pads. Active at dusk in warm, humid spots.',
  bonusXp: 20,
  gradient: ['#A4DE3A', '#15B981'] as const,
}

export const mockRecentFinds = [
  { id: 'fox',      number: '#012', name: 'Red Fox',          date: 'Today',     gradient: ['#FF6B5B', '#E04A39'] as const },
  { id: 'monarch',  number: '#047', name: 'Monarch',          date: 'Yesterday', gradient: ['#FFC93C', '#E8A020'] as const },
  { id: 'cardinal', number: '#003', name: 'Cardinal',         date: '2d ago',    gradient: ['#FF6B5B', '#A83232'] as const },
  { id: 'frog',     number: '#089', name: 'Treefrog',         date: '3d ago',    gradient: ['#15B981', '#0E8F65'] as const },
  { id: 'gecko',    number: '#054', name: 'Crested Gecko',    date: '1w ago',    gradient: ['#A4DE3A', '#6BAE1A'] as const },
]

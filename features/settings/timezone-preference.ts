import { storage } from '@/util/storage'

const STORAGE_KEY = 'settings.timezone'

export function detectDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'America/New_York'
  }
}

export async function loadTimezone(): Promise<string> {
  const stored = await storage.getString(STORAGE_KEY)
  return stored ?? detectDeviceTimezone()
}

export async function saveTimezone(tz: string): Promise<void> {
  await storage.set(STORAGE_KEY, tz)
}

export function timezoneLabel(tzId: string): string {
  const option = TIMEZONE_OPTIONS.find(o => o.value === tzId)
  return option?.label ?? tzId
}

export interface TimezoneOption {
  value: string
  label: string
  region: string
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'America/New_York', label: 'Eastern Time', region: 'Americas' },
  { value: 'America/Chicago', label: 'Central Time', region: 'Americas' },
  { value: 'America/Denver', label: 'Mountain Time', region: 'Americas' },
  { value: 'America/Phoenix', label: 'Arizona (no DST)', region: 'Americas' },
  { value: 'America/Los_Angeles', label: 'Pacific Time', region: 'Americas' },
  { value: 'America/Anchorage', label: 'Alaska Time', region: 'Americas' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time', region: 'Americas' },
  { value: 'America/Toronto', label: 'Toronto', region: 'Americas' },
  { value: 'America/Vancouver', label: 'Vancouver', region: 'Americas' },
  { value: 'America/Halifax', label: 'Atlantic Time (Canada)', region: 'Americas' },
  { value: 'America/Mexico_City', label: 'Mexico City', region: 'Latin America' },
  { value: 'America/Bogota', label: 'Bogotá', region: 'Latin America' },
  { value: 'America/Lima', label: 'Lima', region: 'Latin America' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', region: 'Latin America' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires', region: 'Latin America' },
  { value: 'Europe/London', label: 'London', region: 'Europe' },
  { value: 'Europe/Dublin', label: 'Dublin', region: 'Europe' },
  { value: 'Europe/Lisbon', label: 'Lisbon', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid', region: 'Europe' },
  { value: 'Europe/Rome', label: 'Rome', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam', region: 'Europe' },
  { value: 'Europe/Stockholm', label: 'Stockholm', region: 'Europe' },
  { value: 'Europe/Warsaw', label: 'Warsaw', region: 'Europe' },
  { value: 'Europe/Athens', label: 'Athens', region: 'Europe' },
  { value: 'Europe/Helsinki', label: 'Helsinki', region: 'Europe' },
  { value: 'Europe/Bucharest', label: 'Bucharest', region: 'Europe' },
  { value: 'Europe/Istanbul', label: 'Istanbul', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow', region: 'Europe' },
  { value: 'Africa/Lagos', label: 'Lagos', region: 'Africa' },
  { value: 'Africa/Cairo', label: 'Cairo', region: 'Africa' },
  { value: 'Africa/Nairobi', label: 'Nairobi', region: 'Africa' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg', region: 'Africa' },
  { value: 'Asia/Jerusalem', label: 'Jerusalem', region: 'Middle East' },
  { value: 'Asia/Riyadh', label: 'Riyadh', region: 'Middle East' },
  { value: 'Asia/Dubai', label: 'Dubai', region: 'Middle East' },
  { value: 'Asia/Tehran', label: 'Tehran', region: 'Middle East' },
  { value: 'Asia/Karachi', label: 'Karachi', region: 'Asia' },
  { value: 'Asia/Kolkata', label: 'Mumbai / Kolkata', region: 'Asia' },
  { value: 'Asia/Dhaka', label: 'Dhaka', region: 'Asia' },
  { value: 'Asia/Bangkok', label: 'Bangkok', region: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore', region: 'Asia' },
  { value: 'Asia/Shanghai', label: 'Shanghai / Beijing', region: 'Asia' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', region: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Tokyo', region: 'Asia' },
  { value: 'Asia/Seoul', label: 'Seoul', region: 'Asia' },
  { value: 'Australia/Perth', label: 'Perth', region: 'Pacific' },
  { value: 'Australia/Adelaide', label: 'Adelaide', region: 'Pacific' },
  { value: 'Australia/Sydney', label: 'Sydney', region: 'Pacific' },
  { value: 'Australia/Melbourne', label: 'Melbourne', region: 'Pacific' },
  { value: 'Pacific/Auckland', label: 'Auckland', region: 'Pacific' },
  { value: 'Pacific/Fiji', label: 'Fiji', region: 'Pacific' },
]

export const TIMEZONE_REGIONS = [
  'Americas',
  'Latin America',
  'Europe',
  'Africa',
  'Middle East',
  'Asia',
  'Pacific',
] as const

export function getUtcOffsetLabel(tzId: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tzId,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date())
    return parts.find(p => p.type === 'timeZoneName')?.value ?? ''
  } catch {
    return ''
  }
}

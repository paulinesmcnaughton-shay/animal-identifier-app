import { useMemo, useSyncExternalStore } from 'react'

import { storage } from '@/util/storage'

const STORAGE_KEY = 'notifications.feed.v1'
const MAX = 50

export type NotificationIcon = 'sparkles' | 'ribbon' | 'trophy' | 'leaf' | 'flame'

export interface WildNotification {
  id: string
  title: string
  body?: string
  icon: NotificationIcon
  createdAt: number
  read: boolean
  dedupeKey?: string
}

export interface AddNotificationInput {
  title: string
  body?: string
  icon: NotificationIcon
  /** When set, a notification with the same key is only ever added once. */
  dedupeKey?: string
}

const EMPTY: WildNotification[] = []
let cache: WildNotification[] | null = null
let hydrating: Promise<void> | null = null
const listeners = new Set<() => void>()

function emit(): void {
  for (const l of listeners) l()
}

async function hydrate(): Promise<void> {
  if (cache) return
  if (!hydrating) {
    hydrating = (async () => {
      const raw = await storage.getString(STORAGE_KEY)
      cache = raw ? safeParse(raw) : []
    })()
  }
  await hydrating
}

async function persist(): Promise<void> {
  await storage.set(STORAGE_KEY, JSON.stringify(cache ?? []))
}

export async function addNotification(input: AddNotificationInput): Promise<void> {
  await hydrate()
  const list = cache ?? []
  if (input.dedupeKey && list.some((n) => n.dedupeKey === input.dedupeKey)) return

  const notif: WildNotification = {
    id: `n_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    title: input.title,
    body: input.body,
    icon: input.icon,
    createdAt: Date.now(),
    read: false,
    dedupeKey: input.dedupeKey,
  }
  cache = [notif, ...list].slice(0, MAX)
  emit()
  await persist()
}

export async function markAllNotificationsRead(): Promise<void> {
  await hydrate()
  if (!cache || cache.every((n) => n.read)) return
  cache = cache.map((n) => (n.read ? n : { ...n, read: true }))
  emit()
  await persist()
}

function getSnapshot(): WildNotification[] {
  return cache ?? EMPTY
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  void hydrate().then(emit)
  return () => {
    listeners.delete(listener)
  }
}

export function useNotifications(): { notifications: WildNotification[]; unreadCount: number } {
  const notifications = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])
  return { notifications, unreadCount }
}

export function formatTimeAgo(createdAt: number): string {
  const minutes = Math.floor((Date.now() - createdAt) / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(createdAt).toLocaleDateString()
}

function safeParse(raw: string): WildNotification[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as WildNotification[]) : []
  } catch {
    return []
  }
}

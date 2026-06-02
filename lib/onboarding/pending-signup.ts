import { storage } from '@/util/storage'

let _pendingPassword: string | null = null

export function setPendingPassword(password: string): void { _pendingPassword = password }
export function getPendingPassword(): string | null { return _pendingPassword }
export function clearPendingPassword(): void { _pendingPassword = null }

export async function storePendingEmailSignup(email: string, username: string, password: string): Promise<void> {
  _pendingPassword = password
  await Promise.all([
    storage.set('onboarding.method', 'email'),
    storage.set('onboarding.email', email),
    storage.set('onboarding.username', username),
    storage.set('onboarding.pending', 'true'),
  ])
}

export async function storePendingOAuthSignup(): Promise<void> {
  await Promise.all([
    storage.set('onboarding.method', 'oauth'),
    storage.set('onboarding.pending', 'true'),
  ])
}

export async function clearPendingOnboarding(): Promise<void> {
  _pendingPassword = null
  await Promise.all([
    storage.delete('onboarding.method'),
    storage.delete('onboarding.email'),
    storage.delete('onboarding.username'),
    storage.delete('onboarding.pending'),
    storage.delete('onboarding.date_of_birth'),
    storage.delete('onboarding.account_type'),
    storage.delete('onboarding.parent_name'),
    storage.delete('onboarding.parent_email'),
    storage.delete('onboarding.parent_permission_confirmed'),
    storage.delete('onboarding.requires_parent_setup'),
    storage.delete('onboarding.approval_token'),
    storage.delete('onboarding.full_name'),
    storage.delete('onboarding.location_text'),
    storage.delete('onboarding.latitude'),
    storage.delete('onboarding.longitude'),
    storage.delete('onboarding.timezone'),
    storage.delete('onboarding.interests'),
    storage.delete('onboarding.show_username'),
  ])
}

export async function isOnboardingPending(): Promise<boolean> {
  return (await storage.getString('onboarding.pending')) === 'true'
}

import { storage } from '@/util/storage'

/** Set on login (tester) vs signup (new user). */
export const TESTER_ACCOUNT_STORAGE_KEY = 'account.isTester'

export async function setTesterAccount(isTester: boolean): Promise<void> {
  await storage.set(TESTER_ACCOUNT_STORAGE_KEY, isTester ? 'true' : 'false')
}

export async function isTesterAccount(): Promise<boolean> {
  return (await storage.getString(TESTER_ACCOUNT_STORAGE_KEY)) === 'true'
}

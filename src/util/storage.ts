/**
 * Persistent key-value storage — swap for react-native-mmkv when installed.
 */
const memory = new Map<string, string>()

export const storage = {
  getString(key: string) {
    return memory.get(key) ?? null
  },
  set(key: string, value: string) {
    memory.set(key, value)
  },
  delete(key: string) {
    memory.delete(key)
  },
}

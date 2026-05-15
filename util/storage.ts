import AsyncStorage from '@react-native-async-storage/async-storage'

export const storage = {
  async getString(key: string) {
    return AsyncStorage.getItem(key)
  },
  async set(key: string, value: string) {
    return AsyncStorage.setItem(key, value)
  },
  async delete(key: string) {
    return AsyncStorage.removeItem(key)
  },
}

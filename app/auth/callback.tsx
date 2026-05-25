import { Redirect } from 'expo-router'

/** Handles OAuth deep links like wildkind://auth/callback */
export default function AuthCallbackScreen() {
  return <Redirect href="/home" />
}

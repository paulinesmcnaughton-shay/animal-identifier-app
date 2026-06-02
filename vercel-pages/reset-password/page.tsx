'use client'

// Deploy this file to your Next.js project at: app/reset-password/page.tsx
// It reads the Supabase auth tokens from the URL hash and hands them
// to the WildKind iOS app via deep link. No visible UI — instant redirect.

import { useEffect } from 'react'

export default function ResetPasswordRedirect() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const accessToken = hash.get('access_token')
    const refreshToken = hash.get('refresh_token')

    if (accessToken && refreshToken) {
      window.location.href =
        `wildkind://reset-password?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`
    } else {
      window.location.href = 'wildkind://reset-password'
    }
  }, [])

  return null
}

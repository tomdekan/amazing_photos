'use client'

import { authClient } from '@/lib/auth-client'

export const SignOutButton = () => {
  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.reload();
  }

  return (
    <button
      onClick={handleSignOut}
      type="button"
      className="text-xs text-red-300 hover:text-red-200 transition"
    >
      Sign Out
    </button>
  )
}
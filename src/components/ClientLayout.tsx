'use client'

import { AuthProvider } from '@/src/contexts/AuthContext'
import SignOutOverlay from '@/src/components/SignOutOverlay'
import { ReactNode } from 'react'

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <SignOutOverlay />
    </AuthProvider>
  )
}


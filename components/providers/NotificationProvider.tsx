'use client'

import React from 'react'
import { ToastContainer } from '@/components/common/ToastNotification'
import { PlayerSoldDialogContainer } from '@/components/common/PlayerSoldDialog'

interface NotificationProviderProps {
  children: React.ReactNode
}

/**
 * Provider component that includes the ToastContainer and PlayerSoldDialogContainer
 * This should be added to the root layout
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <ToastContainer />
      <PlayerSoldDialogContainer />
    </>
  )
}

export default NotificationProvider

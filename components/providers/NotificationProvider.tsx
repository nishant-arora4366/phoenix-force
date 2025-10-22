'use client'

import React from 'react'
import { ToastContainer } from '@/components/common/ToastNotification'

interface NotificationProviderProps {
  children: React.ReactNode
}

/**
 * Provider component that includes the ToastContainer
 * This should be added to the root layout
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  )
}

export default NotificationProvider

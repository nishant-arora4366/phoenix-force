import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import ClientLayout from '@/src/components/ClientLayout'
import Navbar from '@/src/components/Navbar'
import PWAInstallPrompt from '@/src/components/PWAInstallPrompt'
import PWAStatus from '@/src/components/PWAStatus'
import PWADetection from '@/src/components/PWADetection'
import NotificationProvider from '@/components/providers/NotificationProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://phoenixforce.in'),
  title: 'Phoenix Force Cricket',
  description: 'The ultimate platform for cricket tournament management with advanced auction systems, player ratings, and real-time bidding.',
  manifest: '/manifest.json',
  themeColor: '#19171b',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Phoenix Force Cricket',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Phoenix Force Cricket',
    description: 'The ultimate platform for cricket tournament management with advanced auction systems, player ratings, and real-time bidding.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://phoenixforce.in',
    siteName: 'Phoenix Force Cricket',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Phoenix Force Cricket - Tournament Management Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Phoenix Force Cricket',
    description: 'The ultimate platform for cricket tournament management with advanced auction systems, player ratings, and real-time bidding.',
    images: ['/logo.png'],
    creator: '@phoenixforce',
    site: '@phoenixforce',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta name="application-name" content="Phoenix Force Cricket" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Phoenix Force Cricket" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#19171b" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#19171b" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        <meta name="theme-color" content="#19171b" />
      </head>
      <body className={`${inter.className} bg-[#19171b]`}>
        <NotificationProvider>
          <ClientLayout>
            <div className="min-h-screen bg-[#19171b]">
              <Navbar />
              <PWAStatus />
              <PWADetection />
              <main>
                {children}
              </main>
              <PWAInstallPrompt />
            </div>
          </ClientLayout>
        </NotificationProvider>
      </body>
    </html>
  )
}

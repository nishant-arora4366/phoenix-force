import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import ClientLayout from '@/src/components/ClientLayout'
import Navbar from '@/src/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://phoenixforce.in'),
  title: 'Phoenix Force Cricket',
  description: 'The ultimate platform for cricket tournament management with advanced auction systems, player ratings, and real-time bidding.',
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
      <body className={`${inter.className} bg-[#19171b]`}>
        <ClientLayout>
          <div className="min-h-screen bg-[#19171b]">
            <Navbar />
            <main>
              {children}
            </main>
          </div>
        </ClientLayout>
      </body>
    </html>
  )
}

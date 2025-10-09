import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import Navbar from '@/src/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Phoenix Force Cricket',
  description: 'The ultimate platform for cricket tournament management with advanced auction systems, player ratings, and real-time bidding.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#19171b]`}>
        <div className="min-h-screen bg-[#19171b]">
          <Navbar />
          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

import { Metadata } from 'next'
import { getSupabaseClient } from '@/src/lib/supabaseClient'

interface Tournament {
  id: string
  name: string
  slug: string
  format: string
  description?: string
  tournament_date: string
  venue?: string
  status: string
  total_slots: number
  selected_teams: number
  schedule_image_url?: string
}

async function getTournament(id: string): Promise<Tournament | null> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name, slug, format, description, tournament_date, venue, status, total_slots, selected_teams, schedule_image_url')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching tournament for meta tags:', error)
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const tournament = await getTournament(id)

  if (!tournament) {
    return {
      title: 'Tournament Not Found - Phoenix Force Cricket',
      description: 'The requested tournament could not be found.',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://phoenixforce.in'
  const tournamentUrl = `${baseUrl}/t/${tournament.slug}`
  
  // Always use the generated OG image with Phoenix Force logo and home page background
  const imageUrl = `${baseUrl}/api/og/tournament/${tournament.id}`

  const title = `${tournament.name} - Phoenix Force Cricket`
  const description = tournament.description 
    ? `${tournament.description.substring(0, 150)}${tournament.description.length > 150 ? '...' : ''}`
    : `Join ${tournament.name} - A ${tournament.format} cricket tournament on ${new Date(tournament.tournament_date).toLocaleDateString()}. ${tournament.total_slots} slots available.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: tournamentUrl,
      siteName: 'Phoenix Force Cricket',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${tournament.name} - Tournament Preview`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@phoenixforce',
      site: '@phoenixforce',
    },
    alternates: {
      canonical: tournamentUrl,
    },
    other: {
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:type': 'image/png',
    },
  }
}

export default function TournamentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

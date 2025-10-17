import { redirect } from 'next/navigation'
import { getSupabaseClient } from '@/src/lib/supabaseClient'

interface Tournament {
  id: string
  name: string
  slug: string
}

async function getTournamentBySlug(slug: string): Promise<Tournament | null> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name, slug')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching tournament by slug:', error)
    return null
  }
}

export default async function ShortTournamentPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)

  if (!tournament) {
    // Redirect to tournaments page if tournament not found
    redirect('/tournaments')
  }

  // Redirect to the full tournament page
  redirect(`/tournaments/${tournament.id}`)
}

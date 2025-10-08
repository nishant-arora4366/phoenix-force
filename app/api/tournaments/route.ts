import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Fetch all tournaments using service role (bypasses RLS)
    const { data: tournaments, error } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, tournaments: tournaments || [] })
  } catch (error: any) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, format, selected_teams, tournament_date, description, total_slots, host_id, status, venue, google_maps_link } = body

    // Validate required fields
    if (!name || !format || !selected_teams || !tournament_date || !total_slots || !host_id) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Create tournament using service role (bypasses RLS)
    const { data: tournament, error: tournamentError } = await supabaseAdmin
      .from('tournaments')
      .insert({
        name,
        format,
        selected_teams,
        tournament_date,
        description,
        total_slots,
        host_id,
        status: status || 'draft',
        venue,
        google_maps_link
      })
      .select()
      .single()

    if (tournamentError) {
      return NextResponse.json({ success: false, error: tournamentError.message }, { status: 500 })
    }

    // No need to pre-create slots - they will be created dynamically as players register
    console.log('Tournament created successfully. Slots will be created dynamically as players register.')

    return NextResponse.json({ success: true, tournament })
  } catch (error: any) {
    console.error('Error creating tournament:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

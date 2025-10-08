import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch tournament using service role (bypasses RLS)
    const { data: tournament, error } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!tournament) {
      return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, tournament })
  } catch (error: any) {
    console.error('Error fetching tournament:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, format, selected_teams, tournament_date, description, total_slots, status, venue, google_maps_link } = body

    // Handle status-only updates
    if (status && !name && !format && !selected_teams && !tournament_date && !description && !total_slots && !venue && !google_maps_link) {
      const { data: tournament, error } = await supabaseAdmin
        .from('tournaments')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, tournament })
    }

    // Handle full tournament updates
    if (!name || !format || !selected_teams || !tournament_date || !total_slots) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Update tournament using service role (bypasses RLS)
    const { data: tournament, error } = await supabaseAdmin
      .from('tournaments')
      .update({
        name,
        format,
        selected_teams,
        tournament_date,
        description,
        total_slots,
        venue,
        google_maps_link,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, tournament })
  } catch (error: any) {
    console.error('Error updating tournament:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete tournament using service role (bypasses RLS)
    const { error } = await supabaseAdmin
      .from('tournaments')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting tournament:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
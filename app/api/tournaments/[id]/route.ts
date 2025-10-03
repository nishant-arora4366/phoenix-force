import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const body = await request.json()
    const { name, total_slots, min_bid_amount, min_increment } = body

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the host of this tournament or an admin
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('host_id')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is the host or admin
    if (tournament.host_id !== user.id && userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Only tournament host or admin can edit' }, { status: 403 })
    }

    // Update the tournament
    const { data: updatedTournament, error: updateError } = await supabase
      .from('tournaments')
      .update({
        name,
        total_slots,
        min_bid_amount: min_bid_amount || null,
        min_increment: min_increment || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', tournamentId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating tournament:', updateError)
      return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updatedTournament })

  } catch (error) {
    console.error('Error in PUT /api/tournaments/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the host of this tournament or an admin
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('host_id')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is the host or admin
    if (tournament.host_id !== user.id && userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Only tournament host or admin can delete' }, { status: 403 })
    }

    // Delete the tournament (this will cascade delete related records due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId)

    if (deleteError) {
      console.error('Error deleting tournament:', deleteError)
      return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Tournament deleted successfully' })

  } catch (error) {
    console.error('Error in DELETE /api/tournaments/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

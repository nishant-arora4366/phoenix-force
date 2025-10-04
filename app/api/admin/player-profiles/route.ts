import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (userError || !user || user.role !== 'admin' || user.status !== 'approved') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch all player profiles with user information
    const { data: profiles, error } = await supabase
      .from('players')
      .select(`
        *,
        users:user_id (
          firstname,
          lastname,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching player profiles:', error)
      return NextResponse.json({ error: 'Error fetching player profiles' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profiles: profiles || []
    })

  } catch (error: any) {
    console.error('Error in player profiles API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, playerId, status } = body

    if (!userId || !playerId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (userError || !user || user.role !== 'admin' || user.status !== 'approved') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update player profile status
    const { data: profile, error: updateError } = await supabase
      .from('players')
      .update({ status })
      .eq('id', playerId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating player profile:', updateError)
      return NextResponse.json({ error: 'Error updating player profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile
    })

  } catch (error: any) {
    console.error('Error in player profile update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

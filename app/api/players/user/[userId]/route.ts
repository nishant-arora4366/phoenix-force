import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Fetch player profile by user_id
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching player profile:', error)
      return NextResponse.json({ error: 'Error fetching player profile' }, { status: 500 })
    }

    if (!player) {
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: 'No player profile found'
      })
    }

    return NextResponse.json({
      success: true,
      data: player
    })

  } catch (error: any) {
    console.error('Error in player profile API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

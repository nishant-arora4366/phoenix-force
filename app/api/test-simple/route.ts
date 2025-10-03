import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Service role key not configured',
        message: 'Add SUPABASE_SERVICE_ROLE_KEY to your .env.local'
      }, { status: 400 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Try to query the existing simple players table
    const { data, error } = await supabaseAdmin
      .from('players')
      .select('*')
      .limit(5)

    if (error) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message, 
          details: error,
          message: 'Supabase query failed - this might be the old table structure'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Simple players table query successful',
      note: 'This is the old simple table structure. Apply the new schema to get the full Phoenix Force schema.'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to connect to Supabase', 
        details: error instanceof Error ? error.message : 'Unknown error',
        message: 'Check your Supabase configuration'
      },
      { status: 500 }
    )
  }
}

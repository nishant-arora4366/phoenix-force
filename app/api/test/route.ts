import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  try {
    // Check if environment variables are properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url' || supabaseUrl.includes('placeholder')) {
      return NextResponse.json({
        success: false,
        error: 'Supabase URL not configured',
        message: 'Please update NEXT_PUBLIC_SUPABASE_URL in your .env.local file',
        details: 'Environment variable is missing or contains placeholder value'
      }, { status: 400 })
    }
    
    if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key' || supabaseAnonKey.includes('placeholder')) {
      return NextResponse.json({
        success: false,
        error: 'Supabase Anon Key not configured',
        message: 'Please update NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file',
        details: 'Environment variable is missing or contains placeholder value'
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('players')
      .select('id')
      .limit(1)

    if (error) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message, 
          details: error,
          message: 'Supabase query failed'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Supabase connection successful' 
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

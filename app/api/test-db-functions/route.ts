import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('Testing database functions...')
    
    // Test if manual_promote_waitlist function exists
    const { data: testResult, error: testError } = await supabase
      .rpc('manual_promote_waitlist', { p_tournament_id: '00000000-0000-0000-0000-000000000000' })
    
    console.log('Test result:', testResult)
    console.log('Test error:', testError)
    
    if (testError) {
      return NextResponse.json({ 
        success: false, 
        error: testError.message,
        details: testError
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database functions are working',
      result: testResult
    })
    
  } catch (error: any) {
    console.error('Error testing database functions:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: error
    })
  }
}

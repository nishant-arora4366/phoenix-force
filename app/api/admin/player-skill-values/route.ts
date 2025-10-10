import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function POSTHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    const body = await request.json()
    const { userId, skillId, valueName, displayOrder, value } = body

    // Support both old format (value object) and new format (direct fields)
    const finalValueName = valueName || value?.valueName
    const finalDisplayOrder = displayOrder || value?.displayOrder || 0

    if (!userId || !skillId || !finalValueName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (userError || !user || user.role !== 'admin' || user.status !== 'approved') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Create new skill value
    const { data: newValue, error: valueError } = await supabase
      .from('player_skill_values')
      .insert({
        skill_id: skillId,
        value_name: finalValueName,
        display_order: finalDisplayOrder,
        is_active: true
      })
      .select()
      .single()

    if (valueError) {
      console.error('Error creating skill value:', valueError)
      return NextResponse.json({ error: 'Error creating skill value' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      value: newValue
    })

  } catch (error: any) {
    console.error('Error in admin player skill values POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function PUTHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    const body = await request.json()
    const { userId, valueId, valueName, displayOrder, value } = body

    // Support both old format (value object) and new format (direct fields)
    const finalValueName = valueName || value?.valueName
    const finalDisplayOrder = displayOrder || value?.displayOrder || 0

    if (!userId || !valueId || !finalValueName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (userError || !user || user.role !== 'admin' || user.status !== 'approved') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update skill value
    const { data: updatedValue, error: valueError } = await supabase
      .from('player_skill_values')
      .update({
        value_name: finalValueName,
        display_order: finalDisplayOrder
      })
      .eq('id', valueId)
      .select()
      .single()

    if (valueError) {
      console.error('Error updating skill value:', valueError)
      return NextResponse.json({ error: 'Error updating skill value' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      value: updatedValue
    })

  } catch (error: any) {
    console.error('Error in admin player skill values PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function DELETEHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    const body = await request.json()
    const { userId, valueId } = body

    if (!userId || !valueId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (userError || !user || user.role !== 'admin' || user.status !== 'approved') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete skill value
    const { error: deleteError } = await supabase
      .from('player_skill_values')
      .delete()
      .eq('id', valueId)

    if (deleteError) {
      console.error('Error deleting skill value:', deleteError)
      return NextResponse.json({ error: 'Error deleting skill value' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Skill value deleted successfully'
    })

  } catch (error: any) {
    console.error('Error in admin player skill values DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Export handlers with analytics

export const POST = withAnalytics(withAuth(POSTHandler, ['admin']))

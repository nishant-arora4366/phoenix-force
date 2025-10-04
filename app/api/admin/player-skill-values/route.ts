import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, skillId, value } = body

    if (!userId || !skillId || !value) {
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

    // Create new skill value
    const { data: newValue, error: valueError } = await supabase
      .from('player_skill_values')
      .insert({
        skill_id: skillId,
        value_name: value.name,
        display_order: value.displayOrder || 0,
        is_active: value.isActive !== false
      })
      .select()
      .single()

    if (valueError) {
      console.error('Error creating player skill value:', valueError)
      return NextResponse.json({ error: 'Error creating player skill value' }, { status: 500 })
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, valueId, value } = body

    if (!userId || !valueId || !value) {
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

    // Update skill value
    const { data: updatedValue, error: valueError } = await supabase
      .from('player_skill_values')
      .update({
        value_name: value.name,
        display_order: value.displayOrder,
        is_active: value.isActive
      })
      .eq('id', valueId)
      .select()
      .single()

    if (valueError) {
      console.error('Error updating player skill value:', valueError)
      return NextResponse.json({ error: 'Error updating player skill value' }, { status: 500 })
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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, valueId } = body

    if (!userId || !valueId) {
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

    // Delete skill value
    const { error: deleteError } = await supabase
      .from('player_skill_values')
      .delete()
      .eq('id', valueId)

    if (deleteError) {
      console.error('Error deleting player skill value:', deleteError)
      return NextResponse.json({ error: 'Error deleting player skill value' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Player skill value deleted successfully'
    })

  } catch (error: any) {
    console.error('Error in admin player skill values DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

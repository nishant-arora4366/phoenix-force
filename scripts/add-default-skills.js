// Script to add default player skills for testing
// This should be run after the database migration is applied

const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables or replace with actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const defaultSkills = [
  {
    skill_name: 'Role',
    skill_type: 'multiselect',
    is_required: true,
    display_order: 1,
    is_admin_managed: false,
    viewer_can_see: true
  },
  {
    skill_name: 'Batting Style',
    skill_type: 'select',
    is_required: false,
    display_order: 2,
    is_admin_managed: false,
    viewer_can_see: true
  },
  {
    skill_name: 'Bowling Style',
    skill_type: 'select',
    is_required: false,
    display_order: 3,
    is_admin_managed: false,
    viewer_can_see: true
  },
  {
    skill_name: 'Base Price',
    skill_type: 'number',
    is_required: false,
    display_order: 4,
    is_admin_managed: true,
    viewer_can_see: false
  },
  {
    skill_name: 'Experience Level',
    skill_type: 'select',
    is_required: false,
    display_order: 5,
    is_admin_managed: false,
    viewer_can_see: true
  }
]

async function addDefaultSkills() {
  try {
    console.log('Adding default player skills...')
    
    for (const skill of defaultSkills) {
      const { data, error } = await supabase
        .from('player_skills')
        .insert(skill)
        .select()
      
      if (error) {
        console.error(`Error adding skill ${skill.skill_name}:`, error)
      } else {
        console.log(`Added skill: ${skill.skill_name}`)
      }
    }
    
    console.log('Default skills added successfully!')
  } catch (error) {
    console.error('Error adding default skills:', error)
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  addDefaultSkills()
}

module.exports = { addDefaultSkills }

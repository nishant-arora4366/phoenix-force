#!/usr/bin/env node

/**
 * Simple script to update sessionManager to secureSessionManager
 */

const fs = require('fs')
const path = require('path')

// List of files that need to be updated
const filesToUpdate = [
  'app/players/page.tsx',
  'app/tournaments/[id]/page.tsx',
  'app/signup/page.tsx',
  'app/admin/users/page.tsx',
  'app/player-profile/page.tsx',
  'app/players/[id]/page.tsx',
  'app/profile/page.tsx',
  'app/players/[id]/edit/page.tsx',
  'app/players/create/page.tsx',
  'app/tournaments/[id]/edit/page.tsx',
  'app/page.tsx',
  'app/tournaments/create/page.tsx'
]

function updateSessionManager(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`)
      return false
    }

    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    // Update import statement
    if (content.includes("import { sessionManager } from '@/src/lib/session'")) {
      content = content.replace(
        "import { sessionManager } from '@/src/lib/session'",
        "import { secureSessionManager } from '@/src/lib/secure-session'"
      )
      modified = true
    }
    
    // Update all sessionManager references to secureSessionManager
    if (content.includes('sessionManager.')) {
      content = content.replace(/sessionManager\./g, 'secureSessionManager.')
      modified = true
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content)
      console.log(`✅ Updated: ${filePath}`)
      return true
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`)
      return true
    }

  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message)
    return false
  }
}

function main() {
  console.log('🚀 Updating session manager across all files...\n')
  
  let successCount = 0
  let totalCount = filesToUpdate.length

  filesToUpdate.forEach(file => {
    const fullPath = path.join(process.cwd(), file)
    if (updateSessionManager(fullPath)) {
      successCount++
    }
  })

  console.log(`\n📊 Summary:`)
  console.log(`✅ Successfully updated: ${successCount}/${totalCount} files`)
  console.log(`❌ Failed to update: ${totalCount - successCount}/${totalCount} files`)
  
  if (successCount === totalCount) {
    console.log('\n🎉 All files updated successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Manually add JWT tokens to fetch calls where needed')
    console.log('2. Test the application to ensure all authentication works')
    console.log('3. Check for any remaining sessionManager references')
  } else {
    console.log('\n⚠️  Some files failed to update. Please check the errors above.')
  }
}

if (require.main === module) {
  main()
}

module.exports = { updateSessionManager, filesToUpdate }

#!/usr/bin/env node

/**
 * Script to add withAnalytics middleware to API routes
 * This script helps automate the process of adding analytics tracking to existing API routes
 */

const fs = require('fs')
const path = require('path')

// List of API routes to update with analytics
const routesToUpdate = [
  'app/api/players/route.ts',
  'app/api/players/[id]/route.ts',
  'app/api/tournaments/route.ts',
  'app/api/tournaments/[id]/route.ts',
  'app/api/user-profile/route.ts',
  'app/api/auth/register/route.ts',
  'app/api/auth/change-password/route.ts',
  'app/api/player-profile/route.ts',
  'app/api/player-skills/route.ts',
  'app/api/player-skills/list/route.ts',
  'app/api/register-player/route.ts',
  'app/api/stats/route.ts',
  'app/api/sync-user/route.ts',
  'app/api/tournament-status/route.ts',
  'app/api/update-user-role/route.ts',
  'app/api/user-status/route.ts',
  'app/api/users/route.ts',
  'app/api/check-role/route.ts',
  'app/api/players-public/route.ts',
  'app/api/players/search/route.ts',
  'app/api/players/user/[userId]/route.ts'
]

function addAnalyticsToRoute(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`)
      return false
    }

    let content = fs.readFileSync(filePath, 'utf8')
    
    // Check if analytics is already imported
    if (content.includes('withAnalytics')) {
      console.log(`✅ Analytics already added to: ${filePath}`)
      return true
    }

    // Add import for withAnalytics
    if (content.includes("import { NextRequest, NextResponse } from 'next/server'")) {
      content = content.replace(
        "import { NextRequest, NextResponse } from 'next/server'",
        "import { NextRequest, NextResponse } from 'next/server'\nimport { withAnalytics } from '@/src/lib/api-analytics'"
      )
    }

    // Wrap export statements with withAnalytics
    // Handle different export patterns
    const exportPatterns = [
      // Pattern 1: export async function GET/POST/PUT/DELETE
      /export async function (GET|POST|PUT|DELETE)\(/g,
      // Pattern 2: export const GET/POST/PUT/DELETE = 
      /export const (GET|POST|PUT|DELETE) = /g,
      // Pattern 3: export { GET, POST, PUT, DELETE }
      /export \{ ([^}]+) \}/g
    ]

    let modified = false

    // Pattern 1: Convert export async function to withAnalytics wrapper
    content = content.replace(/export async function (GET|POST|PUT|DELETE)\(/g, (match, method) => {
      modified = true
      return `async function ${method.toLowerCase()}Handler(`
    })

    // Pattern 2: Convert export const to withAnalytics wrapper
    content = content.replace(/export const (GET|POST|PUT|DELETE) = /g, (match, method) => {
      modified = true
      return `const ${method.toLowerCase()}Handler = `
    })

    // Add export statements at the end
    if (modified) {
      // Find all handler functions and create exports
      const handlers = []
      if (content.includes('async function gethandler(') || content.includes('const gethandler =')) {
        handlers.push('GET')
      }
      if (content.includes('async function posthandler(') || content.includes('const posthandler =')) {
        handlers.push('POST')
      }
      if (content.includes('async function puthandler(') || content.includes('const puthandler =')) {
        handlers.push('PUT')
      }
      if (content.includes('async function deletehandler(') || content.includes('const deletehandler =')) {
        handlers.push('DELETE')
      }

      // Add export statements
      const exportStatements = handlers.map(method => 
        `export const ${method} = withAnalytics(${method.toLowerCase()}Handler)`
      ).join('\n')

      // Remove any existing export statements at the end
      content = content.replace(/\nexport.*$/gm, '')
      
      // Add new export statements
      content += '\n\n' + exportStatements
    }

    // Write the modified content back
    fs.writeFileSync(filePath, content)
    console.log(`✅ Added analytics to: ${filePath}`)
    return true

  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message)
    return false
  }
}

function main() {
  console.log('🚀 Adding analytics middleware to API routes...\n')
  
  let successCount = 0
  let totalCount = routesToUpdate.length

  routesToUpdate.forEach(route => {
    const fullPath = path.join(process.cwd(), route)
    if (addAnalyticsToRoute(fullPath)) {
      successCount++
    }
  })

  console.log(`\n📊 Summary:`)
  console.log(`✅ Successfully updated: ${successCount}/${totalCount} routes`)
  console.log(`❌ Failed to update: ${totalCount - successCount}/${totalCount} routes`)
  
  if (successCount === totalCount) {
    console.log('\n🎉 All routes updated successfully!')
  } else {
    console.log('\n⚠️  Some routes failed to update. Please check the errors above.')
  }
}

if (require.main === module) {
  main()
}

module.exports = { addAnalyticsToRoute, routesToUpdate }

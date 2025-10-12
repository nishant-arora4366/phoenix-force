#!/usr/bin/env node

/**
 * Script to generate a secure JWT secret
 * Usage: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto')

function generateJWTSecret() {
  // Generate a 64-byte (512-bit) random string and encode it as base64
  const secret = crypto.randomBytes(64).toString('base64')
  
  console.log('🔐 Generated JWT Secret:')
  console.log('=' .repeat(50))
  console.log(secret)
  console.log('=' .repeat(50))
  console.log('')
  console.log('📝 Add this to your .env file:')
  console.log(`JWT_SECRET=${secret}`)
  console.log('')
  console.log('⚠️  Keep this secret secure and never commit it to version control!')
}

if (require.main === module) {
  generateJWTSecret()
}

module.exports = { generateJWTSecret }

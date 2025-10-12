/**
 * Environment variable validation utility
 * Ensures all required environment variables are present and valid
 */

interface EnvConfig {
  JWT_SECRET: string
  JWT_EXPIRES_IN?: string
  NEXT_PUBLIC_SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

/**
 * Validates that all required environment variables are present
 * @throws Error if any required variables are missing
 */
export function validateEnvironmentVariables(): EnvConfig {
  const requiredVars = ['JWT_SECRET'] as const
  const missingVars: string[] = []

  // Check required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.\n' +
      'See .env.example for reference.'
    )
  }

  // Validate JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET!
  if (jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long for security.\n' +
      'Generate a strong secret using: openssl rand -base64 32'
    )
  }

  // Check for common weak secrets
  const weakSecrets = [
    'your-super-secret-jwt-key-change-this-in-production',
    'secret',
    'jwt-secret',
    'my-secret-key',
    'change-this',
    'default-secret'
  ]

  if (weakSecrets.includes(jwtSecret)) {
    throw new Error(
      'JWT_SECRET appears to be a default/weak value. Please use a strong, unique secret.\n' +
      'Generate a strong secret using: openssl rand -base64 32'
    )
  }

  return {
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  }
}

/**
 * Get validated environment configuration
 * This should be called once at application startup
 */
export const env = validateEnvironmentVariables()

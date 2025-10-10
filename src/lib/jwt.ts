import jwt from 'jsonwebtoken'

// JWT Secret - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export interface DecodedToken extends JWTPayload {
  iat: number
  exp: number
}

/**
 * Generate a JWT token for a user
 * @param user - User data to encode in the token
 * @returns JWT token string
 */
export function generateToken(user: { id: string; email: string; role: string }): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'phoenix-force',
    audience: 'phoenix-force-users'
  } as jwt.SignOptions)
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'phoenix-force',
      audience: 'phoenix-force-users'
    } as jwt.VerifyOptions) as DecodedToken

    return decoded
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  
  // Handle "Bearer <token>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Handle direct token
  return authHeader
}

/**
 * Check if a token is expired
 * @param token - JWT token
 * @returns true if expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as DecodedToken
    if (!decoded || !decoded.exp) return true
    
    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch (error) {
    return true
  }
}

/**
 * Get token expiration time
 * @param token - JWT token
 * @returns Expiration timestamp or null
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const decoded = jwt.decode(token) as DecodedToken
    return decoded?.exp || null
  } catch (error) {
    return null
  }
}

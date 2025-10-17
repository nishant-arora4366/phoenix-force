/**
 * Utility functions for URL generation and management
 */

/**
 * Generate a short URL for a tournament
 */
export function generateTournamentShortUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://phoenixforce.in'
  return `${baseUrl}/t/${slug}`
}

/**
 * Generate a full tournament URL (for internal use)
 */
export function generateTournamentUrl(id: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://phoenixforce.in'
  return `${baseUrl}/tournaments/${id}`
}

/**
 * Generate Open Graph image URL for a tournament
 */
export function generateTournamentOgImageUrl(id: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://phoenixforce.in'
  return `${baseUrl}/api/og/tournament/${id}`
}

/**
 * Copy text to clipboard (client-side only)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Share tournament URL using Web Share API (if available)
 */
export async function shareTournamentUrl(url: string, title: string, text?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.share) {
    return false
  }

  try {
    await navigator.share({
      title,
      text: text || `Check out this cricket tournament: ${title}`,
      url,
    })
    return true
  } catch (error) {
    console.error('Failed to share:', error)
    return false
  }
}

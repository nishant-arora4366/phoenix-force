/**
 * Common utility functions used throughout the application
 */

import { USER_ROLES, STATUS } from './constants'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// =================== Role & Status Utilities ===================

/**
 * Get emoji representation for player roles
 */
export function getRoleEmoji(role: string | string[] | undefined): string {
  if (!role) return '👤'
  
  const mapRoleToEmoji = (r: string): string => {
    const roleLower = r.toLowerCase()
    if (roleLower.includes('batter') || roleLower.includes('batsman')) return '🏏'
    if (roleLower.includes('bowler')) return '🎾'
    if (roleLower.includes('wicket') || roleLower.includes('keeper') || roleLower.includes('wk')) return '🧤'
    if (roleLower.includes('all') && roleLower.includes('rounder')) return '🌟'
    return '👤'
  }
  
  if (Array.isArray(role)) {
    return role.map(mapRoleToEmoji).join('')
  }
  
  return mapRoleToEmoji(role)
}

/**
 * Get color classes for status
 */
export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-[#CEA17A]/25 text-[#CEA17A] border border-[#CEA17A]/40'
    case 'approved':
    case 'active':
      return 'bg-[#3E4E5A]/25 text-[#CEA17A] border border-[#CEA17A]/40'
    case 'rejected':
      return 'bg-[#75020f]/25 text-[#75020f] border border-[#75020f]/40'
    case 'completed':
      return 'bg-green-500/25 text-green-500 border border-green-500/40'
    case 'live':
      return 'bg-green-500/25 text-green-500 border border-green-500/40 animate-pulse'
    case 'draft':
      return 'bg-gray-500/25 text-gray-400 border border-gray-500/40'
    default:
      return 'bg-[#3E4E5A]/25 text-[#DBD0C0] border border-[#CEA17A]/40'
  }
}

/**
 * Get color classes for user role
 */
export function getRoleColor(role: string): string {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'bg-purple-500/25 text-purple-400 border border-purple-500/40'
    case 'host':
      return 'bg-blue-500/25 text-blue-400 border border-blue-500/40'
    case 'captain':
      return 'bg-[#CEA17A]/25 text-[#CEA17A] border border-[#CEA17A]/40'
    case 'viewer':
      return 'bg-[#3E4E5A]/25 text-[#DBD0C0] border border-[#CEA17A]/40'
    default:
      return 'bg-[#3E4E5A]/25 text-[#DBD0C0] border border-[#CEA17A]/40'
  }
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    admin: 'Admin',
    host: 'Host',
    captain: 'Captain',
    viewer: 'Viewer'
  }
  return roleMap[role?.toLowerCase()] || role
}

// =================== Formatting Utilities ===================

/**
 * Format currency (Indian Rupees)
 */
export function formatCurrency(amount: number | string | undefined, short: boolean = false): string {
  if (!amount) return '₹0'
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (short && num >= 10000000) {
    return `₹${(num / 10000000).toFixed(1)}Cr`
  } else if (short && num >= 100000) {
    return `₹${(num / 100000).toFixed(1)}L`
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)
}

/**
 * Format date to display format
 */
export function formatDate(date: string | Date | undefined, includeTime: boolean = false): string {
  if (!date) return 'N/A'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (includeTime) {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d)
  }
  
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(d)
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 7) {
    return formatDate(date)
  } else if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

// =================== String Utilities ===================

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string | undefined, length: number = 50): string {
  if (!str) return ''
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

/**
 * Get initials from name
 */
export function getInitials(name: string | undefined): string {
  if (!name) return '?'
  
  const parts = name.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Generate avatar URL or fallback initials
 */
export function getAvatarContent(
  profileUrl: string | undefined,
  name: string | undefined
): { type: 'image' | 'text', content: string } {
  if (profileUrl) {
    return { type: 'image', content: profileUrl }
  }
  return { type: 'text', content: getInitials(name) }
}

// =================== Validation Utilities ===================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone)
}

// =================== Array Utilities ===================

/**
 * Group items by a key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const group = String(item[key])
    if (!result[group]) result[group] = []
    result[group].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * Sort array by multiple fields
 */
export function sortBy<T>(array: T[], ...keys: (keyof T)[]): T[] {
  return [...array].sort((a, b) => {
    for (const key of keys) {
      if (a[key] < b[key]) return -1
      if (a[key] > b[key]) return 1
    }
    return 0
  })
}

// =================== Class Name Utilities ===================

/**
 * Merge class names with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// =================== Number Utilities ===================

/**
 * Generate random ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// =================== Auction Utilities ===================

/**
 * Calculate remaining budget for a team
 */
export function calculateRemainingBudget(
  totalBudget: number,
  spentAmount: number,
  remainingSlots: number,
  minBidAmount: number = 1
): number {
  const reservedAmount = remainingSlots * minBidAmount
  return Math.max(0, totalBudget - spentAmount - reservedAmount)
}

/**
 * Check if a bid is valid
 */
export function isValidBid(
  bidAmount: number,
  currentBid: number,
  incrementAmount: number,
  teamBudget: number,
  remainingSlots: number,
  minBidAmount: number = 1
): { valid: boolean; reason?: string } {
  if (bidAmount <= currentBid) {
    return { valid: false, reason: 'Bid must be higher than current bid' }
  }
  
  if (bidAmount < currentBid + incrementAmount) {
    return { valid: false, reason: `Minimum increment is ${formatCurrency(incrementAmount)}` }
  }
  
  const budgetAfterBid = teamBudget - bidAmount
  const requiredForRemainingSlots = (remainingSlots - 1) * minBidAmount
  
  if (budgetAfterBid < requiredForRemainingSlots) {
    return { valid: false, reason: 'Insufficient budget for remaining slots' }
  }
  
  return { valid: true }
}

// =================== Storage Utilities ===================

/**
 * Safe localStorage getter
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * Safe localStorage setter
 */
export function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Fail silently
  }
}

/**
 * Remove from localStorage
 */
export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return
  
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Fail silently
  }
}

// =================== Export All Utilities ===================

export const utils = {
  // Role & Status
  getRoleEmoji,
  getStatusColor,
  getRoleColor,
  getRoleDisplayName,
  
  // Formatting
  formatCurrency,
  formatDate,
  formatRelativeTime,
  
  // Strings
  truncate,
  getInitials,
  getAvatarContent,
  
  // Validation
  isValidEmail,
  isValidPhone,
  
  // Arrays
  groupBy,
  sortBy,
  
  // Class Names
  cn,
  
  // Numbers
  generateId,
  clamp,
  
  // Auction
  calculateRemainingBudget,
  isValidBid,
  
  // Storage
  getFromStorage,
  setToStorage,
  removeFromStorage
}

export default utils

/**
 * Application-wide constants and configuration
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const

// Authentication
export const AUTH_CONFIG = {
  TOKEN_KEY: 'phoenix_token',
  USER_KEY: 'phoenix_user',
  TOKEN_EXPIRY_WARNING: 5, // minutes
  SESSION_CHECK_INTERVAL: 30000, // 30 seconds
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  EMAIL_MAX_LENGTH: 254,
} as const

// Realtime Subscriptions
export const REALTIME_CONFIG = {
  DEBOUNCE_MS: 100,
  NOTIFICATION_DEBOUNCE_MS: 200,
  ANALYTICS_DEBOUNCE_MS: 500,
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
} as const

// Auction Configuration
export const AUCTION_CONFIG = {
  MIN_BID_AMOUNT: 1,
  DEFAULT_INCREMENT: 1,
  MAX_TOKENS_PER_CAPTAIN: 100,
  TIMER_SECONDS: 30,
  CACHE_TTL: 5000, // 5 seconds
  STATIC_CACHE_TTL: 60000, // 1 minute
} as const

// Tournament Configuration
export const TOURNAMENT_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 100,
  DEFAULT_FORMAT: 'single_elimination',
  REGISTRATION_DEADLINE_HOURS: 24,
} as const

// UI Configuration
export const UI_CONFIG = {
  TOAST_DURATION: 3500,
  ANIMATION_DURATION: 300,
  MODAL_TRANSITION: 200,
  PAGE_SIZE: 20,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful!',
  REGISTER: 'Registration successful! Please login.',
  LOGOUT: 'Logged out successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  PASSWORD_CHANGED: 'Password changed successfully.',
  BID_PLACED: 'Bid placed successfully!',
  AUCTION_STARTED: 'Auction started successfully.',
  AUCTION_COMPLETED: 'Auction completed successfully.',
} as const

// Database Tables
export const DB_TABLES = {
  USERS: 'users',
  PLAYERS: 'players',
  TOURNAMENTS: 'tournaments',
  TOURNAMENT_SLOTS: 'tournament_slots',
  AUCTIONS: 'auctions',
  AUCTION_TEAMS: 'auction_teams',
  AUCTION_PLAYERS: 'auction_players',
  AUCTION_BIDS: 'auction_bids',
  NOTIFICATIONS: 'notifications',
  API_USAGE_ANALYTICS: 'api_usage_analytics',
  API_ACCESS_CONTROL: 'api_access_control',
} as const

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  HOST: 'host',
  VIEWER: 'viewer',
  CAPTAIN: 'captain',
} as const

// Status Values
export const STATUS = {
  AUCTION: {
    DRAFT: 'draft',
    LIVE: 'live',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },
  TOURNAMENT: {
    DRAFT: 'draft',
    REGISTRATION: 'registration',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },
  PLAYER: {
    AVAILABLE: 'available',
    SOLD: 'sold',
    UNSOLD: 'unsold',
    SKIPPED: 'skipped',
    REPLACED: 'replaced',
  },
  REPLACEMENT: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },
  USER: {
    PENDING: 'pending',
    ACTIVE: 'active',
    REJECTED: 'rejected',
    SUSPENDED: 'suspended',
  },
} as const

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh-token',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },
  USER: {
    PROFILE: '/api/user-profile',
    CHECK_ROLE: '/api/check-role',
  },
  AUCTION: {
    LIST: '/api/auctions',
    DETAIL: (id: string) => `/api/auctions/${id}`,
    BIDS: (id: string) => `/api/auctions/${id}/bids`,
    CURRENT_PLAYER: (id: string) => `/api/auctions/${id}/current-player`,
    UNDO_PLAYER: (id: string) => `/api/auctions/${id}/undo-player-assignment`,
    REPLACEMENTS: (id: string) => `/api/auctions/${id}/replacements`,
  },
  TOURNAMENT: {
    LIST: '/api/tournaments',
    DETAIL: (id: string) => `/api/tournaments/${id}`,
    REGISTER: (id: string) => `/api/tournaments/${id}/register`,
    SLOTS: (id: string) => `/api/tournaments/${id}/slots`,
  },
  ADMIN: {
    USERS: '/api/admin/users',
    ANALYTICS: '/api/admin/analytics',
    ACCESS_CONTROL: '/api/admin/access-control',
  },
} as const

// Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME: /^[a-zA-Z0-9\s\-']+$/,
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
} as const

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_TIME: 'MMM DD, YYYY h:mm A',
  INPUT: 'YYYY-MM-DD',
  API: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
} as const

// Export all constants as a single object for convenience
export const CONSTANTS = {
  API_CONFIG,
  AUTH_CONFIG,
  REALTIME_CONFIG,
  AUCTION_CONFIG,
  TOURNAMENT_CONFIG,
  UI_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DB_TABLES,
  USER_ROLES,
  STATUS,
  API_ENDPOINTS,
  VALIDATION_PATTERNS,
  DATE_FORMATS,
} as const

export default CONSTANTS

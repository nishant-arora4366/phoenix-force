/**
 * API Access Control Configuration with Better Grouping
 */

export interface APIAccessConfig {
  route: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description: string
  accessType: 'public' | 'authenticated' | 'role-based'
  requiredRoles?: string[]
  notes?: string
  status: 'active' | 'deprecated' | 'planned'
}

export interface APIGroup {
  name: string
  description: string
  apis: APIAccessConfig[]
  icon?: string
  color?: string
}

export const API_ACCESS_GROUPS: APIGroup[] = [
  // Authentication & Authorization
  {
    name: 'Authentication',
    description: 'User authentication and session management',
    icon: '🔐',
    color: '#4CAF50',
    apis: [
      {
        route: '/api/auth/login',
        method: 'POST',
        description: 'User login with email and password',
        accessType: 'public',
        status: 'active',
        notes: 'Returns JWT token on successful authentication'
      },
      {
        route: '/api/auth/register',
        method: 'POST',
        description: 'User registration',
        accessType: 'public',
        status: 'active',
        notes: 'Creates new user account with pending status'
      },
      {
        route: '/api/auth/logout',
        method: 'POST',
        description: 'User logout',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Clears user session'
      },
      {
        route: '/api/auth/refresh-token',
        method: 'POST',
        description: 'Refresh JWT token',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Extends user session'
      },
      {
        route: '/api/auth/change-password',
        method: 'POST',
        description: 'Change user password',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Requires current password for verification'
      }
    ]
  },

  // User Management
  {
    name: 'User Management',
    description: 'User profiles and account management',
    icon: '👤',
    color: '#2196F3',
    apis: [
      {
        route: '/api/user-profile',
        method: 'GET',
        description: 'Get user profile',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Returns current user profile'
      },
      {
        route: '/api/user-profile',
        method: 'PATCH',
        description: 'Update user profile',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Users can only update their own profile'
      },
      {
        route: '/api/check-role',
        method: 'GET',
        description: 'Check user role',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Returns current user role'
      },
      {
        route: '/api/sync-user',
        method: 'POST',
        description: 'Sync user data',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Syncs user data across services'
      }
    ]
  },

  // Player Management
  {
    name: 'Player Management',
    description: 'Player profiles and data management',
    icon: '🏃',
    color: '#FF9800',
    apis: [
      {
        route: '/api/players',
        method: 'GET',
        description: 'Get all players',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Full player information for authenticated users'
      },
      {
        route: '/api/players/[id]',
        method: 'GET',
        description: 'Get specific player',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Detailed player information'
      },
      {
        route: '/api/players',
        method: 'POST',
        description: 'Create player',
        accessType: 'role-based',
        requiredRoles: ['admin', 'host'],
        status: 'active',
        notes: 'Create new player profile'
      },
      {
        route: '/api/players/[id]',
        method: 'PUT',
        description: 'Update player',
        accessType: 'role-based',
        requiredRoles: ['admin', 'host'],
        status: 'active',
        notes: 'Update player information'
      },
      {
        route: '/api/players/[id]',
        method: 'DELETE',
        description: 'Delete player',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'Permanently delete player'
      },
      {
        route: '/api/player-profile',
        method: 'GET',
        description: 'Get own player profile',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Returns current user player profile'
      },
      {
        route: '/api/player-profile',
        method: 'POST',
        description: 'Create player profile',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Users can create their own player profile'
      },
      {
        route: '/api/player-profile',
        method: 'PUT',
        description: 'Update player profile',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Users can only update their own player profile'
      },
      {
        route: '/api/players/search',
        method: 'GET',
        description: 'Search players',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Search functionality for players'
      }
    ]
  },

  // Tournament Management
  {
    name: 'Tournament Management',
    description: 'Tournament creation and management',
    icon: '🏆',
    color: '#9C27B0',
    apis: [
      {
        route: '/api/tournaments',
        method: 'GET',
        description: 'Get all tournaments',
        accessType: 'public',
        status: 'active',
        notes: 'Public tournament listing'
      },
      {
        route: '/api/tournaments/[id]',
        method: 'GET',
        description: 'Get tournament details',
        accessType: 'public',
        status: 'active',
        notes: 'Public tournament information'
      },
      {
        route: '/api/tournaments',
        method: 'POST',
        description: 'Create tournament',
        accessType: 'role-based',
        requiredRoles: ['admin', 'host'],
        status: 'active',
        notes: 'Create new tournament'
      },
      {
        route: '/api/tournaments/[id]',
        method: 'PUT',
        description: 'Update tournament',
        accessType: 'role-based',
        requiredRoles: ['admin', 'host'],
        status: 'active',
        notes: 'Update tournament details'
      },
      {
        route: '/api/tournaments/[id]',
        method: 'DELETE',
        description: 'Delete tournament',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'Delete tournament'
      },
      {
        route: '/api/tournaments/[id]/register',
        method: 'POST',
        description: 'Register for tournament',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Players register for tournament'
      },
      {
        route: '/api/tournaments/[id]/slots',
        method: 'GET',
        description: 'Get tournament slots',
        accessType: 'public',
        status: 'active',
        notes: 'View tournament registration slots'
      },
      {
        route: '/api/tournaments/[id]/slots',
        method: 'POST',
        description: 'Create tournament slot',
        accessType: 'role-based',
        requiredRoles: ['admin', 'host'],
        status: 'active',
        notes: 'Add slot to tournament'
      },
      {
        route: '/api/tournaments/[id]/slots',
        method: 'DELETE',
        description: 'Delete tournament slot',
        accessType: 'role-based',
        requiredRoles: ['admin', 'host'],
        status: 'active',
        notes: 'Remove slot from tournament'
      }
    ]
  },

  // Auction Management
  {
    name: 'Auction Management',
    description: 'Live auction system and bidding',
    icon: '🔨',
    color: '#F44336',
    apis: [
      {
        route: '/api/auctions',
        method: 'GET',
        description: 'Get all auctions',
        accessType: 'authenticated',
        status: 'active',
        notes: 'List all auctions'
      },
      {
        route: '/api/auctions/[id]',
        method: 'GET',
        description: 'Get auction details',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Detailed auction information'
      },
      {
        route: '/api/auctions',
        method: 'POST',
        description: 'Create auction',
        accessType: 'role-based',
        requiredRoles: ['admin', 'host'],
        status: 'active',
        notes: 'Create new auction'
      },
      {
        route: '/api/auctions',
        method: 'PATCH',
        description: 'Update auction',
        accessType: 'role-based',
        requiredRoles: ['admin', 'host'],
        status: 'active',
        notes: 'Update auction status (start/complete)'
      },
      {
        route: '/api/auctions/[id]',
        method: 'DELETE',
        description: 'Delete auction',
        accessType: 'role-based',
        requiredRoles: ['admin', 'host'],
        status: 'active',
        notes: 'Delete auction'
      },
      {
        route: '/api/auctions/[id]/bids',
        method: 'GET',
        description: 'Get auction bids',
        accessType: 'authenticated',
        status: 'active',
        notes: 'View bid history'
      },
      {
        route: '/api/auctions/[id]/bids',
        method: 'POST',
        description: 'Place bid',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Place bid in auction'
      },
      {
        route: '/api/auctions/[id]/bids',
        method: 'DELETE',
        description: 'Undo bid',
        accessType: 'role-based',
        requiredRoles: ['admin', 'host'],
        status: 'active',
        notes: 'Undo last bid'
      },
      {
        route: '/api/auctions/[id]/current-player',
        method: 'GET',
        description: 'Get current player',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Get current player being auctioned'
      },
      {
        route: '/api/auctions/[id]/current-player',
        method: 'POST',
        description: 'Set current player',
        accessType: 'role-based',
        requiredRoles: ['admin', 'host'],
        status: 'active',
        notes: 'Navigate to next/previous player'
      },
      {
        route: '/api/finalize-auction',
        method: 'POST',
        description: 'Finalize auction',
        accessType: 'role-based',
        requiredRoles: ['admin', 'host'],
        status: 'active',
        notes: 'Complete auction and finalize teams'
      },
      {
        route: '/api/reset-auction',
        method: 'POST',
        description: 'Reset auction',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'Reset auction to draft state'
      }
    ]
  },

  // Admin Operations
  {
    name: 'Admin Operations',
    description: 'Administrative functions and user management',
    icon: '⚙️',
    color: '#607D8B',
    apis: [
      {
        route: '/api/admin/users',
        method: 'GET',
        description: 'Get all users',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'List all users in system'
      },
      {
        route: '/api/admin/users',
        method: 'PATCH',
        description: 'Update user',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'Update user status or role'
      },
      {
        route: '/api/admin/users',
        method: 'DELETE',
        description: 'Delete user',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'Delete user account'
      },
      {
        route: '/api/admin/player-profiles',
        method: 'GET',
        description: 'Get all player profiles',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'Admin view of all player profiles'
      },
      {
        route: '/api/admin/player-skills',
        method: 'GET',
        description: 'Get player skills configuration',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'View skill categories and values'
      },
      {
        route: '/api/admin/player-skills',
        method: 'POST',
        description: 'Create skill category',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'Add new skill category'
      },
      {
        route: '/api/admin/player-skills',
        method: 'PUT',
        description: 'Update skill category',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'Update skill configuration'
      },
      {
        route: '/api/admin/player-skills',
        method: 'DELETE',
        description: 'Delete skill category',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'Remove skill category'
      },
      {
        route: '/api/admin/player-skill-values',
        method: 'GET',
        description: 'Get skill values',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'Get possible values for skills'
      },
      {
        route: '/api/admin/player-skill-values',
        method: 'POST',
        description: 'Create skill value',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'Add new skill value option'
      },
      {
        route: '/api/admin/player-skill-values',
        method: 'DELETE',
        description: 'Delete skill value',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'Remove skill value option'
      }
    ]
  },

  // Analytics & Monitoring
  {
    name: 'Analytics & Monitoring',
    description: 'Usage statistics and system monitoring',
    icon: '📊',
    color: '#00BCD4',
    apis: [
      {
        route: '/api/analytics/usage',
        method: 'GET',
        description: 'Get API usage statistics',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'API call statistics'
      },
      {
        route: '/api/analytics/users',
        method: 'GET',
        description: 'Get user activity statistics',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'Most active users and usage patterns'
      },
      {
        route: '/api/analytics/patterns',
        method: 'GET',
        description: 'Get usage patterns',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'Hourly and daily usage patterns'
      },
      {
        route: '/api/analytics/recent',
        method: 'GET',
        description: 'Get recent API calls',
        accessType: 'role-based',
        requiredRoles: ['admin'],
        status: 'active',
        notes: 'Real-time API monitoring'
      },
      {
        route: '/api/stats',
        method: 'GET',
        description: 'Get application statistics',
        accessType: 'public',
        status: 'active',
        notes: 'Public stats like total players, tournaments, etc.'
      }
    ]
  },

  // File Upload & Media
  {
    name: 'File Upload & Media',
    description: 'File upload and media management',
    icon: '📁',
    color: '#795548',
    apis: [
      {
        route: '/api/upload/profile-picture',
        method: 'POST',
        description: 'Upload profile picture',
        accessType: 'authenticated',
        status: 'active',
        notes: 'Upload user/player profile picture'
      },
      {
        route: '/api/upload/schedule',
        method: 'POST',
        description: 'Upload tournament schedule',
        accessType: 'role-based',
        requiredRoles: ['admin', 'host'],
        status: 'active',
        notes: 'Upload CSV schedule for tournaments'
      }
    ]
  },

  // Public APIs
  {
    name: 'Public APIs',
    description: 'Publicly accessible endpoints',
    icon: '🌐',
    color: '#8BC34A',
    apis: [
      {
        route: '/api/players-public',
        method: 'GET',
        description: 'Get public player list',
        accessType: 'public',
        status: 'active',
        notes: 'Limited player information for public view'
      },
      {
        route: '/api/health',
        method: 'GET',
        description: 'Health check',
        accessType: 'public',
        status: 'planned',
        notes: 'System health and status check'
      }
    ]
  }
]

// Flatten all APIs for backward compatibility
export const API_ACCESS_CONFIG: APIAccessConfig[] = API_ACCESS_GROUPS.flatMap(group => group.apis)

// Helper functions
export function getAPIsByGroup(groupName: string): APIAccessConfig[] {
  const group = API_ACCESS_GROUPS.find(g => g.name === groupName)
  return group ? group.apis : []
}

export function getAPIsByStatus(status: 'active' | 'deprecated' | 'planned'): APIAccessConfig[] {
  return API_ACCESS_CONFIG.filter(api => api.status === status)
}

export function getAPIsByAccessType(accessType: 'public' | 'authenticated' | 'role-based'): APIAccessConfig[] {
  return API_ACCESS_CONFIG.filter(api => api.accessType === accessType)
}

export function getAPIGroups(): APIGroup[] {
  return API_ACCESS_GROUPS
}

export default API_ACCESS_GROUPS

export interface APIAccessConfig {
  route: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  description: string
  accessType: 'public' | 'authenticated' | 'role-based'
  requiredRoles?: string[]
  notes?: string
  status: 'active' | 'deprecated' | 'planned'
}

export const API_ACCESS_CONFIG: APIAccessConfig[] = [
  // Authentication APIs
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
    route: '/api/auth/change-password',
    method: 'POST',
    description: 'Change user password',
    accessType: 'authenticated',
    status: 'active',
    notes: 'Requires current password for verification'
  },

  // Public APIs
  {
    route: '/api/players-public',
    method: 'GET',
    description: 'Get all players (public view)',
    accessType: 'public',
    status: 'active',
    notes: 'Shows limited player information, filters skills based on user role'
  },
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
    route: '/api/stats',
    method: 'GET',
    description: 'Get application statistics',
    accessType: 'public',
    status: 'active',
    notes: 'Public stats like total players, tournaments, etc.'
  },

  // Authenticated APIs (any logged-in user)
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
    method: 'PUT',
    description: 'Update user profile',
    accessType: 'authenticated',
    status: 'active',
    notes: 'Users can only update their own profile'
  },
  {
    route: '/api/player-profile',
    method: 'GET',
    description: 'Get current user player profile',
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
    route: '/api/players',
    method: 'GET',
    description: 'Get all players (authenticated view)',
    accessType: 'authenticated',
    status: 'active',
    notes: 'Shows full player information for authenticated users'
  },
  {
    route: '/api/players/[id]',
    method: 'GET',
    description: 'Get specific player details',
    accessType: 'authenticated',
    status: 'active',
    notes: 'Full player information including skills'
  },
  {
    route: '/api/players/search',
    method: 'GET',
    description: 'Search players',
    accessType: 'authenticated',
    status: 'active',
    notes: 'Search functionality for players'
  },
  {
    route: '/api/players/user/[userId]',
    method: 'GET',
    description: 'Get player by user ID',
    accessType: 'authenticated',
    status: 'active',
    notes: 'Get player profile by user ID'
  },
  {
    route: '/api/tournaments/[id]/register',
    method: 'POST',
    description: 'Register for tournament',
    accessType: 'authenticated',
    status: 'active',
    notes: 'Users can register for tournaments'
  },
  {
    route: '/api/tournaments/[id]/withdraw',
    method: 'POST',
    description: 'Withdraw from tournament',
    accessType: 'authenticated',
    status: 'active',
    notes: 'Users can withdraw from tournaments they registered for'
  },
  {
    route: '/api/tournaments/[id]/user-registration',
    method: 'GET',
    description: 'Get user tournament registration status',
    accessType: 'authenticated',
    status: 'active',
    notes: 'Check if user is registered for tournament'
  },
  {
    route: '/api/auctions',
    method: 'GET',
    description: 'Get all auctions',
    accessType: 'authenticated',
    status: 'active',
    notes: 'View all auctions'
  },
  {
    route: '/api/place-bid',
    method: 'POST',
    description: 'Place bid on auction',
    accessType: 'authenticated',
    status: 'active',
    notes: 'Users can place bids on auctions'
  },
  {
    route: '/api/auction-status',
    method: 'GET',
    description: 'Get auction status',
    accessType: 'authenticated',
    status: 'active',
    notes: 'Check auction status'
  },
  {
    route: '/api/auction-results',
    method: 'GET',
    description: 'Get auction results',
    accessType: 'authenticated',
    status: 'active',
    notes: 'View auction results'
  },
  {
    route: '/api/check-role',
    method: 'GET',
    description: 'Check user role',
    accessType: 'authenticated',
    status: 'active',
    notes: 'Get current user role information'
  },
  {
    route: '/api/user-status',
    method: 'GET',
    description: 'Get user status',
    accessType: 'authenticated',
    status: 'active',
    notes: 'Get current user status'
  },
  {
    route: '/api/sync-user',
    method: 'POST',
    description: 'Sync user data',
    accessType: 'authenticated',
    status: 'active',
    notes: 'Sync user information'
  },

  // Host/Admin APIs
  {
    route: '/api/players',
    method: 'POST',
    description: 'Create new player',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can create new players'
  },
  {
    route: '/api/players/[id]',
    method: 'PUT',
    description: 'Update player',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts can update players they created, admins can update any player'
  },
  {
    route: '/api/players/[id]',
    method: 'DELETE',
    description: 'Delete player',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts can delete players they created, admins can delete any player'
  },
  {
    route: '/api/tournaments',
    method: 'POST',
    description: 'Create new tournament',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can create tournaments'
  },
  {
    route: '/api/tournaments/[id]',
    method: 'PUT',
    description: 'Update tournament',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts can update tournaments they created, admins can update any tournament'
  },
  {
    route: '/api/tournaments/[id]',
    method: 'DELETE',
    description: 'Delete tournament',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts can delete tournaments they created, admins can delete any tournament'
  },
  {
    route: '/api/tournaments/[id]/assign-player',
    method: 'POST',
    description: 'Assign player to tournament',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can assign players to tournaments'
  },
  {
    route: '/api/tournaments/[id]/remove-player',
    method: 'POST',
    description: 'Remove player from tournament',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can remove players from tournaments'
  },
  {
    route: '/api/tournaments/[id]/slots',
    method: 'GET',
    description: 'Get tournament slots',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can view tournament slots'
  },
  {
    route: '/api/tournaments/[id]/slots',
    method: 'POST',
    description: 'Create tournament slots',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can create tournament slots'
  },
  {
    route: '/api/tournaments/[id]/slots',
    method: 'PUT',
    description: 'Update tournament slots',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can update tournament slots'
  },
  {
    route: '/api/tournaments/[id]/slots',
    method: 'DELETE',
    description: 'Delete tournament slots',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can delete tournament slots'
  },
  {
    route: '/api/auctions',
    method: 'POST',
    description: 'Create new auction',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can create auctions'
  },
  {
    route: '/api/finalize-auction',
    method: 'POST',
    description: 'Finalize auction',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can finalize auctions'
  },
  {
    route: '/api/reset-auction',
    method: 'POST',
    description: 'Reset auction',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can reset auctions'
  },
  {
    route: '/api/tournament-status',
    method: 'GET',
    description: 'Get tournament status',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can check tournament status'
  },
  {
    route: '/api/player-skills',
    method: 'GET',
    description: 'Get player skills',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can view player skills'
  },
  {
    route: '/api/player-skills',
    method: 'POST',
    description: 'Create player skill',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can create player skills'
  },
  {
    route: '/api/player-skills',
    method: 'PUT',
    description: 'Update player skill',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can update player skills'
  },
  {
    route: '/api/player-skills',
    method: 'DELETE',
    description: 'Delete player skill',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can update player skills'
  },
  {
    route: '/api/player-skills/list',
    method: 'GET',
    description: 'Get player skills list',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can view player skills list'
  },
  {
    route: '/api/register-player',
    method: 'POST',
    description: 'Register player for tournament',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can register players for tournaments'
  },
  {
    route: '/api/update-user-role',
    method: 'PUT',
    description: 'Update user role',
    accessType: 'role-based',
    requiredRoles: ['host', 'admin'],
    status: 'active',
    notes: 'Hosts and admins can update user roles'
  },

  // Admin-only APIs
  {
    route: '/api/admin/users',
    method: 'GET',
    description: 'Get all users (admin view)',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can view all users'
  },
  {
    route: '/api/admin/users',
    method: 'PUT',
    description: 'Update user status/role',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can update user status and roles'
  },
  {
    route: '/api/admin/check-user',
    method: 'GET',
    description: 'Check user details',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can check user details'
  },
  {
    route: '/api/admin/reset-password',
    method: 'POST',
    description: 'Reset user password',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can reset user passwords'
  },
  {
    route: '/api/admin/player-profiles',
    method: 'GET',
    description: 'Get all player profiles (admin view)',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can view all player profiles'
  },
  {
    route: '/api/admin/player-profiles',
    method: 'PUT',
    description: 'Update player profile status',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can approve/reject player profiles'
  },
  {
    route: '/api/admin/player-skills',
    method: 'GET',
    description: 'Get player skills (admin view)',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can view all player skills'
  },
  {
    route: '/api/admin/player-skills',
    method: 'POST',
    description: 'Create player skill (admin)',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can create player skills'
  },
  {
    route: '/api/admin/player-skills',
    method: 'PUT',
    description: 'Update player skill (admin)',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can update player skills'
  },
  {
    route: '/api/admin/player-skills',
    method: 'DELETE',
    description: 'Delete player skill (admin)',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can delete player skills'
  },
  {
    route: '/api/admin/player-skill-values',
    method: 'GET',
    description: 'Get player skill values (admin view)',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can view all player skill values'
  },
  {
    route: '/api/admin/player-skill-values',
    method: 'POST',
    description: 'Create player skill value (admin)',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can create player skill values'
  },
  {
    route: '/api/admin/player-skill-values',
    method: 'PUT',
    description: 'Update player skill value (admin)',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can update player skill values'
  },
  {
    route: '/api/admin/player-skill-values',
    method: 'DELETE',
    description: 'Delete player skill value (admin)',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can delete player skill values'
  },

  // Analytics APIs
  {
    route: '/api/analytics/usage',
    method: 'GET',
    description: 'Get API usage statistics',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can view API usage analytics'
  },
  {
    route: '/api/analytics/users',
    method: 'GET',
    description: 'Get user activity statistics',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can view user activity analytics'
  },
  {
    route: '/api/analytics/patterns',
    method: 'GET',
    description: 'Get hourly usage patterns',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can view usage pattern analytics'
  },
  {
    route: '/api/analytics/recent',
    method: 'GET',
    description: 'Get recent API activity',
    accessType: 'role-based',
    requiredRoles: ['admin'],
    status: 'active',
    notes: 'Admin can view recent API activity for real-time monitoring'
  },

  // Deprecated/Planned APIs
  {
    route: '/api/test-db',
    method: 'GET',
    description: 'Test database connection',
    accessType: 'public',
    status: 'deprecated',
    notes: 'Development testing endpoint - should be removed in production'
  }
]

// Helper functions
export function getAPIConfig(route: string, method: string): APIAccessConfig | undefined {
  return API_ACCESS_CONFIG.find(config => 
    config.route === route && config.method === method
  )
}

export function getAPIsByAccessType(accessType: 'public' | 'authenticated' | 'role-based'): APIAccessConfig[] {
  return API_ACCESS_CONFIG.filter(config => config.accessType === accessType)
}

export function getAPIsByRole(role: string): APIAccessConfig[] {
  return API_ACCESS_CONFIG.filter(config => 
    config.accessType === 'role-based' && 
    config.requiredRoles?.includes(role)
  )
}

export function getAPIsByStatus(status: 'active' | 'deprecated' | 'planned'): APIAccessConfig[] {
  return API_ACCESS_CONFIG.filter(config => config.status === status)
}

export function getAllRoutes(): string[] {
  const routes = API_ACCESS_CONFIG.map(config => config.route)
  return Array.from(new Set(routes))
}

export function getRouteMethods(route: string): string[] {
  return API_ACCESS_CONFIG
    .filter(config => config.route === route)
    .map(config => config.method)
}

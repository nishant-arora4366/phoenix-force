// Permission utilities for user access control

export interface User {
  id: string
  email: string
  role: 'viewer' | 'host' | 'captain' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  username?: string
  firstname?: string
  lastname?: string
}

// Flexible user data type for permission checks
export interface UserData {
  role?: string
  status?: string
  id?: string
  email?: string
}

export class PermissionService {
  // Check if user can perform admin actions
  static canAdmin(user: User | UserData | null): boolean {
    return user?.role === 'admin' && user?.status === 'approved'
  }

  // Check if user can create tournaments
  static canCreateTournaments(user: User | UserData | null): boolean {
    return (user?.role === 'admin' || user?.role === 'host') && user?.status === 'approved'
  }

  // Check if user can create players
  static canCreatePlayers(user: User | UserData | null): boolean {
    return (user?.role === 'admin' || user?.role === 'host') && user?.status === 'approved'
  }

  // Check if user can join tournaments/slots
  static canJoinTournaments(user: User | UserData | null): boolean {
    return user?.status === 'approved'
  }

  // Check if user can view content (basic read access)
  static canView(user: User | UserData | null): boolean {
    return user?.status === 'pending' || user?.status === 'approved'
  }

  // Check if user is pending approval
  static isPending(user: User | UserData | null): boolean {
    return user?.status === 'pending'
  }

  // Check if user is approved
  static isApproved(user: User | UserData | null): boolean {
    return user?.status === 'approved'
  }

  // Get user access level description
  static getAccessLevel(user: User | UserData | null): string {
    if (!user) return 'No access'
    if (user.status === 'rejected') return 'Account rejected'
    if (user.status === 'pending') return 'Pending approval - Limited access'
    if (user.status === 'approved') {
      switch (user.role) {
        case 'admin': return 'Full admin access'
        case 'host': return 'Host access - Can create tournaments'
        case 'captain': return 'Captain access - Can join tournaments'
        case 'viewer': return 'Viewer access - Read only'
        default: return 'Approved user'
      }
    }
    return 'Unknown status'
  }
}

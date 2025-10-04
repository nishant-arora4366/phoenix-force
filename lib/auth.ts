import { supabase } from './supabaseClient'
import bcrypt from 'bcryptjs'

export interface AuthUser {
  id: string
  email: string
  username?: string
  firstname?: string
  lastname?: string
  role: string
  status: string
}

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12)
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  // Register new user
  static async register(userData: {
    email: string
    password: string
    username?: string
    firstname?: string
    lastname?: string
  }): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single()

      if (existingUser) {
        return { success: false, error: 'User with this email already exists' }
      }

      // Hash password
      const passwordHash = await this.hashPassword(userData.password)

      // Create user
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          password_hash: passwordHash,
          username: userData.username,
          firstname: userData.firstname,
          lastname: userData.lastname,
          role: 'player',
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, user }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Login user
  static async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    try {
      // Get user from database
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error || !user) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Check if user is approved
      if (user.status !== 'approved') {
        return { success: false, error: 'Your account is pending admin approval' }
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.password_hash)
      if (!isValidPassword) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user

      return { success: true, user: userWithoutPassword }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get current user from session
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // For now, we'll use Supabase auth to get the user ID
      // In a full custom auth implementation, you'd store the session differently
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return null

      // Get user details from our users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !userData) return null

      // Remove password hash
      const { password_hash, ...userWithoutPassword } = userData
      return userWithoutPassword
    } catch (error) {
      return null
    }
  }

  // Logout user
  static async logout(): Promise<void> {
    await supabase.auth.signOut()
  }

  // Update user profile
  static async updateProfile(userId: string, updates: {
    username?: string
    firstname?: string
    lastname?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Change password
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current user
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single()

      if (fetchError || !user) {
        return { success: false, error: 'User not found' }
      }

      // Verify current password
      const isValidPassword = await this.verifyPassword(currentPassword, user.password_hash)
      if (!isValidPassword) {
        return { success: false, error: 'Current password is incorrect' }
      }

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword)

      // Update password
      const { error } = await supabase
        .from('users')
        .update({ password_hash: newPasswordHash })
        .eq('id', userId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

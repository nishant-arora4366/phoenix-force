/**
 * Optimized Realtime Subscription Manager
 * Consolidates multiple subscriptions into single channels with debouncing
 */

import { getSupabaseClient } from '@/src/lib/supabaseClient'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UpdateBuffer {
  type: string
  table: string
  payload: any
  timestamp: number
}

interface ChannelConfig {
  tables: {
    table: string
    filter?: string
    events?: ('INSERT' | 'UPDATE' | 'DELETE' | '*')[]
  }[]
  debounceMs?: number
  onUpdate: (updates: UpdateBuffer[]) => void
  onError?: (error: any) => void
}

class RealtimeManager {
  private static instance: RealtimeManager
  private channels: Map<string, RealtimeChannel> = new Map()
  private updateBuffers: Map<string, UpdateBuffer[]> = new Map()
  private flushTimers: Map<string, NodeJS.Timeout> = new Map()
  private configs: Map<string, ChannelConfig> = new Map()

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager()
    }
    return RealtimeManager.instance
  }

  /**
   * Create or update a multiplexed channel for multiple table subscriptions
   * @param channelId Unique identifier for this channel
   * @param config Configuration for tables and handlers
   */
  subscribe(channelId: string, config: ChannelConfig): () => void {
    // Clean up existing channel if any
    this.unsubscribe(channelId)

    const supabase = getSupabaseClient()
    const debounceMs = config.debounceMs ?? 100 // Default 100ms debounce

    // Store config for this channel
    this.configs.set(channelId, config)
    this.updateBuffers.set(channelId, [])

    // Create single multiplexed channel
    const channel = supabase.channel(channelId)

    // Add subscriptions for each table
    config.tables.forEach(({ table, filter, events = ['*'] }) => {
      events.forEach(event => {
        const subscription = {
          event: event as any,
          schema: 'public',
          table,
          ...(filter ? { filter } : {})
        }

        channel.on('postgres_changes', subscription, (payload) => {
          this.bufferUpdate(channelId, {
            type: event,
            table,
            payload,
            timestamp: Date.now()
          }, debounceMs)
        })
      })
    })

    // Subscribe with error handling
    channel.subscribe((status, err) => {
      if (err) {
        console.error(`[RealtimeManager] Channel ${channelId} error:`, err)
        config.onError?.(err)
      } else if (status === 'SUBSCRIBED') {
        console.log(`[RealtimeManager] Channel ${channelId} subscribed successfully`)
      }
    })

    // Store channel reference
    this.channels.set(channelId, channel)

    // Return unsubscribe function
    return () => this.unsubscribe(channelId)
  }

  /**
   * Buffer updates and flush after debounce period
   */
  private bufferUpdate(channelId: string, update: UpdateBuffer, debounceMs: number) {
    const buffer = this.updateBuffers.get(channelId) || []
    buffer.push(update)
    this.updateBuffers.set(channelId, buffer)

    // Clear existing timer
    const existingTimer = this.flushTimers.get(channelId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new debounce timer
    const timer = setTimeout(() => {
      this.flushUpdates(channelId)
    }, debounceMs)

    this.flushTimers.set(channelId, timer)
  }

  /**
   * Flush all buffered updates for a channel
   */
  private flushUpdates(channelId: string) {
    const buffer = this.updateBuffers.get(channelId)
    const config = this.configs.get(channelId)

    if (!buffer || !config || buffer.length === 0) return

    // Get updates and clear buffer
    const updates = [...buffer]
    this.updateBuffers.set(channelId, [])

    // Call the update handler with all buffered updates
    try {
      config.onUpdate(updates)
    } catch (error) {
      console.error(`[RealtimeManager] Error in update handler for ${channelId}:`, error)
      config.onError?.(error)
    }
  }

  /**
   * Unsubscribe from a channel and clean up
   */
  unsubscribe(channelId: string) {
    // Clear any pending timer
    const timer = this.flushTimers.get(channelId)
    if (timer) {
      clearTimeout(timer)
      this.flushTimers.delete(channelId)
    }

    // Flush any remaining updates
    this.flushUpdates(channelId)

    // Remove channel
    const channel = this.channels.get(channelId)
    if (channel) {
      getSupabaseClient().removeChannel(channel)
      this.channels.delete(channelId)
    }

    // Clear buffers and config
    this.updateBuffers.delete(channelId)
    this.configs.delete(channelId)
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    const channelIds = Array.from(this.channels.keys())
    channelIds.forEach(id => this.unsubscribe(id))
  }

  /**
   * Get statistics about active channels
   */
  getStats() {
    return {
      activeChannels: this.channels.size,
      channels: Array.from(this.channels.keys()),
      bufferSizes: Array.from(this.updateBuffers.entries()).map(([id, buffer]) => ({
        channelId: id,
        bufferSize: buffer.length
      }))
    }
  }
}

export const realtimeManager = RealtimeManager.getInstance()

/**
 * React Hook for optimized realtime subscriptions
 */
export function useRealtimeSubscription(
  channelId: string,
  config: Omit<ChannelConfig, 'onUpdate'>,
  onUpdate: (updates: UpdateBuffer[]) => void,
  deps: any[] = []
) {
  const { useEffect, useRef } = require('react')
  
  const configRef = useRef(config)
  configRef.current = config

  useEffect(() => {
    const unsubscribe = realtimeManager.subscribe(channelId, {
      ...configRef.current,
      onUpdate
    })

    return () => {
      unsubscribe()
    }
  }, [channelId, ...deps])
}

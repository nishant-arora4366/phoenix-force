// In-memory cache for auction data with TTL
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class AuctionCache {
  private static instance: AuctionCache
  private cache: Map<string, CacheEntry<any>> = new Map()
  private readonly DEFAULT_TTL = 5000 // 5 seconds for frequently changing data
  private readonly STATIC_TTL = 60000 // 1 minute for static data
  
  static getInstance(): AuctionCache {
    if (!AuctionCache.instance) {
      AuctionCache.instance = new AuctionCache()
    }
    return AuctionCache.instance
  }
  
  // Set data with TTL
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    })
  }
  
  // Get data if not expired
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  // Clear specific cache entry
  invalidate(key: string): void {
    this.cache.delete(key)
  }
  
  // Clear all cache entries matching a pattern
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    const keysToDelete: string[] = []
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => this.cache.delete(key))
  }
  
  // Clear entire cache
  clear(): void {
    this.cache.clear()
  }
  
  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: this.estimateMemoryUsage()
    }
  }
  
  private estimateMemoryUsage(): number {
    let size = 0
    this.cache.forEach((value, key) => {
      size += key.length * 2 // Rough estimate for string memory
      size += JSON.stringify(value.data).length * 2
    })
    return size
  }
}

export const auctionCache = AuctionCache.getInstance()

// Cache key generators
export const cacheKeys = {
  auction: (id: string) => `auction:${id}`,
  auctionTeams: (auctionId: string) => `teams:${auctionId}`,
  auctionPlayers: (auctionId: string) => `players:${auctionId}`,
  playerDetails: (playerId: string) => `player:${playerId}`,
  currentPlayer: (auctionId: string) => `current:${auctionId}`,
  bids: (auctionId: string, playerId?: string) => 
    playerId ? `bids:${auctionId}:${playerId}` : `bids:${auctionId}`,
  userProfile: (userId: string) => `user:${userId}`
}

// Database query wrapper with caching
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = auctionCache.get<T>(key)
  if (cached !== null) {
    console.log(`[Cache HIT] ${key}`)
    return cached
  }
  
  // Execute query
  console.log(`[Cache MISS] ${key}`)
  const result = await queryFn()
  
  // Store in cache
  auctionCache.set(key, result, ttl)
  
  return result
}

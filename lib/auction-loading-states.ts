/**
 * Centralized loading state management for auction actions
 */

import { create } from 'zustand'

export interface AuctionLoadingStates {
  // Individual action loading states
  isLoadingNext: boolean
  isLoadingPrevious: boolean
  isLoadingSell: boolean
  isLoadingBid: boolean
  isLoadingUndo: boolean
  isLoadingStart: boolean
  isLoadingComplete: boolean
  isLoadingPlayerData: boolean
  isLoadingTeamData: boolean
  
  // Bid-specific loading states (per team)
  teamBidLoading: Record<string, boolean>
  
  // General loading
  isInitializing: boolean
  isRefreshing: boolean
  
  // Error states
  lastError: string | null
  
  // Actions
  setLoadingState: (key: keyof AuctionLoadingStates, value: boolean) => void
  setTeamBidLoading: (teamId: string, isLoading: boolean) => void
  clearTeamBidLoading: () => void
  setError: (error: string | null) => void
  resetLoadingStates: () => void
  
  // Helper getters
  isAnyActionLoading: () => boolean
  isNavigationLoading: () => boolean
}

export const useAuctionLoadingStates = create<AuctionLoadingStates>((set, get) => ({
  // Initial states
  isLoadingNext: false,
  isLoadingPrevious: false,
  isLoadingSell: false,
  isLoadingBid: false,
  isLoadingUndo: false,
  isLoadingStart: false,
  isLoadingComplete: false,
  isLoadingPlayerData: false,
  isLoadingTeamData: false,
  teamBidLoading: {},
  isInitializing: true,
  isRefreshing: false,
  lastError: null,
  
  // Actions
  setLoadingState: (key, value) => set({ [key]: value }),
  
  setTeamBidLoading: (teamId, isLoading) => set((state) => ({
    teamBidLoading: {
      ...state.teamBidLoading,
      [teamId]: isLoading
    }
  })),
  
  clearTeamBidLoading: () => set({ teamBidLoading: {} }),
  
  setError: (error) => set({ lastError: error }),
  
  resetLoadingStates: () => set({
    isLoadingNext: false,
    isLoadingPrevious: false,
    isLoadingSell: false,
    isLoadingBid: false,
    isLoadingUndo: false,
    isLoadingStart: false,
    isLoadingComplete: false,
    isLoadingPlayerData: false,
    isLoadingTeamData: false,
    teamBidLoading: {},
    isRefreshing: false,
    lastError: null
  }),
  
  // Helper getters
  isAnyActionLoading: () => {
    const state = get()
    return (
      state.isLoadingNext ||
      state.isLoadingPrevious ||
      state.isLoadingSell ||
      state.isLoadingBid ||
      state.isLoadingUndo ||
      state.isLoadingStart ||
      state.isLoadingComplete ||
      Object.values(state.teamBidLoading).some(loading => loading)
    )
  },
  
  isNavigationLoading: () => {
    const state = get()
    return state.isLoadingNext || state.isLoadingPrevious
  }
}))

// Export convenient hooks for specific loading states
export const useIsAuctionLoading = () => {
  const isAnyActionLoading = useAuctionLoadingStates(state => state.isAnyActionLoading)
  return isAnyActionLoading()
}

export const useIsNavigating = () => {
  const isNavigationLoading = useAuctionLoadingStates(state => state.isNavigationLoading)
  return isNavigationLoading()
}

export const useTeamBidLoading = (teamId: string) => {
  return useAuctionLoadingStates(state => state.teamBidLoading[teamId] || false)
}

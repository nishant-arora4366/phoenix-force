import React, { memo, useRef, useEffect } from 'react'
import { FixedSizeList as List } from 'react-window'

interface Bid {
  id: string
  team_name: string
  bid_amount: number
  timestamp: string
  is_winning_bid: boolean
  is_undone: boolean
}

interface BidHistoryProps {
  bids: Bid[]
  height?: number
}

// Virtualized bid row component
const BidRow = memo(({ 
  index, 
  style, 
  data 
}: { 
  index: number
  style: React.CSSProperties
  data: Bid[]
}) => {
  const bid = data[index]
  
  return (
    <div 
      style={style}
      className={`
        flex items-center justify-between px-3 py-2 border-b border-gray-800
        ${bid.is_winning_bid ? 'bg-green-900/20' : ''}
        ${bid.is_undone ? 'opacity-50 line-through' : ''}
        transition-colors duration-200
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">
          #{index + 1}
        </span>
        <div>
          <div className="text-sm font-medium text-gray-200">
            {bid.team_name}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(bid.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold text-[#CEA17A]">
          ₹{bid.bid_amount.toLocaleString()}
        </div>
        {bid.is_winning_bid && (
          <span className="text-xs text-green-400 font-medium">
            WINNING
          </span>
        )}
      </div>
    </div>
  )
})

BidRow.displayName = 'BidRow'

// Main virtualized bid history component
export const BidHistory = memo(({ 
  bids, 
  height = 400 
}: BidHistoryProps) => {
  const listRef = useRef<List>(null)
  
  // Auto-scroll to top when new bid is added
  useEffect(() => {
    if (listRef.current && bids.length > 0) {
      listRef.current.scrollToItem(0, 'start')
    }
  }, [bids.length])
  
  if (!bids || bids.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
        <div className="text-center text-gray-500 text-sm">
          No bids yet
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden">
      <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300">
          Bid History ({bids.length})
        </h3>
      </div>
      
      <List
        ref={listRef}
        height={height}
        itemCount={bids.length}
        itemSize={64}
        itemData={bids}
        width="100%"
        className="scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
      >
        {BidRow}
      </List>
    </div>
  )
})

BidHistory.displayName = 'BidHistory'

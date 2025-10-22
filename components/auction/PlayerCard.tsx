import React, { memo, useState, useCallback } from 'react'
import Image from 'next/image'

interface PlayerCardProps {
  player: {
    id: string
    display_name: string
    bio?: string
    profile_pic_url?: string
    skills?: Record<string, string | string[]>
    base_price?: number
  }
  isCurrentPlayer?: boolean
  isSold?: boolean
  soldPrice?: number
  soldToTeam?: string
  onImageClick?: () => void
}

// Memoized player image component
const PlayerImage = memo(({ 
  src, 
  name, 
  onClick 
}: { 
  src?: string | null
  name: string
  onClick?: () => void
}) => {
  const [hasError, setHasError] = useState(false)
  
  const handleError = useCallback(() => {
    setHasError(true)
  }, [])
  
  if (!src || hasError) {
    return (
      <div 
        className="w-full h-full bg-gradient-to-br from-[#CEA17A]/20 to-[#CEA17A]/10 flex items-center justify-center cursor-pointer"
        onClick={onClick}
      >
        <span className="text-5xl font-bold text-[#CEA17A] select-none">
          {name?.charAt(0)?.toUpperCase() || '👤'}
        </span>
      </div>
    )
  }
  
  return (
    <div className="relative w-full h-full cursor-pointer" onClick={onClick}>
      <Image
        src={src}
        alt={name}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
        onError={handleError}
        priority={true}
        quality={75} // Reduce quality for faster loading
      />
    </div>
  )
})

PlayerImage.displayName = 'PlayerImage'

// Memoized skill badge component
const SkillBadge = memo(({ 
  skillName, 
  skillValue 
}: { 
  skillName: string
  skillValue: string | string[]
}) => {
  const displayValue = Array.isArray(skillValue) 
    ? skillValue.join(', ') 
    : skillValue
    
  return (
    <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700">
      <div className="text-xs text-gray-400 mb-1">{skillName}</div>
      <div className="text-sm font-medium text-gray-200">
        {displayValue}
      </div>
    </div>
  )
})

SkillBadge.displayName = 'SkillBadge'

// Main player card component with memoization
export const PlayerCard = memo(({
  player,
  isCurrentPlayer = false,
  isSold = false,
  soldPrice,
  soldToTeam,
  onImageClick
}: PlayerCardProps) => {
  if (!player) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
        <div className="text-center text-gray-500">
          No player selected
        </div>
      </div>
    )
  }
  
  return (
    <div className={`
      relative rounded-xl overflow-hidden transition-all duration-300
      ${isCurrentPlayer 
        ? 'bg-gradient-to-br from-green-900/30 to-green-800/20 border-2 border-green-500/50 shadow-lg shadow-green-500/20' 
        : 'bg-gray-900/50 border border-gray-700'
      }
      ${isSold ? 'opacity-75' : ''}
    `}>
      {/* Status Badge */}
      {(isCurrentPlayer || isSold) && (
        <div className={`
          absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-bold
          ${isCurrentPlayer 
            ? 'bg-green-500 text-white animate-pulse' 
            : 'bg-red-500 text-white'
          }
        `}>
          {isCurrentPlayer ? 'LIVE' : 'SOLD'}
        </div>
      )}
      
      {/* Player Image */}
      <div className="aspect-[4/5] relative overflow-hidden">
        <PlayerImage 
          src={player.profile_pic_url} 
          name={player.display_name}
          onClick={onImageClick}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
        
        {/* Player Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-2xl font-bold text-white mb-1">
            {player.display_name}
          </h3>
          {player.base_price && (
            <div className="text-sm text-gray-300">
              Base: ₹{player.base_price.toLocaleString()}
            </div>
          )}
        </div>
      </div>
      
      {/* Player Details */}
      <div className="p-4 space-y-3">
        {/* Bio */}
        {player.bio && (
          <p className="text-sm text-gray-400 line-clamp-2">
            {player.bio}
          </p>
        )}
        
        {/* Sold Information */}
        {isSold && soldPrice && soldToTeam && (
          <div className="bg-red-900/30 rounded-lg p-3 border border-red-500/30">
            <div className="text-xs text-red-400 mb-1">Sold To</div>
            <div className="text-lg font-bold text-red-300">
              {soldToTeam}
            </div>
            <div className="text-2xl font-bold text-red-400 mt-1">
              ₹{soldPrice.toLocaleString()}
            </div>
          </div>
        )}
        
        {/* Skills Grid */}
        {player.skills && Object.keys(player.skills).length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {Object.entries(player.skills).slice(0, 4).map(([key, value]) => (
              <SkillBadge 
                key={key}
                skillName={key}
                skillValue={value}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.player?.id === nextProps.player?.id &&
    prevProps.isCurrentPlayer === nextProps.isCurrentPlayer &&
    prevProps.isSold === nextProps.isSold &&
    prevProps.soldPrice === nextProps.soldPrice &&
    prevProps.soldToTeam === nextProps.soldToTeam
  )
})

PlayerCard.displayName = 'PlayerCard'

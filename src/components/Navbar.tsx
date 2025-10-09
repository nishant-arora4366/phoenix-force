'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { sessionManager } from '@/src/lib/session'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const currentUser = sessionManager.getUser()
    setUser(currentUser)

    const unsubscribe = sessionManager.subscribe((sessionUser) => {
      setUser(sessionUser)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    try {
      sessionManager.clearUser()
      // Stay on current page after sign out
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleBackNavigation = () => {
    // Define logical back navigation paths based on current page
    const getBackPath = () => {
      // Tournament-related pages
      if (pathname.startsWith('/tournaments/') && pathname.includes('/edit')) {
        return `/tournaments/${pathname.split('/')[2]}` // Back to tournament details
      }
      if (pathname.startsWith('/tournaments/') && !pathname.includes('/edit')) {
        return '/tournaments' // Back to tournaments list
      }
      if (pathname === '/tournaments/create') {
        return '/tournaments' // Back to tournaments list
      }
      
      // Player-related pages
      if (pathname.startsWith('/players/') && pathname.includes('/edit')) {
        return `/players/${pathname.split('/')[2]}` // Back to player details
      }
      if (pathname.startsWith('/players/') && !pathname.includes('/edit')) {
        return '/players' // Back to players list
      }
      if (pathname === '/players/create') {
        return '/players' // Back to players list
      }
      
      // Profile pages
      if (pathname === '/profile') {
        return '/tournaments' // Back to tournaments (main page)
      }
      if (pathname === '/player-profile') {
        return '/profile' // Back to profile
      }
      
      // Admin pages
      if (pathname.startsWith('/admin/')) {
        return '/admin' // Back to admin dashboard
      }
      if (pathname === '/admin') {
        return '/tournaments' // Back to tournaments
      }
      
      // Other pages
      if (pathname === '/auctions') {
        return '/tournaments' // Back to tournaments
      }
      if (pathname === '/tournament-rules') {
        return '/tournaments' // Back to tournaments
      }
      
      // Default fallback to home
      return '/'
    }

    const backPath = getBackPath()
    router.push(backPath)
  }

  // Check if we should show back button (not on home page)
  const shouldShowBackButton = pathname !== '/'

  const getDisplayName = () => {
    if (user?.firstname && user?.lastname) {
      return `${user.firstname} ${user.lastname}`
    }
    return user?.email?.split('@')[0] || 'User'
  }

  // All navigation links (used in mobile menu)
  const allNavigationLinks = [
    {
      href: '/tournaments',
      label: 'Tournaments',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      href: '/players',
      label: 'Players',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      href: '/auctions',
      label: 'Auctions',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ]

  // Add admin link to mobile menu only if user is logged in and has admin role
  if (user && user.role === 'admin') {
    allNavigationLinks.push({
      href: '/admin',
      label: 'Admin',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    })
  }

  // Quick links for desktop view (only essential ones)
  const desktopQuickLinks = [
    {
      href: '/tournaments',
      label: 'Tournaments',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      href: '/players',
      label: 'Players',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ]

  // Add admin link only if user is logged in and has admin role
  if (user && user.role === 'admin') {
    desktopQuickLinks.push({
      href: '/admin',
      label: 'Admin',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    })
  }

  return (
    <>
      <nav className="bg-[#19171b] border-b border-[#75020f]/20 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            
            {/* Left Side - Brand (Desktop) / Hamburger (Mobile) */}
            <div className="flex items-center space-x-4">
              {/* Back Button Container - Always reserves space on desktop */}
              <div className="hidden sm:block">
                {shouldShowBackButton ? (
                  <button
                    onClick={handleBackNavigation}
                    className="flex items-center space-x-2 p-3 rounded-lg text-[#DBD0C0] hover:text-[#75020f] hover:bg-[#75020f]/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#75020f] transition-all duration-300"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-sm font-medium">Back</span>
                  </button>
                ) : (
                  <div className="w-20 h-12"></div>
                )}
              </div>

              {/* Hamburger Menu Container - Always reserves space on mobile */}
              <div className="sm:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-3 rounded-lg text-[#DBD0C0] hover:text-[#75020f] hover:bg-[#75020f]/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#75020f] transition-all duration-300"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
              </div>

              {/* Logo */}
              <Link href="/" className="flex items-center transition-all duration-300 hover:scale-105">
                <img 
                  src="/logo.png" 
                  alt="Phoenix Force Logo" 
                  className="w-12 h-12 object-contain"
                />
              </Link>
            </div>

            {/* Right Side - Navigation Links (Desktop) / Profile Dropdown (Mobile) */}
            <div className="flex items-center space-x-4">
              
              {/* Desktop Quick Links */}
              <div className="hidden sm:flex items-center space-x-2">
                {desktopQuickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center space-x-2 text-[#DBD0C0] hover:text-[#75020f] px-4 py-2 rounded-lg hover:bg-[#75020f]/10 transition-all duration-300 font-medium"
                  >
                    <span className="text-[#DBD0C0]">
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>

              {/* Profile Dropdown */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-3 text-[#DBD0C0] hover:text-[#75020f] px-4 py-2 rounded-lg hover:bg-[#75020f]/10 transition-all duration-300"
                  >
                    <div className="w-10 h-10 bg-[#75020f] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {getDisplayName().charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block font-medium">{getDisplayName()}</span>
                    <svg className="h-4 w-4 text-[#DBD0C0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-[#19171b] rounded-lg shadow-lg border border-[#75020f]/20 py-2 z-50">
                      <div className="px-4 py-3 border-b border-[#75020f]/20">
                        <p className="text-sm font-bold text-white">{getDisplayName()}</p>
                        <p className="text-xs text-gray-300 truncate">{user.email}</p>
                      </div>
                        <Link
                          href="/profile"
                          className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-200 hover:bg-[#75020f]/10 hover:text-[#75020f] transition-all duration-300"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Profile</span>
                        </Link>
                        <Link
                          href="/player-profile"
                          className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-200 hover:bg-[#75020f]/10 hover:text-[#75020f] transition-all duration-300"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit Profile</span>
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-200 hover:bg-[#75020f]/10 hover:text-[#75020f] transition-all duration-300"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Sign Out</span>
                        </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-50"
                onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu Panel */}
          <div className="fixed top-0 left-0 h-full w-80 max-w-[85vw] md:w-96 md:max-w-[30vw] bg-[#19171b] shadow-xl transform transition-transform duration-300 ease-in-out">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#75020f]/20">
              <div className="flex items-center">
                <img 
                  src="/logo.png" 
                  alt="Phoenix Force Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-lg text-[#DBD0C0] hover:text-[#75020f] hover:bg-[#75020f]/10 transition-all duration-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Menu Content */}
            <div className="p-6">
              <div className="space-y-3">
                {allNavigationLinks.map((link, index) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center space-x-4 text-[#DBD0C0] hover:text-[#75020f] px-4 py-4 rounded-lg hover:bg-[#75020f]/10 transition-all duration-300 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="text-[#DBD0C0]">
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isProfileDropdownOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileDropdownOpen(false)}
        />
      )}

      {/* Floating Back Button - Mobile Only, Show on all pages except home */}
      {shouldShowBackButton && (
        <button
          onClick={handleBackNavigation}
          className="fixed bottom-6 left-6 sm:hidden z-40 w-14 h-14 bg-[#75020f] hover:bg-[#75020f]/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      )}
    </>
  )
}
'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname, useRouter } from 'next/navigation';
import { Search, List, Film, Monitor, LogIn, LogOut, UserCircle, Loader2, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import PlatformManagementModal from './PlatformManagementModal';

export default function Header() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const [isSigningIn, setIsSigningIn] = useState(false); // New state for sign-in button
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter(); // For redirecting after sign out

  const navItems = [
    { name: 'Search', href: '/search', icon: Search },
    { name: 'My Watchlist', href: '/watchlist', icon: List },
  ];

  const handleSignIn = () => {
    setIsSigningIn(true);
    signIn('google'); // No need to await, signIn handles redirection
  };

  return (
    <header className="bg-[#1a1a1a] text-white sticky top-0 z-50 border-b border-gray-700">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo - points to landing page */}
        <Link href="/search" className="flex items-center">
          <Film className="h-6 w-6 text-[#E50914] mr-2" />
          <h1 className="text-xl sm:text-2xl font-bold text-[#E50914] tracking-tight">Watchlist</h1>
        </Link>

        {/* Mobile Icons - visible only on small screens */}
        <div className="flex md:hidden items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`p-2 rounded-full transition-colors ${
                pathname === item.href
                  ? 'text-[#E50914] bg-gray-800'
                  : 'text-white hover:text-[#E50914] hover:bg-gray-800'
              }`}
              aria-label={item.name}
            >
              <item.icon className="h-6 w-6" />
            </Link>
          ))}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8 justify-center flex-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-1 transition-colors ${
                pathname === item.href // More direct comparison for active state
                  ? 'text-[#E50914]'
                  : 'text-white hover:text-[#E50914]'
              }`}
            >
              <item.icon
                className={`h-5 w-5 mr-2 ${
                  pathname === item.href ? 'text-[#E50914]' : 'text-white'
                }`}
              />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-4">
          {(loading && !session) || isSigningIn ? ( // Show loader if general loading or specifically signing in
            <Button
              variant="outline"
              size="sm"
              disabled
              className="flex items-center gap-1 text-white bg-[#1a1a1a] border-gray-700"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Signing In...</span>
            </Button>
          ) : !session ? ( // Corrected: Ensure this is the alternative when not loading/signing in AND no session
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignIn}
              className="flex items-center gap-1 text-white bg-[#1a1a1a] border-gray-700 hover:text-[#E50914] hover:border-[#E50914] hover:bg-[#2a2a2a]"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          ) : null }
          {!loading && session && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-white bg-[#1a1a1a] border-gray-700 hover:text-[#E50914] hover:border-[#E50914] hover:bg-[#2a2a2a]"
                >
                  {session.user.image ? (
                      <img 
                        src={`/api/avatar?url=${encodeURIComponent(session.user.image)}`} 
                        alt={session.user.name || 'User'} 
                        className="w-5 h-5 rounded-full" />
                    ) : (
                      <UserCircle className="h-4 w-4" />
                    )}
                  <span className="hidden sm:inline">{session.user.name || session.user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 text-white border-gray-700" align="end">
                <DropdownMenuLabel>{session.user.name || 'Profile'}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-600" />
                <DropdownMenuItem onSelect={() => setIsPlatformModalOpen(true)} className="cursor-pointer hover:!bg-gray-700 hover:!text-[#E50914]">
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>Platforms</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer hover:!bg-gray-700 hover:!text-[#E50914]">
                  <Link href="/settings">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-600" />
                <DropdownMenuItem
                  onSelect={() => signOut({ redirect: false }).then(() => router.push('/'))}
                  className="cursor-pointer hover:!bg-gray-700 hover:!text-[#E50914]"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          className="md:hidden text-white hover:text-[#E50914] bg-[#1a1a1a]"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <List className="h-6 w-6" />
        </Button>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="absolute top-full left-0 right-0 bg-[#1a1a1a] md:hidden border-t border-gray-700">
            {/* The main navigation items are now exposed as icons in the header for mobile. */}
            <div className="flex flex-col p-4 space-y-2">
              {session && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsPlatformModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-1 text-white bg-[#1a1a1a] border-gray-700 hover:text-[#E50914] hover:border-[#E50914] hover:bg-[#2a2a2a] justify-start"
                  aria-label="Manage Platforms"
                >
                  <Monitor className="h-4 w-4" />
                  <span>Platforms</span>
                </Button>
              )}
              {session && (
                <Button asChild variant="outline" size="sm" className="w-full flex items-center gap-1 text-white bg-[#1a1a1a] border-gray-700 hover:text-[#E50914] hover:border-[#E50914] hover:bg-[#2a2a2a] justify-start">
                  <Link href="/settings" onClick={() => setIsMenuOpen(false)}>
                    <SettingsIcon className="h-4 w-4" /><span>Settings</span>
                  </Link>
                </Button>
              )}
              {(loading && !session) || isSigningIn ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="flex items-center gap-1 text-white bg-[#1a1a1a] border-gray-700 justify-start"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing In...</span>
                </Button>
              ) : !session ? ( // Corrected: Ensure this is the alternative when not loading/signing in AND no session
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { handleSignIn(); setIsMenuOpen(false); }}
                  className="flex items-center gap-1 text-white bg-[#1a1a1a] border-gray-700 hover:text-[#E50914] hover:border-[#E50914] hover:bg-[#2a2a2a] justify-start"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Button>
              ) : null }
              {!loading && session && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    signOut({ redirect: false }).then(() => {
                      router.push('/'); // Redirect to landing page
                    });
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-1 text-white bg-[#1a1a1a] border-gray-700 hover:text-[#E50914] hover:border-[#E50914] hover:bg-[#2a2a2a] justify-start"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out ({session.user.name ? session.user.name.split(' ')[0] : session.user.email.split('@')[0]})</span>
                </Button>
              )}
            </div>
          </nav>
        )}

        {/* Only render PlatformManagementModal if a user is signed in, 
            as the API for platforms requires authentication.
            The modal itself will use the session for API calls.
        */}
        {session && (
          <PlatformManagementModal
            isOpen={isPlatformModalOpen}
            onClose={() => setIsPlatformModalOpen(false)}
            // userId prop is no longer needed here as the API is session-aware
          />
        )}
      </div>
    </header>
  );
}
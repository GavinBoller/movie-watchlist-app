'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, List, Film, Monitor, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import PlatformManagementModal from './PlatformManagementModal';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const userId = 1; // Temporary; replace with auth logic
  const pathname = usePathname();
  const activeTab = pathname === '/' ? 'search' : pathname === '/watchlist' ? 'my watchlist' : 'search';

  const navItems = [
    { name: 'Search', href: '/', icon: Search },
    { name: 'My Watchlist', href: '/watchlist', icon: List },
  ];

  return (
    <header className="bg-[#1a1a1a] text-white sticky top-0 z-50 border-b border-gray-700">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Film className="h-6 w-6 text-[#E50914] mr-2" />
          <h1 className="text-xl sm:text-2xl font-bold text-[#E50914] tracking-tight">Watchlist</h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8 justify-center flex-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-1 transition-colors ${
                activeTab === item.name.toLowerCase()
                  ? 'text-[#E50914]'
                  : 'text-white hover:text-[#E50914]'
              }`}
            >
              <item.icon
                className={`h-5 w-5 mr-2 ${
                  activeTab === item.name.toLowerCase() ? 'text-[#E50914]' : 'text-white'
                }`}
              />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlatformModalOpen(true)}
            className="flex items-center gap-1 text-white bg-[#1a1a1a] border-gray-700 hover:text-[#E50914] hover:border-[#E50914] hover:bg-[#2a2a2a]"
            aria-label="Manage Platforms"
          >
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Platforms</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-white bg-[#1a1a1a] border-gray-700 hover:text-[#E50914] hover:border-[#E50914] hover:bg-[#2a2a2a]"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">User</span>
          </Button>
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
            <ul className="grid grid-cols-2 gap-1 p-1">
              {navItems.map((item) => (
                <li key={item.name} className="w-full">
                  <Link
                    href={item.href}
                    className={`flex items-center p-2 rounded-lg transition-colors ${
                      activeTab === item.name.toLowerCase()
                        ? 'bg-gray-800 text-[#E50914]'
                        : 'text-white hover:bg-gray-800 hover:text-[#E50914]'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon
                      className={`h-4 w-4 mr-2 ${
                        activeTab === item.name.toLowerCase() ? 'text-[#E50914]' : 'text-white'
                      }`}
                    />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-col p-4 space-y-2">
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
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-white bg-[#1a1a1a] border-gray-700 hover:text-[#E50914] hover:border-[#E50914] hover:bg-[#2a2a2a] justify-start"
              >
                <User className="h-4 w-4" />
                <span>User</span>
              </Button>
            </div>
          </nav>
        )}

        <PlatformManagementModal
          isOpen={isPlatformModalOpen}
          onClose={() => setIsPlatformModalOpen(false)}
          userId={userId}
        />
      </div>
    </header>
  );
}
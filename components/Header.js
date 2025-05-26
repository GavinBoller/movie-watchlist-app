import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Film, Search, List, Monitor, User } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Search', icon: Search, tab: 'search' },
  { href: '/watchlist', label: 'My Watchlist', icon: List, tab: 'watchlist' },
];

function NavLinks({ activeTab, orientation = 'horizontal', className = '' }) {
  return (
    <ul
      className={
        orientation === 'horizontal'
          ? `flex space-x-8 ${className}`
          : `grid grid-cols-2 gap-1 ${className}`
      }
    >
      {navItems.map((item) => (
        <li key={item.tab} className={orientation === 'horizontal' ? '' : 'w-full'}>
          <Link href={item.href} passHref legacyBehavior>
            <a
              className={
                orientation === 'horizontal'
                  ? `flex items-center text-white hover:text-[#E50914] transition-colors ${activeTab === item.tab ? 'text-[#E50914] underline' : ''}`
                  : `w-full flex items-center justify-center px-4 py-2 rounded-lg ${activeTab === item.tab ? 'bg-gray-700 text-[#E50914]' : 'text-white hover:bg-gray-700 hover:text-[#E50914] transition-colors'}`
              }
              aria-current={activeTab === item.tab ? 'page' : undefined}
            >
              <item.icon
                className={
                  orientation === 'horizontal'
                    ? `h-5 w-5 mr-2 ${activeTab === item.tab ? 'text-[#E50914]' : 'text-white'}`
                    : `h-4 w-4 mr-2 ${activeTab === item.tab ? 'text-[#E50914]' : 'text-white'}`
                }
              />
              <span>{item.label}</span>
            </a>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Header() {
  const router = useRouter();
  const activeTab =
    router.pathname === '/'
      ? 'search'
      : router.pathname === '/watchlist'
      ? 'watchlist'
      : '';
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);

  return (
    <header className="bg-black text-white shadow-md">
      <div className="container mx-auto p-4">
        {/* Desktop: Single Row for Logo, Nav, and Buttons */}
        <div className="hidden sm:flex sm:items-center sm:justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" passHref legacyBehavior>
              <a className="flex items-center" aria-label="Home">
                <Film className="h-6 w-6 text-[#E50914] mr-2" />
                <span className="text-xl sm:text-2xl font-bold text-[#E50914] tracking-tight">
                  Watchlist
                </span>
              </a>
            </Link>
          </div>

          {/* Navigation (Centered) */}
          <div className="flex-grow flex justify-center">
            <nav>
              <NavLinks activeTab={activeTab} orientation="horizontal" />
            </nav>
          </div>

          {/* Platforms and User Buttons */}
          <div className="flex gap-3">
            <button
              className="flex items-center gap-1 bg-black hover:bg-gray-800 text-white text-sm px-3 py-1 rounded transition-colors"
              onClick={() => setIsPlatformModalOpen(true)}
              aria-label="Manage Platforms"
            >
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Platforms</span>
            </button>
            <button
              className="flex items-center gap-1 bg-gray-700 text-white text-sm px-3 py-1 rounded opacity-50 cursor-not-allowed"
              disabled
              aria-label="User Profile (Not Implemented)"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">User</span>
            </button>
          </div>
        </div>

        {/* Mobile: Stacked Layout */}
        <div className="sm:hidden">
          {/* Logo */}
          <div className="flex items-center justify-center mb-4">
            <Link href="/" passHref legacyBehavior>
              <a className="flex items-center" aria-label="Home">
                <Film className="h-6 w-6 text-[#E50914] mr-2" />
                <span className="text-xl font-bold text-[#E50914] tracking-tight">
                  Watchlist
                </span>
              </a>
            </Link>
          </div>

          {/* Mobile Navigation */}
          <nav className="mb-4">
            <NavLinks
              activeTab={activeTab}
              orientation="vertical"
              className="bg-[#1a1a1a] rounded-lg p-1"
            />
          </nav>

          {/* Mobile Platforms and User Buttons */}
          <div className="flex justify-center gap-3">
            <button
              className="flex items-center p-2 h-8 bg-black hover:bg-gray-800 text-white rounded transition-colors"
              onClick={() => setIsPlatformModalOpen(true)}
              aria-label="Manage Platforms"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              className="flex items-center p-2 h-8 bg-gray-700 text-white rounded opacity-50 cursor-not-allowed"
              disabled
              aria-label="User Profile (Not Implemented)"
            >
              <User className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

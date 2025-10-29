"use client";
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface NavigationProps {
  user?: User;
  onSignOut?: () => void;
}

export function Navigation({ user, onSignOut }: NavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/trades', label: 'Trades', icon: '🔥' },
    { href: '/accounts', label: 'Accounts', icon: '👤' },
  ];

  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo-symbol.png"
              alt="Cripto Manager"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <div>
              <h1 className="text-white font-semibold">Cripto Manager</h1>
              <p className="text-xs text-slate-400">Trading Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Hamburger Button - Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden text-white p-2"
              aria-label="Toggle menu"
            >
              <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'bg-white/10 text-white hover:bg-white/15'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            {user && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-white truncate max-w-[120px] sm:max-w-none">{user.name || user.email}</p>
                  <p className="text-[10px] sm:text-xs text-slate-400">Online</p>
                </div>
                       {user.image ? (
                         <Image
                           src={user.image}
                           alt="User"
                           width={28}
                           height={28}
                           className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                         />
                       ) : (
                 <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs sm:text-sm font-semibold">
                      {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
                <button
                  onClick={onSignOut}
                  className="text-slate-400 hover:text-white transition-colors text-lg sm:text-base"
                  title="Sair"
                >
                  🚪
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {user && (
                <div className="border-t border-white/10 pt-3 mt-2">
                  <button
                    onClick={() => {
                      if (onSignOut) onSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-4 py-3 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-white/5 w-full"
                  >
                    <span className="text-xl">🚪</span>
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

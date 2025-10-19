"use client";
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

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

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/trades', label: 'Trades', icon: '🔥' },
    { href: '/accounts', label: 'Accounts', icon: '👤' },
  ];

  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
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
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-2">
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
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-white">{user.name || user.email}</p>
                  <p className="text-xs text-slate-400">Online</p>
                </div>
                       {user.image ? (
                         <Image
                           src={user.image}
                           alt="User"
                           width={32}
                           height={32}
                           className="w-8 h-8 rounded-full"
                         />
                       ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
                <button
                  onClick={onSignOut}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Sair"
                >
                  🚪
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

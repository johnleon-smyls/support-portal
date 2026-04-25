'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Ticket,
  BookOpen,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface SidebarProps {
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const navigationItems = [
    {
      name: 'Tickets',
      href: '/dashboard',
      icon: Ticket,
      current: pathname === '/dashboard'
    },
    {
      name: 'Knowledge Base',
      href: '/knowledge-base',
      icon: BookOpen,
      current: pathname.startsWith('/knowledge-base')
    }
  ];

  return (
    <div className="flex flex-col h-screen w-[242px] bg-zinc-100 border-r border-zinc-200">
      {/* Profile and Navigation */}
      <div className="flex flex-col p-2 space-y-2">
        {/* Profile Section */}
        <div className="flex items-center gap-2 p-2 rounded-lg">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-smyls-blue-500 to-smyls-green-500">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate text-foreground">
              SMYLS Support
            </div>
            <div className="text-sm truncate text-muted-foreground">
              {user?.full_name || user?.email || 'User'}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                    item.current
                      ? 'bg-white shadow-sm'
                      : 'hover:bg-white/50'
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${item.current ? '' : 'text-muted-foreground'}`}
                    {...(item.current && { style: { stroke: 'url(#gradient-active)' } })}
                  />
                  <span className={`text-sm ${item.current ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Logout Button */}
      <div className="p-2">
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full justify-start gap-2 bg-white border-zinc-200"
        >
          <LogOut
            className="h-6 w-6"
            style={{ stroke: 'url(#gradient-logout)' }}
          />
          <span className="text-muted-foreground">Log Out</span>
        </Button>
      </div>

      {/* SVG Gradients */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="gradient-active" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00AEEF" />
            <stop offset="100%" stopColor="#2ABDAD" />
          </linearGradient>
          <linearGradient id="gradient-logout" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00AEEF" />
            <stop offset="100%" stopColor="#2ABDAD" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

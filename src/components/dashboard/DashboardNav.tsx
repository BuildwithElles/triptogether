'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  HomeIcon, 
  MapIcon, 
  UserIcon, 
  CogIcon, 
  LogOutIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

interface DashboardNavProps {
  isMobile?: boolean;
}

export function DashboardNav({ isMobile = false }: DashboardNavProps) {
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      current: pathname === '/dashboard',
    },
    {
      name: 'My Trips',
      href: '/trips',
      icon: MapIcon,
      current: pathname?.startsWith('/trips'),
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserIcon,
      current: pathname === '/profile',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: CogIcon,
      current: pathname === '/settings',
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isMobile) {
    return (
      <nav className="bg-white border-t border-gray-200 fixed bottom-0 inset-x-0 z-50 safe-area-pb">
        <div className="grid grid-cols-5 h-16 max-w-screen-sm mx-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center text-xs px-1 py-2 transition-colors',
                  'touch-manipulation min-h-[44px]', // Touch-friendly minimum size
                  item.current
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 active:bg-gray-50'
                )}
              >
                <Icon className="h-5 w-5 mb-1 flex-shrink-0" />
                <span className="truncate leading-tight">{item.name}</span>
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className={cn(
              'flex flex-col items-center justify-center text-xs px-1 py-2 transition-colors',
              'touch-manipulation min-h-[44px]', // Touch-friendly minimum size
              'text-gray-600 hover:text-red-600 active:bg-red-50'
            )}
          >
            <LogOutIcon className="h-5 w-5 mb-1 flex-shrink-0" />
            <span className="truncate leading-tight">Logout</span>
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex-1 px-2 pb-4 space-y-1">
      {/* User Info */}
      <div className="px-3 py-4 mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.user_metadata?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">
              {user?.user_metadata?.name || 'User'}
            </p>
            <p className="text-xs font-medium text-gray-500">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors',
              'touch-manipulation min-h-[44px]', // Touch-friendly minimum size
              item.current
                ? 'bg-blue-100 text-blue-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
            )}
          >
            <Icon
              className={cn(
                'mr-3 flex-shrink-0 h-5 w-5',
                item.current
                  ? 'text-blue-500'
                  : 'text-gray-400 group-hover:text-gray-500'
              )}
            />
            {item.name}
          </Link>
        );
      })}

      {/* Sign Out */}
      <div className="pt-4 mt-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className={cn(
            'group flex items-center w-full px-3 py-3 text-sm font-medium rounded-md transition-colors',
            'touch-manipulation min-h-[44px]', // Touch-friendly minimum size
            'text-gray-600 hover:bg-red-50 hover:text-red-600 active:bg-red-100'
          )}
        >
          <LogOutIcon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-red-500" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, isAgent, logout } = useAuth();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
    // Redirect agents to admin
    if (hasHydrated && isAuthenticated && isAgent) {
      router.push('/admin');
    }
  }, [isAuthenticated, hasHydrated, isAgent, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!hasHydrated) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

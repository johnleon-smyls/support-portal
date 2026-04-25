'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, isAgent, isAdmin, logout } = useAuth();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
    // Redirect non-agents to customer dashboard
    if (hasHydrated && isAuthenticated && !isAgent && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, hasHydrated, isAgent, isAdmin, router]);

  if (!hasHydrated) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  if (!isAuthenticated || !user || (!isAgent && !isAdmin)) {
    return null;
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <aside className="w-60 border-r border-border flex flex-col bg-sidebar">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-base text-foreground">Admin Portal</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{user?.full_name}</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent text-sidebar-foreground">
            Dashboard
          </Link>
          <Link href="/admin/tickets" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent text-sidebar-foreground">
            Tickets
          </Link>
        </nav>
        <div className="p-2 border-t border-border">
          <button
            onClick={async () => { await logout(); router.push('/login'); }}
            className="w-full text-left text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-sidebar-accent"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

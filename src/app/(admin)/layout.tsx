'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
      {/* Admin sidebar will be added in Phase 3 */}
      <aside className="w-60 border-r border-gray-200 flex flex-col p-4">
        <h2 className="font-semibold text-lg mb-6">Admin Portal</h2>
        <nav className="space-y-1 flex-1">
          <a href="/admin" className="block px-3 py-2 rounded-md text-sm hover:bg-gray-100">
            Dashboard
          </a>
          <a href="/admin/tickets" className="block px-3 py-2 rounded-md text-sm hover:bg-gray-100">
            Tickets
          </a>
        </nav>
        <button
          onClick={async () => { await logout(); router.push('/login'); }}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

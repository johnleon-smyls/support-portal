'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, isLoading, hasHydrated, isAgent } = useAuth();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Wait for hydration and auth check to complete
    if (hasHydrated && !isLoading && !hasChecked) {
      setHasChecked(true);
      if (isAuthenticated) {
        router.push(isAgent ? '/admin' : '/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, hasHydrated, isAgent, router, hasChecked]);

  // Show loading spinner while checking authentication
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading Support Portal...</p>
      </div>
    </div>
  );
}
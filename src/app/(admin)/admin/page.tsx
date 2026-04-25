'use client';

import { useAuth } from '@/lib/auth';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-gray-600">
        Welcome, {user?.full_name}. Ticket management and admin features coming in Phase 3.
      </p>
    </div>
  );
}

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import { SocketProvider } from '@/context/SocketContext';
import Spinner from '@/components/Spinner';

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
      <Spinner size="lg" />
    </div>
  );

  return (
    <SocketProvider>
      <div className="flex min-h-screen bg-[#0a1628]">
        <AdminSidebar />
        <main className="flex-1 overflow-hidden pt-12 lg:pt-0 min-w-0 overflow-y-auto">{children}</main>
      </div>
    </SocketProvider>
  );
}

'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import { SocketProvider } from '@/context/SocketContext';
import Spinner from '@/components/Spinner';

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isFootball = pathname?.startsWith('/admin/football');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) return (
    <div className={`min-h-screen flex items-center justify-center ${isFootball ? 'bg-[#040e0a]' : 'bg-[#0a1628]'}`}>
      <Spinner size="lg" />
    </div>
  );

  return (
    <SocketProvider>
      <div className={`flex min-h-screen ${isFootball ? 'bg-[#040e0a]' : 'bg-[#0a1628]'}`}>
        <AdminSidebar />
        <main className={`flex-1 overflow-hidden pt-12 lg:pt-0 min-w-0 overflow-y-auto ${isFootball ? 'bg-[#040e0a] text-emerald-50' : 'bg-[#0a1628] text-white'}`}>
          {children}
        </main>
      </div>
    </SocketProvider>
  );
}

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import Spinner from '@/components/Spinner';

export default function CaptainLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'captain')) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f6f0]">
      <Spinner size="lg" />
    </div>
  );

  return (
    <SocketProvider>
      <div className="min-h-screen bg-[#f8f6f0] text-[#111827]">
        {children}
      </div>
    </SocketProvider>
  );
}

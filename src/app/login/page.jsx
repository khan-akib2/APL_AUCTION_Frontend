'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import Image from 'next/image';
import Spinner from '@/components/Spinner';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error || 'Login failed', 'error'); return; }
      login(data.token, data.user);
      router.push(data.user.role === 'admin' ? '/admin' : '/captain');
    } catch {
      toast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col lg:flex-row">

      {/* Left branding panel — desktop only */}
      <div className="hidden lg:flex flex-col w-[45%] bg-[#0d1e3a] border-r border-[#c9a227]/20 p-10 relative overflow-hidden">
        <Image src="/APL.png" alt="" fill priority loading="eager" sizes="45vw"
          className="object-cover opacity-15 pointer-events-none" />
        <div className="absolute inset-0 bg-[#0d1e3a]/50 pointer-events-none" />

        {/* Top */}
        <div className="relative flex items-center gap-3 mb-auto">
          <Logo size="md" className="rounded-xl" />
          <div>
            <div className="text-[#c9a227] font-bold tracking-widest text-sm uppercase">APL Sports Auction</div>
            <div className="text-white/40 text-xs">Alliance Premiere League</div>
          </div>
        </div>

        {/* Center */}
        <div className="relative my-auto">
          <div className="text-[#c9a227] text-5xl font-black uppercase leading-tight tracking-tight mb-4">
            LIVE<br/>AUCTION
          </div>
          <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-xs">
            Real-time player bidding for APL&apos;s Alliance Premiere League championship.
          </p>
          <div className="flex gap-6">
            {[['8','Teams'],['48','Players'],['500','Points']].map(([val, label]) => (
              <div key={label}>
                <div className="text-[#c9a227] text-2xl font-bold">{val}</div>
                <div className="text-white/30 text-xs uppercase tracking-wider mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative mt-auto">
          <a href="/audience" className="inline-flex items-center gap-2 text-[#c9a227]/40 hover:text-[#c9a227] text-sm transition-colors">
            Watch live →
          </a>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        {/* Background image — mobile only */}
        <div className="lg:hidden absolute inset-0 pointer-events-none">
          <Image src="/APL.png" alt="" fill sizes="100vw"
            className="w-full h-full object-cover opacity-[0.07]" />
          <div className="absolute inset-0 bg-[#0a1628]/75" />
        </div>

        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-8 relative z-10">
          <Logo size="lg" className="rounded-2xl mb-3" />
          <div className="text-white font-bold text-lg">APL Sports Auction</div>
          <div className="text-white/30 text-xs mt-0.5">Alliance Premiere League</div>
        </div>

        <div className="w-full max-w-sm relative z-10">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-white">Sign in</h2>
            <p className="text-white/30 text-sm mt-1">Enter your credentials to continue</p>          </div>

          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            <div>
              <label className="block text-xs font-semibold text-[#c9a227]/60 uppercase tracking-widest mb-2">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="admin@nit.com" suppressHydrationWarning
                className="w-full bg-[#0d1e3a] border border-[#c9a227]/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/15 focus:outline-none focus:border-[#c9a227]/50 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#c9a227]/60 uppercase tracking-widest mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••" suppressHydrationWarning
                className="w-full bg-[#0d1e3a] border border-[#c9a227]/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/15 focus:outline-none focus:border-[#c9a227]/50 transition-colors" />
            </div>
            <button type="submit" disabled={loading} suppressHydrationWarning
              className="w-full bg-[#c9a227] hover:bg-[#f0c040] text-[#0a1628] font-bold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2 mt-1">
              {loading ? <Spinner size="sm" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#c9a227]/10">
            <div className="text-center">
              <a href="/audience" className="text-[#c9a227]/30 hover:text-[#c9a227] text-xs transition-colors">
                Watch live auction →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

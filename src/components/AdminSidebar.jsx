'use client';
import Logo from '@/components/Logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/auction', label: 'Auction Control' },
  { href: '/admin/players', label: 'Players' },
  { href: '/admin/teams', label: 'Teams' },
  { href: '/admin/log', label: 'Auction Log' },
  { href: '/admin/summary', label: 'Final Summary' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0d1e3a] border-b border-[#c9a227]/20 flex items-center justify-between px-4 h-12">        <div className="flex items-center gap-2">
          <Logo size="sm" className="rounded-xl" />
          <span className="text-[#c9a227] font-bold tracking-widest text-xs uppercase">APL Auction</span>
        </div>
        <button onClick={() => setOpen(!open)} aria-label="Open navigation menu" className="text-[#c9a227]/60 hover:text-[#c9a227] transition-colors p-1">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {open && <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      <aside className={`
        fixed lg:sticky lg:top-0 top-0 left-0 h-screen z-50 w-64 bg-[#0d1e3a] border-r border-[#c9a227]/20 flex flex-col
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="px-5 h-14 flex items-center justify-between border-b border-[#c9a227]/20">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" className="rounded-xl" />
            <div>
              <div className="text-[#c9a227] font-bold text-xs tracking-widest uppercase">APL Auction</div>
              <div className="text-[#c9a227]/30 text-[10px] tracking-widest uppercase">Admin Panel</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close navigation menu" className="lg:hidden text-[#c9a227]/30 hover:text-[#c9a227] transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[#c9a227]/25 text-[10px] uppercase tracking-widest px-3 pb-2">Navigation</p>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-all ${
                pathname === item.href
                  ? 'bg-[#c9a227]/15 text-[#c9a227] font-semibold border border-[#c9a227]/20'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-[#c9a227]/10 space-y-0.5">
          <a href="/audience" target="_blank"
            className="flex items-center px-3 py-2.5 rounded-lg text-sm text-[#c9a227]/30 hover:text-[#c9a227]/70 hover:bg-white/5 transition-colors">
            Audience View ↗
          </a>
          <button onClick={handleLogout}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors">
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

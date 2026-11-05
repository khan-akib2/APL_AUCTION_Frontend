'use client';
import Logo from '@/components/Logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CricketIcon, FootballIcon } from '@/components/SportIcons';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isFootball = pathname?.startsWith('/admin/football');
  const basePath = isFootball ? '/admin/football' : '/admin';

  const navItems = [
    { href: basePath, label: 'Dashboard' },
    { href: `${basePath}/auction`, label: 'Auction Control' },
    { href: `${basePath}/players`, label: 'Players' },
    { href: `${basePath}/teams`, label: 'Teams' },
    { href: `${basePath}/log`, label: 'Auction Log' },
    { href: `${basePath}/summary`, label: 'Final Summary' },
  ];

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <>
      {/* Mobile top bar */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-50 border-b flex items-center justify-between px-4 h-12 ${
        isFootball ? 'bg-[#071912] border-emerald-500/25' : 'bg-[#0d1e3a] border-[#c9a227]/20'
      }`}>
        <div className="flex items-center gap-2">
          <Logo size="sm" className="rounded-xl" />
          <span className={`font-bold tracking-widest text-xs uppercase ${isFootball ? 'text-emerald-400' : 'text-[#c9a227]'}`}>
            APL {isFootball ? 'Football' : 'Cricket'}
          </span>
        </div>
        <button onClick={() => setOpen(!open)} aria-label="Open navigation menu" className={`transition-colors p-1 ${isFootball ? 'text-emerald-400/70 hover:text-emerald-400' : 'text-[#c9a227]/60 hover:text-[#c9a227]'}`}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {open && <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      <aside className={`
        fixed lg:sticky lg:top-0 top-0 left-0 h-screen z-50 w-64 border-r flex flex-col
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isFootball ? 'bg-[#061811] border-emerald-500/20' : 'bg-[#0d1e3a] border-[#c9a227]/20'}
      `}>
        {/* Logo */}
        <div className={`px-5 h-14 flex items-center justify-between border-b shrink-0 ${
          isFootball ? 'border-emerald-500/20' : 'border-[#c9a227]/20'
        }`}>
          <div className="flex items-center gap-2.5">
            <Logo size="sm" className="rounded-xl" />
            <div>
              <div className={`font-bold text-xs tracking-widest uppercase ${isFootball ? 'text-emerald-400' : 'text-[#c9a227]'}`}>
                APL Auction
              </div>
              <div className="text-[10px] tracking-wider uppercase font-semibold flex items-center gap-1.5 mt-0.5">
                {isFootball ? (
                  <>
                    <FootballIcon className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400/80 font-bold">Football Admin</span>
                  </>
                ) : (
                  <>
                    <CricketIcon className="w-3 h-3 text-[#c9a227]" />
                    <span className="text-[#c9a227]/70 font-semibold">Cricket Admin</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close navigation menu" className="lg:hidden text-white/40 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Sport Switcher */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="grid grid-cols-2 bg-black/40 p-1 rounded-xl border border-white/10">
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isFootball
                  ? 'bg-[#c9a227] text-[#0a1628] shadow'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <CricketIcon className="w-3.5 h-3.5" />
              <span>Cricket</span>
            </Link>
            <Link
              href="/admin/football"
              onClick={() => setOpen(false)}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isFootball
                  ? 'bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <FootballIcon className="w-3.5 h-3.5" />
              <span>Football</span>
            </Link>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <p className={`text-[10px] uppercase tracking-widest px-3 pb-2 ${isFootball ? 'text-emerald-400/30' : 'text-[#c9a227]/25'}`}>
            Navigation
          </p>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-all ${
                pathname === item.href
                  ? (isFootball
                      ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 shadow-sm'
                      : 'bg-[#c9a227]/15 text-[#c9a227] font-semibold border border-[#c9a227]/20')
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer actions */}
        <div className={`px-3 py-3 border-t space-y-0.5 shrink-0 ${isFootball ? 'border-emerald-500/15' : 'border-[#c9a227]/10'}`}>
          <a
            href={isFootball ? '/audience/football' : '/audience'}
            target="_blank"
            className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isFootball ? 'text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-500/10' : 'text-[#c9a227]/40 hover:text-[#c9a227] hover:bg-white/5'
            }`}>
            {isFootball ? 'Football Audience View ↗' : 'Cricket Audience View ↗'}
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

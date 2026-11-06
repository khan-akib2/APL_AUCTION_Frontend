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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#e8e2d5] flex items-center justify-between px-4 h-12 shadow-sm">
        <div className="flex items-center gap-2">
          <Logo size="sm" className="rounded-xl" />
          <span className="font-bold tracking-widest text-xs uppercase text-[#0d3a24]">
            APL {isFootball ? 'Football' : 'Cricket'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
            className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 active:scale-95 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Open navigation menu"
            className="text-[#4b5563] hover:text-[#111827] transition-colors p-1"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:sticky lg:top-0 top-0 left-0 h-dvh max-h-dvh z-50 w-64 border-r border-[#e8e2d5] bg-white flex flex-col
        transition-transform duration-200 shadow-sm
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo Banner */}
        <div className="px-5 h-16 flex items-center justify-between border-b border-[#e8e2d5] shrink-0 bg-[#faf8f5]">
          <div className="flex items-center gap-3">
            <Logo size="sm" className="rounded-xl" />
            <div>
              <div className="font-serif font-bold text-sm tracking-wide text-[#0d3a24]">
                APL Auction
              </div>
              <div className="text-[10px] tracking-wider uppercase font-semibold flex items-center gap-1.5 mt-0.5">
                {isFootball ? (
                  <>
                    <FootballIcon className="w-3 h-3 text-[#0d3a24]" />
                    <span className="text-[#0d3a24] font-bold">Football Admin</span>
                  </>
                ) : (
                  <>
                    <CricketIcon className="w-3 h-3 text-[#c59b27]" />
                    <span className="text-[#c59b27] font-bold">Cricket Admin</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="lg:hidden text-[#6b7280] hover:text-[#111827] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Sport Switcher Segmented Control */}
        <div className="px-3 pt-3.5 pb-2 shrink-0">
          <div className="grid grid-cols-2 bg-[#f4efe6] p-1 rounded-xl border border-[#e8e2d5]">
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isFootball
                  ? 'bg-[#0d3a24] text-white shadow-sm'
                  : 'text-[#4b5563] hover:text-[#111827]'
              }`}
            >
              <CricketIcon className="w-3.5 h-3.5" />
              <span>Cricket</span>
            </Link>
            <Link
              href="/admin/football"
              onClick={() => setOpen(false)}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isFootball
                  ? 'bg-[#0d3a24] text-white shadow-sm'
                  : 'text-[#4b5563] hover:text-[#111827]'
              }`}
            >
              <FootballIcon className="w-3.5 h-3.5" />
              <span>Football</span>
            </Link>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 min-h-0 px-3 py-2 space-y-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest px-3 pb-1 text-[#9ca3af] font-semibold">
            Navigation
          </p>
          {navItems.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center px-3.5 py-2 rounded-xl text-sm transition-all ${
                  active
                    ? 'bg-[#0d3a24]/10 text-[#0d3a24] font-bold border border-[#0d3a24]/20 shadow-sm'
                    : 'text-[#4b5563] hover:text-[#111827] hover:bg-[#f4efe6]/70 font-medium'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="px-3 pt-3 pb-6 sm:pb-3 border-t border-[#e8e2d5] space-y-1.5 shrink-0 bg-[#faf8f5]">
          <a
            href={isFootball ? '/audience/football' : '/audience'}
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-[#c59b27] hover:text-[#916922] hover:bg-amber-50/70 transition-colors"
          >
            <span>{isFootball ? 'Football Broadcast' : 'Cricket Broadcast'}</span>
            <span className="text-sm">↗</span>
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50/80 transition-colors active:scale-98 cursor-pointer border border-transparent hover:border-red-200"
          >
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

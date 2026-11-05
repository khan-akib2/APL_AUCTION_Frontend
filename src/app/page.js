'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function scrollTo(href) {
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
}

function Navbar({ scrolled }) {
  const [open, setOpen] = useState(false);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#e8e2d5]'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
            <Image src="/APL.png" alt="APL" fill className="object-contain" priority />
          </div>
          <div>
            <span className="text-[#0d3a24] font-black text-sm uppercase tracking-wider block leading-none">APL Auction</span>
            <span className="text-[#c59b27] text-[10px] uppercase font-bold tracking-wider">Season 8</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          {[
            { label: 'Home', href: '#hero' },
            { label: 'Live Auction', href: '#live-auction' },
            { label: 'Features', href: '#features' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Stats', href: '#stats' },
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
              onClick={e => { e.preventDefault(); scrollTo(item.href); }}
              className="text-[#4b5563] hover:text-[#0d3a24] text-sm font-semibold transition-colors relative group cursor-pointer"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0d3a24] group-hover:w-full transition-all duration-200" />
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/audience"
            className="hidden sm:flex items-center gap-1.5 text-[#0d3a24] hover:text-[#0d3a24] text-xs font-bold transition-all bg-[#f4efe6] border border-[#e8e2d5] hover:border-[#0d3a24] px-3.5 py-2 rounded-xl shadow-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Watch Live
          </Link>
          <Link
            href="/login"
            className="bg-[#0d3a24] hover:bg-[#154d32] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            Sign In
          </Link>
          {/* Mobile menu trigger */}
          <button
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="lg:hidden ml-1 p-2 text-[#4b5563] hover:text-[#0d3a24] transition-colors"
          >
            {open ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden bg-white border-t border-[#e8e2d5] px-5 py-4 space-y-2 shadow-lg">
          {[
            { label: 'Home', href: '#hero' },
            { label: 'Live Auction', href: '#live-auction' },
            { label: 'Features', href: '#features' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Stats', href: '#stats' },
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
              onClick={e => { e.preventDefault(); scrollTo(item.href); setOpen(false); }}
              className="block text-[#4b5563] hover:text-[#0d3a24] text-sm font-semibold py-1.5 transition-colors"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2 border-t border-[#e8e2d5] flex flex-col gap-2">
            <Link
              href="/audience"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 bg-[#f4efe6] text-[#0d3a24] text-xs font-bold py-2.5 rounded-xl border border-[#e8e2d5]"
            >
              Watch Live Broadcast
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function HeroSection() {
  return (
    <section id="hero" className="relative flex items-center justify-center overflow-hidden py-24 sm:min-h-screen">
      {/* Decorative ambient gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-5 text-center pt-16 pb-10">
        {/* Live badge */}
        <div className="inline-flex items-center gap-2 bg-[#f4efe6] border border-[#e8e2d5] rounded-full px-4 py-1.5 mb-8 shadow-xs">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span className="text-[#0d3a24] text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            Season 8 · APL Sports Auction Portal
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-[80px] font-black text-[#111827] uppercase leading-[0.95] tracking-tight mb-6">
          Experience<br />
          the <span className="text-[#0d3a24]">Ultimate</span><br />
          <span className="text-[#c59b27]">Sports Auction</span>
        </h1>

        <p className="text-[#4b5563] text-base sm:text-lg max-w-lg mx-auto mb-10 leading-relaxed font-medium">
          Bid, compete, and assemble your champion squad in real time across Cricket and Football.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mb-10 max-w-sm sm:max-w-none mx-auto">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 bg-[#0d3a24] hover:bg-[#154d32] text-white font-bold px-7 py-3.5 rounded-xl text-sm sm:text-base transition-all shadow-md active:scale-95"
          >
            Enter Auction Portal →
          </Link>
          <Link
            href="/audience"
            className="flex items-center justify-center gap-2 bg-white hover:bg-[#faf8f5] border border-[#e8e2d5] text-[#0d3a24] font-bold px-7 py-3.5 rounded-xl text-sm sm:text-base transition-all shadow-xs"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            Watch Live
          </Link>
          <Link
            href="/players"
            className="flex items-center justify-center gap-2 text-[#4b5563] hover:text-[#0d3a24] font-semibold px-6 py-3.5 rounded-xl text-sm transition-all"
          >
            View Players →
          </Link>
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
          {['Cricket & Football', 'Real-Time WebSockets', 'Verified Captains', 'Instant Squad Updates'].map((b, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[#6b7280] text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c59b27]" />
              {b}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

function LiveAuctionCard() {
  const [session, setSession] = useState(null);
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    const fetchLive = () => {
      fetch(`${BACKEND_URL}/api/auction/active-public`)
        .then(r => r.json())
        .then(d => {
          if (d.session) {
            setSession(d.session);
            setPlayer(d.session.playerId);
          } else {
            setSession(null);
            setPlayer(null);
          }
        })
        .catch(() => {});
    };
    fetchLive();
    const interval = setInterval(fetchLive, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="live-auction" className="py-16 sm:py-24 px-5">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-[#c59b27] text-xs uppercase tracking-[0.2em] font-bold mb-2">Happening Right Now</p>
          <h2 className="text-2xl sm:text-4xl font-bold font-serif text-[#111827]">Live Auction Floor</h2>
        </div>

        <div className="relative rounded-3xl overflow-hidden bg-white border border-[#e8e2d5] shadow-lg">
          <div className="h-1 bg-gradient-to-r from-[#0d3a24] via-[#c59b27] to-[#0d3a24]" />
          <div className="p-6 sm:p-10">
            <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between sm:gap-10">
              {session && player ? (
                <>
                  <div className="text-center sm:text-left flex-1 w-full">
                    <div className="flex items-center gap-3 justify-center sm:justify-start mb-3">
                      <span className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                        Live
                      </span>
                      <span className="text-[#6b7280] text-xs uppercase tracking-widest font-semibold">{player.skills?.[0]}</span>
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-black text-[#111827] uppercase tracking-tight leading-none mb-2">
                      {player.name}
                    </h3>
                    <p className="text-[#6b7280] text-sm">Currently on the auction block</p>
                  </div>

                  <div className="flex flex-col items-center gap-3 w-full sm:w-auto shrink-0">
                    <div className="bg-[#faf8f5] border border-[#e8e2d5] rounded-2xl px-8 py-5 text-center w-full sm:w-auto shadow-xs">
                      <p className="text-[#6b7280] text-[10px] uppercase tracking-[0.2em] mb-1 font-semibold">Current Bid</p>
                      <p className="text-5xl font-black text-[#0d3a24] tabular-nums leading-none">{session.currentBid}</p>
                      <p className="text-[#c59b27] text-xs mt-1 uppercase font-bold tracking-wider">points</p>
                    </div>
                    {session.currentHighestBidderName && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-2 text-center w-full">
                        <p className="text-[#c59b27] text-[10px] uppercase tracking-wider font-bold mb-0.5">Leading Team</p>
                        <p className="text-[#111827] font-bold text-sm">{session.currentHighestBidderName}</p>
                      </div>
                    )}
                    <Link
                      href="/audience"
                      className="w-full flex items-center justify-center gap-2 bg-[#0d3a24] text-white hover:bg-[#154d32] text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c59b27] animate-pulse" />
                      Watch Full Arena
                    </Link>
                  </div>
                </>
              ) : (
                <div className="w-full text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-[#f4efe6] border border-[#e8e2d5] text-[#0d3a24] mx-auto mb-4 flex items-center justify-center font-bold text-xl">
                    APL
                  </div>
                  <p className="text-[#111827] text-lg font-bold mb-1">Floor is Currently on Standby</p>
                  <p className="text-[#6b7280] text-sm mb-6">The next player nomination will appear here automatically.</p>
                  <Link
                    href="/audience"
                    className="inline-flex items-center gap-2 bg-[#f4efe6] hover:bg-[#eae3d5] text-[#0d3a24] border border-[#e8e2d5] text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    Open Audience Arena
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: 'Real-Time Bidding',
      desc: 'Instant bid updates via WebSockets. Every point placed reflects across all panels in milliseconds.',
      icon: (
        <svg className="w-6 h-6 text-[#0d3a24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: 'Squad & Purse Control',
      desc: 'Captains manage their budget points strategically, tracking remaining balance and squad limits.',
      icon: (
        <svg className="w-6 h-6 text-[#0d3a24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: 'Cricket & Football Panels',
      desc: 'Distinct administration interfaces and isolated rooms for both sports without mixing records.',
      icon: (
        <svg className="w-6 h-6 text-[#0d3a24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: 'Transparent Logs & Audit',
      desc: 'Full audit history of every bid placed, nomination, sold event, and point deduction.',
      icon: (
        <svg className="w-6 h-6 text-[#0d3a24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#c59b27] text-xs uppercase tracking-[0.2em] font-bold mb-2">Platform Capabilities</p>
          <h2 className="text-2xl sm:text-4xl font-bold font-serif text-[#111827] mb-3">Engineered for High Stakes</h2>
          <p className="text-[#6b7280] max-w-md mx-auto text-sm leading-relaxed">
            Everything your tournament needs for a professional and seamless auction.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white border border-[#e8e2d5] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-[#f4efe6] rounded-2xl border border-[#e8e2d5] mb-4">
                {f.icon}
              </div>
              <h3 className="text-[#111827] font-bold text-base mb-2">{f.title}</h3>
              <p className="text-[#6b7280] text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { title: 'Sign In as Captain', desc: 'Securely authenticate with your team captain credentials issued by the administrator.' },
    { title: 'Follow the Nomination', desc: 'Watch players enter the podium with base prices, skills, and player profiles.' },
    { title: 'Bid & Secure Squad', desc: 'Place live point bids with anti-sniping protection to secure your team roster.' },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 px-5 bg-[#faf8f5]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#c59b27] text-xs uppercase tracking-[0.2em] font-bold mb-2">Simple Workflow</p>
          <h2 className="text-2xl sm:text-4xl font-bold font-serif text-[#111827]">How the Auction Operates</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((s, i) => (
            <div key={i} className="bg-white border border-[#e8e2d5] rounded-3xl p-7 text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-[#0d3a24] text-[#c59b27] font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
                0{i + 1}
              </div>
              <h3 className="text-[#111827] font-bold text-base mb-2">{s.title}</h3>
              <p className="text-[#6b7280] text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const stats = [
    { value: useCounter(50, 1500, visible), label: 'Active Players', suffix: '+' },
    { value: useCounter(8, 1200, visible), label: 'Franchises', suffix: '' },
    { value: useCounter(8, 1000, visible), label: 'Tournament Season', suffix: '' },
    { value: useCounter(1000, 2000, visible), label: 'Max Points Purse', suffix: ' pts' },
  ];

  return (
    <section id="stats" ref={ref} className="py-16 sm:py-20 px-5">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-3xl overflow-hidden border border-[#e8e2d5] bg-white shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[#e8e2d5]">
            {stats.map((s, i) => (
              <div key={i} className="p-6 sm:p-8 text-center">
                <p className="text-3xl sm:text-4xl font-black text-[#0d3a24] tabular-nums mb-1">
                  {s.value}{s.suffix}
                </p>
                <p className="text-[#6b7280] text-xs uppercase tracking-wider font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-16 sm:py-20 px-5">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-[#0d3a24] text-white p-8 sm:p-14 text-center shadow-xl">
          <div className="relative z-10">
            <p className="text-[#c59b27] text-xs uppercase tracking-[0.2em] font-bold mb-3">APL Season 8</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif mb-4 leading-tight">
              Ready to Step Into the Auction Room?
            </h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto text-sm leading-relaxed">
              Sign in with your team credentials or tune in to the spectator broadcast.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-xs sm:max-w-none mx-auto">
              <Link
                href="/login"
                className="bg-[#c59b27] hover:bg-[#d8aa2b] text-[#111827] font-bold px-8 py-3.5 rounded-xl text-sm transition-all shadow-md"
              >
                Sign In to Panel →
              </Link>
              <Link
                href="/audience"
                className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all"
              >
                Watch Spectator View
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#e8e2d5] py-8 px-5 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0">
              <Image src="/APL.png" alt="APL" fill className="object-contain" />
            </div>
            <div>
              <span className="text-[#0d3a24] font-bold text-sm uppercase tracking-wide block leading-none">APL Auction</span>
              <span className="text-[#6b7280] text-[10px] uppercase tracking-wider">Alliance Premiere League</span>
            </div>
          </div>
          <div className="flex items-center gap-5 flex-wrap justify-center text-xs font-semibold text-[#4b5563]">
            <Link href="/audience" className="hover:text-[#0d3a24] transition-colors">Spectator Arena</Link>
            <Link href="/audience/football" className="hover:text-[#0d3a24] transition-colors">Football Arena</Link>
            <Link href="/players" className="hover:text-[#0d3a24] transition-colors">Players</Link>
            <Link href="/teams" className="hover:text-[#0d3a24] transition-colors">Teams</Link>
            <Link href="/results" className="hover:text-[#0d3a24] transition-colors">Results</Link>
            <Link href="/login" className="hover:text-[#0d3a24] transition-colors">Login</Link>
          </div>
        </div>
        <div className="border-t border-[#e8e2d5] pt-4 text-center">
          <p className="text-[#9ca3af] text-xs">© 2026 APL Sports Auction Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user?.role === 'admin') router.replace('/admin');
    else if (user?.role === 'captain') router.replace('/captain');
  }, [user, loading, router]);

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 20);
      setShowTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-[#111827]">
      <Navbar scrolled={scrolled} />
      <HeroSection />
      <LiveAuctionCard />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <CTASection />
      <Footer />
      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-[#0d3a24] text-white shadow-lg transition-all duration-300 hover:bg-[#154d32] ${
          showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Back to top"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}

'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Logo from '@/components/Logo';

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

const NAV_LINKS = [
  { label: 'Home', href: '#hero' },
  { label: 'Auction', href: '#live-auction' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Stats', href: '#stats' },
];

function scrollTo(href) {
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
}

function Navbar({ scrolled }) {
  const [open, setOpen] = useState(false);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#060f1e]/95 backdrop-blur-xl shadow-2xl shadow-black/30 border-b border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Logo size="sm" className="rounded-xl w-8 h-8" />
          <div>
            <span className="text-[#c9a227] font-black text-sm uppercase tracking-widest block leading-none whitespace-nowrap">APL Auction</span>
            <span className="text-white/20 text-[9px] uppercase tracking-wider whitespace-nowrap">Season 8</span>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {[
              { label: 'Home', href: '#hero' },
              { label: 'Auction', href: '#live-auction' },
              { label: 'Features', href: '#features' },
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Stats', href: '#stats' },
            ].map(item => (
              <a key={item.label} href={item.href}
                onClick={e => { e.preventDefault(); scrollTo(item.href); }}
                className="text-white/40 hover:text-white text-sm font-medium transition-colors relative group cursor-pointer">
                {item.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#c9a227] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link href="/audience" className="hidden sm:flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-medium transition-colors border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a227] animate-pulse" />
            Watch Live
          </Link>
          <Link href="/login" className="bg-[#c9a227] hover:bg-[#f0c040] text-[#0a1628] text-sm font-black px-4 py-2 rounded-lg transition-all">
            Sign In
          </Link>
          {/* Hamburger */}
          <button onClick={() => setOpen(o => !o)} aria-label={open ? 'Close menu' : 'Open menu'} className="lg:hidden ml-1 p-2 text-white/50 hover:text-white transition-colors">
            {open ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-[#060f1e]/98 backdrop-blur-xl border-t border-white/5 px-5 py-4 space-y-1">
          {NAV_LINKS.map(item => (
            <a key={item.label} href={item.href}
              onClick={e => { e.preventDefault(); scrollTo(item.href); setOpen(false); }}
              className="block py-3 text-white/60 hover:text-white text-sm font-medium border-b border-white/5 last:border-0 transition-colors cursor-pointer">
              {item.label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Link href="/audience" onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 border border-white/10 text-white/60 py-2.5 rounded-lg text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a227] animate-pulse" />
              Watch Live
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
      <div className="absolute inset-0 bg-[#060f1e]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 opacity-20"
        style={{ background: 'radial-gradient(ellipse, rgba(201,162,39,0.6) 0%, transparent 70%)' }} />
      <div className="absolute top-1/3 left-0 w-64 h-64 rounded-full opacity-8 blur-3xl animate-pulse"
        style={{ background: 'radial-gradient(circle, #c9a227, transparent)' }} />
      <div className="absolute bottom-1/4 right-0 w-48 h-48 rounded-full opacity-6 blur-3xl animate-pulse"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', animationDelay: '1.5s' }} />
      <div className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'linear-gradient(rgba(201,162,39,1) 1px,transparent 1px),linear-gradient(90deg,rgba(201,162,39,1) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-5 text-center pt-16 pb-10">
        {/* Live badge */}
        <div className="inline-flex items-center gap-2 bg-[#c9a227]/8 border border-[#c9a227]/20 rounded-full px-4 py-1.5 mb-8">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c9a227] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#c9a227]" />
          </span>
          <span className="text-[#c9a227] text-[10px] sm:text-xs font-bold uppercase tracking-widest">Live · Season 8 · APL Sports</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-[84px] font-black text-white uppercase leading-[0.92] tracking-tight mb-6">
          Experience<br />
          the <span className="text-[#c9a227]">Ultimate</span><br />
          Sports Auction
        </h1>

        <p className="text-white/40 text-base sm:text-lg max-w-lg mx-auto mb-10 leading-relaxed">
          Bid, Compete, and Build Your Dream Team in Real-Time.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mb-8 max-w-sm sm:max-w-none mx-auto">
          <Link href="/login"
            className="flex items-center justify-center gap-2 bg-[#c9a227] hover:bg-[#f0c040] text-[#0a1628] font-black px-7 py-3.5 rounded-xl text-sm sm:text-base transition-all hover:shadow-xl hover:shadow-[#c9a227]/25 active:scale-95">
            Enter Auction →
          </Link>
          <Link href="/audience"
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#c9a227]/30 text-white font-semibold px-7 py-3.5 rounded-xl text-sm sm:text-base transition-all">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c9a227] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#c9a227]" />
            </span>
            Watch Live
          </Link>
          <Link href="/players"
            className="flex items-center justify-center gap-2 text-white/35 hover:text-white font-medium px-7 py-3.5 rounded-xl text-sm transition-all border border-transparent hover:border-white/10">
            View Players →
          </Link>        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
          {['48 Players', '8 Teams', 'Real-Time', 'Season 8'].map((b, i) => (
            <div key={i} className="flex items-center gap-1.5 text-white/20 text-xs">
              <span className="w-1 h-1 rounded-full bg-[#c9a227]/40" />
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
    <section id="live-auction" className="py-16 sm:py-24 px-5 bg-[#060f1e]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-[#c9a227] text-xs uppercase tracking-[0.2em] font-bold mb-3">Happening Right Now</p>
          <h2 className="text-2xl sm:text-4xl font-black text-white">Live Auction Feed</h2>
        </div>

        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#c9a227]/15 shadow-2xl shadow-black/50">
          <div className="h-px bg-gradient-to-r from-transparent via-[#c9a227]/60 to-transparent" />
          <div className="bg-[#0a1628] p-6 sm:p-10">
            <div className="absolute inset-0 opacity-10"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,162,39,0.8) 0%, transparent 60%)' }} />

            <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between sm:gap-10">
              {session && player ? (
                <>
                  {/* Player info */}
                  <div className="text-center sm:text-left flex-1 w-full">
                    <div className="flex items-center gap-3 justify-center sm:justify-start mb-4">
                      <span className="flex items-center gap-1.5 bg-red-500 px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-white text-[10px] font-black uppercase tracking-widest">Live</span>
                      </span>
                      <span className="text-[#c9a227]/50 text-xs uppercase tracking-widest font-semibold">{player.skills?.[0]}</span>
                    </div>
                    <h3 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none mb-2">{player.name}</h3>
                    <p className="text-white/30 text-sm">Currently on auction block</p>
                  </div>
                  {/* Bid info */}
                  <div className="flex flex-col items-center gap-3 w-full sm:w-auto shrink-0">
                    <div className="relative bg-[#060f1e] border border-[#c9a227]/20 rounded-2xl px-8 py-5 text-center w-full sm:w-auto">
                      <p className="text-white/30 text-[9px] uppercase tracking-[0.2em] mb-1">Current Bid</p>
                      <p className="text-5xl sm:text-6xl font-black text-[#c9a227] tabular-nums leading-none">{session.currentBid}</p>
                      <p className="text-white/20 text-xs mt-1 uppercase tracking-wider">points</p>
                    </div>
                    {session.currentHighestBidderName && (
                      <div className="bg-[#c9a227]/10 border border-[#c9a227]/20 rounded-xl px-5 py-2.5 text-center w-full">
                        <p className="text-white/25 text-[9px] uppercase tracking-wider mb-0.5">Leading Team</p>
                        <p className="text-[#c9a227] font-black text-sm">{session.currentHighestBidderName}</p>
                      </div>
                    )}
                    <Link href="/audience"
                      className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c9a227] animate-pulse" />
                      Watch Full Auction
                    </Link>
                  </div>
                </>
              ) : (
                <div className="w-full text-center py-8">
                  <p className="text-white/30 text-lg font-semibold mb-2">No Active Auction</p>
                  <p className="text-white/20 text-sm mb-6">The next player will appear here when bidding starts</p>
                  <Link href="/audience"
                    className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a227]/50" />
                    Watch Audience View
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-[#c9a227]/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { icon: <svg className="w-5 h-5 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, title: 'Real-Time Bidding', desc: 'Instant bid updates via WebSockets. Every bid reflects across all screens in milliseconds.' },
    { icon: <svg className="w-5 h-5 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, title: 'Team Management', desc: 'Build a squad of 7 with a 500 pt budget. Track spending and acquisitions live.' },
    { icon: <svg className="w-5 h-5 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, title: 'Player Analytics', desc: 'View detailed player profiles, skills, and base prices before placing strategic bids.' },
    { icon: <svg className="w-5 h-5 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, title: 'Transparent Results', desc: 'Full auction log with every bid recorded. Complete transparency for all participants.' },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#c9a227] text-xs uppercase tracking-[0.2em] font-bold mb-3">Platform Features</p>
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-3">Built for the Best Experience</h2>
          <p className="text-white/30 max-w-md mx-auto text-sm leading-relaxed">Everything you need for a seamless, exciting auction.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div key={i}
              className="group relative bg-[#0a1628] border border-white/5 hover:border-[#c9a227]/25 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#c9a227]/5 overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,162,39,0.06) 0%, transparent 70%)' }} />
              <div className="relative">
                <div className="w-11 h-11 flex items-center justify-center bg-[#c9a227]/8 rounded-xl border border-[#c9a227]/10 mb-4">{f.icon}</div>
                <h3 className="text-white font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-white/35 text-xs leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { icon: <svg className="w-7 h-7 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>, title: 'Register / Login', desc: 'Sign in with your captain credentials provided by the auction admin.' },
    { icon: <svg className="w-7 h-7 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>, title: 'Join Auction', desc: 'Enter the live auction room and watch players go up for bidding in real-time.' },
    { icon: <svg className="w-7 h-7 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, title: 'Bid & Build Team', desc: 'Place bids strategically within your 500 pt budget to assemble a squad of 7 players.' },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 px-5 bg-[#060f1e]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#c9a227] text-xs uppercase tracking-[0.2em] font-bold mb-3">Simple Process</p>
          <h2 className="text-2xl sm:text-4xl font-black text-white">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((s, i) => (
            <div key={i} className="relative text-center group bg-[#0a1628] border border-white/5 rounded-2xl p-6 sm:p-0 sm:bg-transparent sm:border-0">
              <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#0a1628] border border-[#c9a227]/15 group-hover:border-[#c9a227]/40 mb-4 sm:mb-6 shadow-xl transition-all duration-300">
                {s.icon}
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#c9a227] text-[#0a1628] text-xs font-black flex items-center justify-center shadow-lg">{i + 1}</span>
              </div>
              <h3 className="text-white font-bold text-base mb-2">{s.title}</h3>
              <p className="text-white/35 text-sm leading-relaxed">{s.desc}</p>
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
    { value: useCounter(48, 1500, visible), label: 'Total Players', suffix: '' },
    { value: useCounter(8, 1200, visible), label: 'Teams', suffix: '' },
    { value: useCounter(8, 1000, visible), label: 'Season', suffix: '' },
    { value: useCounter(500, 2000, visible), label: 'Budget Per Team', suffix: ' pts' },
  ];

  return (
    <section id="stats" ref={ref} className="py-16 sm:py-24 px-5">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/5 bg-[#0a1628]">
          <div className="h-px bg-gradient-to-r from-transparent via-[#c9a227]/40 to-transparent" />
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-white/5">
            {stats.map((s, i) => (
              <div key={i} className="p-6 sm:p-8 text-center">
                <p className="text-3xl sm:text-5xl font-black text-[#c9a227] tabular-nums mb-1.5">{s.value}{s.suffix}</p>
                <p className="text-white/30 text-xs uppercase tracking-wider font-medium">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-[#c9a227]/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-16 sm:py-24 px-5 bg-[#060f1e]">
      <div className="max-w-3xl mx-auto">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#c9a227]/15 bg-[#0a1628] p-8 sm:p-14 text-center">
          <div className="absolute inset-0 opacity-15"
            style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(201,162,39,0.8) 0%, transparent 60%)' }} />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a227]/50 to-transparent" />
          <div className="relative">
            <p className="text-[#c9a227] text-xs uppercase tracking-[0.2em] font-bold mb-4">Get Started Today</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight">
              Ready to Build Your<br />
              <span className="text-[#c9a227]">Winning Team?</span>
            </h2>
            <p className="text-white/35 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
              Join the auction, place your bids, and assemble the ultimate squad.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-xs sm:max-w-none mx-auto">
              <Link href="/login"
                className="flex items-center justify-center gap-2 bg-[#c9a227] hover:bg-[#f0c040] text-[#0a1628] font-black px-8 py-3.5 rounded-xl text-sm sm:text-base transition-all hover:shadow-xl hover:shadow-[#c9a227]/25">
                Start Bidding Now →
              </Link>
              <Link href="/audience"
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-7 py-3.5 rounded-xl text-sm sm:text-base transition-all">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c9a227] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#c9a227]" />
                </span>
                Watch as Audience
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
    <footer className="border-t border-white/5 py-8 px-5 bg-[#060f1e]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" className="rounded-xl w-7 h-7" />
            <div>
              <span className="text-[#c9a227] font-black text-sm uppercase tracking-widest block leading-none">APL Auction</span>
              <span className="text-white/20 text-[9px] uppercase tracking-wider">Sports Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            {[
              { label: 'Auction', href: '/audience' },
              { label: 'Teams', href: '/teams' },
              { label: 'Players', href: '/players' },
              { label: 'Results', href: '/results' },
            ].map(l => (
              <Link key={l.label} href={l.href} className="text-white/25 hover:text-white/60 text-xs font-medium transition-colors">{l.label}</Link>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/audience" className="flex items-center gap-1.5 text-white/30 hover:text-[#c9a227] text-xs transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a227] animate-pulse" />
              Watch Live
            </Link>
            <Link href="/login" className="text-white/30 hover:text-white text-xs transition-colors">Login</Link>
          </div>
        </div>
        <div className="border-t border-white/5 pt-5 text-center">
          <p className="text-white/15 text-xs">© 2026 APL Sports Auction. All rights reserved.</p>
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
    const fn = () => { setScrolled(window.scrollY > 20); setShowTop(window.scrollY > 400); };
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen bg-[#060f1e] text-white">
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
        className={`fixed bottom-6 right-6 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-[#c9a227] text-[#0a1628] shadow-lg shadow-[#c9a227]/30 transition-all duration-300 hover:bg-[#f0c040] hover:scale-110 ${showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        aria-label="Back to top"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}

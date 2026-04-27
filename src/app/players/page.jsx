'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Logo from '@/components/Logo';
import SkillBadge from '@/components/SkillBadge';
import Spinner from '@/components/Spinner';
import { displaySkills } from '@/lib/skills';

function PlayerPhoto({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#060f1e]">
      <svg className="w-10 h-10 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    </div>
  );
  return (
    <>
      <Image src={src} alt={alt} fill unoptimized className="absolute inset-0 object-cover" style={{ objectPosition: '50% 15%' }} onError={() => setErr(true)} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(10,22,40,0.95) 100%)' }} />
    </>
  );
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

const STATUS_COLORS = {
  available: 'text-green-400 bg-green-400/10 border-green-400/20',
  sold: 'text-[#c9a227] bg-[#c9a227]/10 border-[#c9a227]/20',
  unsold: 'text-white/30 bg-white/5 border-white/10',
  resold: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
};

const SKILLS = ['All', 'Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper', 'Fielder'];

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/players/public`)
      .then(r => r.json())
      .then(d => { setPlayers(d.players || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = players.filter(p => {
    const matchSearch = !search.trim() || p.name.toLowerCase().includes(search.toLowerCase());
    const matchSkill = skillFilter === 'All' || p.skills?.includes(skillFilter);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchSkill && matchStatus;
  });

  const counts = {
    all: players.length,
    available: players.filter(p => p.status === 'available').length,
    sold: players.filter(p => p.status === 'sold').length,
    unsold: players.filter(p => p.status === 'unsold').length,
  };

  return (
    <div className="min-h-screen bg-[#060f1e] text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#060f1e]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size="sm" className="rounded-xl w-7 h-7" />
            <span className="text-[#c9a227] font-black text-sm uppercase tracking-widest">APL Auction</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/audience" className="hidden sm:flex items-center gap-1.5 text-white/40 hover:text-white text-xs transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a227] animate-pulse" />
              Watch Live
            </Link>
            <Link href="/login" className="bg-[#c9a227] hover:bg-[#f0c040] text-[#0a1628] text-xs font-black px-4 py-2 rounded-lg transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-5 pt-10 pb-6">
        <div className="mb-1">
          <Link href="/" className="text-white/30 hover:text-white text-xs transition-colors">← Back to Home</Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[#c9a227] text-xs uppercase tracking-widest font-bold mb-2">Season 8</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white">All Players</h1>
            <p className="text-white/30 text-sm mt-1">{players.length} players registered</p>
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search players..."
              className="w-full bg-[#0a1628] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/40 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-5 pb-6 space-y-3">
        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'available', label: `Available (${counts.available})` },
            { key: 'sold', label: `Sold (${counts.sold})` },
            { key: 'unsold', label: `Unsold (${counts.unsold})` },
          ].map(s => (
            <button key={s.key} onClick={() => setStatusFilter(s.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === s.key
                  ? 'bg-[#c9a227] text-[#0a1628]'
                  : 'bg-white/5 text-white/40 hover:text-white border border-white/10'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
        {/* Skill filter */}
        <div className="flex gap-2 overflow-x-auto pb-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {SKILLS.map(s => (
            <button key={s} onClick={() => setSkillFilter(s)}
              className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                skillFilter === s
                  ? 'bg-[#c9a227]/15 text-[#c9a227] border border-[#c9a227]/30'
                  : 'bg-white/5 text-white/30 hover:text-white border border-white/5'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Players grid */}
      <div className="max-w-7xl mx-auto px-5 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/20 text-3xl mb-3">—</p>
            <p className="text-white/40 text-sm">No players found</p>
            {players.length === 0 && (
              <p className="text-white/20 text-xs mt-2">Players will appear here once the auction is seeded</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map(p => (
              <div key={p._id}
                className="group bg-[#0a1628] border border-white/5 hover:border-[#c9a227]/20 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#c9a227]/5">
                {/* Photo */}
                <div className="relative aspect-[3/4] bg-[#060f1e] overflow-hidden">
                  {p.photo ? (
                    <PlayerPhoto src={p.photo} alt={p.name} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-10 h-10 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                  )}
                  {/* Status badge */}
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${STATUS_COLORS[p.status] || STATUS_COLORS.available}`}>
                    {p.status}
                  </div>
                  {/* Name overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-white font-black text-xs uppercase leading-tight truncate">{p.name}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {displaySkills(p.skills).slice(0, 2).map(s => <SkillBadge key={s} skill={s} />)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/25 text-[9px] uppercase tracking-wider">Base</p>
                      <p className="text-[#c9a227] text-xs font-bold">{p.basePrice} pts</p>
                    </div>
                    {p.status === 'sold' && p.soldTo && (
                      <div className="text-right">
                        <p className="text-white/25 text-[9px] uppercase tracking-wider">Team</p>
                        <p className="text-white/60 text-[10px] font-semibold truncate max-w-[70px]">{p.soldTo.name}</p>
                      </div>
                    )}
                    {p.status === 'sold' && p.soldPrice && (
                      <div className="text-right">
                        <p className="text-white/25 text-[9px] uppercase tracking-wider">Sold</p>
                        <p className="text-[#c9a227]/80 text-xs font-bold">{p.soldPrice}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

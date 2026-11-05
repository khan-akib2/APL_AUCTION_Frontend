'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SkillBadge from '@/components/SkillBadge';
import Spinner from '@/components/Spinner';
import { displaySkills } from '@/lib/skills';

function PlayerPhoto({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#faf8f5]">
      <svg className="w-10 h-10 text-[#0d3a24]/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    </div>
  );
  return (
    <>
      <Image src={src} alt={alt} fill unoptimized className="absolute inset-0 object-cover" style={{ objectPosition: '50% 15%' }} onError={() => setErr(true)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
    </>
  );
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

const STATUS_COLORS = {
  available: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  sold: 'text-amber-800 bg-amber-50 border-amber-200',
  unsold: 'text-stone-600 bg-stone-100 border-stone-200',
  resold: 'text-sky-800 bg-sky-50 border-sky-200',
};

const SKILLS = ['All', 'Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper', 'Fielder', 'Forward', 'Midfielder', 'Defender', 'Goalkeeper'];

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
    <div className="min-h-screen bg-[#f8f6f0] text-[#111827]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e8e2d5] shadow-xs">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0">
              <Image src="/APL.png" alt="APL" fill className="object-contain" priority />
            </div>
            <div>
              <span className="text-[#0d3a24] font-black text-sm uppercase tracking-wide block leading-none">APL Auction</span>
              <span className="text-[#c59b27] text-[9px] uppercase font-bold tracking-wider">Players Directory</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/audience" className="hidden sm:flex items-center gap-1.5 text-[#0d3a24] bg-[#f4efe6] border border-[#e8e2d5] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Watch Live
            </Link>
            <Link href="/login" className="bg-[#0d3a24] hover:bg-[#154d32] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-5 pt-8 pb-4">
        <div className="mb-2">
          <Link href="/" className="text-[#6b7280] hover:text-[#0d3a24] text-xs font-semibold transition-colors">← Back to Home</Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[#c59b27] text-xs uppercase tracking-widest font-bold mb-1">Official Register</p>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#111827]">Tournament Players</h1>
            <p className="text-[#6b7280] text-sm mt-0.5">{players.length} players listed</p>
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by player name..."
              className="w-full bg-white border border-[#e8e2d5] rounded-xl pl-9 pr-4 py-2.5 text-[#111827] text-sm placeholder-[#9ca3af] focus:outline-none focus:border-[#0d3a24] shadow-xs transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-5 pb-6 space-y-3">
        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'available', label: `Available (${counts.available})` },
            { key: 'sold', label: `Sold (${counts.sold})` },
            { key: 'unsold', label: `Unsold (${counts.unsold})` },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
                statusFilter === s.key
                  ? 'bg-[#0d3a24] text-white'
                  : 'bg-white text-[#4b5563] hover:text-[#111827] border border-[#e8e2d5]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {/* Skill filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SKILLS.map(s => (
            <button
              key={s}
              onClick={() => setSkillFilter(s)}
              className={`shrink-0 px-3 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                skillFilter === s
                  ? 'bg-[#f4efe6] text-[#0d3a24] border border-[#0d3a24]/30'
                  : 'bg-white text-[#6b7280] hover:text-[#111827] border border-[#e8e2d5]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Players grid */}
      <div className="max-w-7xl mx-auto px-5 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#e8e2d5] p-8">
            <p className="text-[#9ca3af] text-3xl mb-2">—</p>
            <p className="text-[#4b5563] text-sm font-semibold">No players matching your filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
            {filtered.map(p => (
              <div
                key={p._id}
                className="bg-white border border-[#e8e2d5] hover:border-[#0d3a24]/40 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between"
              >
                {/* Photo */}
                <div className="relative aspect-[3/4] bg-[#faf8f5] overflow-hidden">
                  {p.photo ? (
                    <PlayerPhoto src={p.photo} alt={p.name} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#0d3a24]/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                  )}
                  {/* Status badge */}
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${STATUS_COLORS[p.status] || STATUS_COLORS.available}`}>
                    {p.status}
                  </div>
                  {/* Name overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-white font-bold text-xs uppercase leading-tight truncate drop-shadow-sm">{p.name}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 space-y-2 bg-white">
                  <div className="flex flex-wrap gap-1">
                    {displaySkills(p.skills).slice(0, 2).map(s => <SkillBadge key={s} skill={s} />)}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#f4efe6]">
                    <div>
                      <p className="text-[#9ca3af] text-[9px] uppercase tracking-wider font-semibold">Base</p>
                      <p className="text-[#0d3a24] text-xs font-black">{p.basePrice} pts</p>
                    </div>
                    {p.status === 'sold' && p.soldTo && (
                      <div className="text-right">
                        <p className="text-[#9ca3af] text-[9px] uppercase tracking-wider font-semibold">Franchise</p>
                        <p className="text-[#c59b27] text-[10px] font-bold truncate max-w-[70px]">{p.soldTo.name}</p>
                      </div>
                    )}
                    {p.status === 'sold' && p.soldPrice && (
                      <div className="text-right">
                        <p className="text-[#9ca3af] text-[9px] uppercase tracking-wider font-semibold">Price</p>
                        <p className="text-[#0d3a24] text-xs font-black">{p.soldPrice}</p>
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

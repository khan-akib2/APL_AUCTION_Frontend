'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SkillBadge from '@/components/SkillBadge';
import Spinner from '@/components/Spinner';
import { displaySkills } from '@/lib/skills';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

function ResultPhoto({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div className="w-full h-full flex items-center justify-center bg-[#faf8f5]">
      <svg className="w-4 h-4 text-[#0d3a24]/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  );
  return <Image src={src} alt={alt} fill unoptimized className="object-cover" style={{ objectPosition: '50% 15%' }} onError={() => setErr(true)} />;
}

export default function ResultsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/summary/public`)
      .then(r => r.json())
      .then(d => { setTeams(d.teams || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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
              <span className="text-[#c59b27] text-[9px] uppercase font-bold tracking-wider">Results & Standings</span>
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

      <div className="max-w-5xl mx-auto px-5 pt-8 pb-16">
        <div className="mb-4">
          <Link href="/" className="text-[#6b7280] hover:text-[#0d3a24] text-xs font-semibold transition-colors">← Back to Home</Link>
        </div>
        <div className="mb-8">
          <p className="text-[#c59b27] text-xs uppercase tracking-widest font-bold mb-1">Official Standings</p>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#111827]">Auction Results</h1>
          <p className="text-[#6b7280] text-sm mt-0.5">Final squad compositions, acquired players, and points distribution</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
        ) : teams.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#e8e2d5] p-8 shadow-xs">
            <p className="text-[#6b7280] text-sm">Results will appear here as soon as bidding concludes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team, idx) => {
              const maxBudget = (team.budget || 0) + (team.pointsSpent || 0) || 1000;
              const pct = Math.min(100, Math.round(((team.pointsSpent || 0) / maxBudget) * 100));
              const isOpen = expanded === team._id;
              const emptySlots = Math.max(0, 7 - (team.players?.length || 0));

              return (
                <div
                  key={team._id}
                  className="bg-white border border-[#e8e2d5] hover:border-[#0d3a24]/30 rounded-3xl overflow-hidden transition-all duration-300 shadow-xs"
                >
                  {/* Team header — clickable to expand */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : team._id)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        idx === 0
                          ? 'bg-[#c59b27] text-white shadow-xs'
                          : 'bg-[#f4efe6] text-[#0d3a24] border border-[#e8e2d5]'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[#111827] font-bold text-base truncate">{team.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[#6b7280] text-xs">{team.players?.length || 0}/7 players signed</span>
                          <span className="text-[#9ca3af] text-xs">·</span>
                          <span className="text-[#0d3a24] text-xs font-semibold">{team.pointsSpent || 0} pts spent</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[#0d3a24] font-black text-lg tabular-nums">{team.budget}</p>
                        <p className="text-[#c59b27] text-[10px] font-bold uppercase tracking-wider">pts left</p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-[#9ca3af] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Budget bar */}
                  <div className="px-6 pb-4">
                    <div className="h-1.5 bg-[#f4efe6] rounded-full overflow-hidden">
                      <div className="h-full bg-[#0d3a24] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#6b7280] font-semibold mt-1.5">
                      <span>{pct}% budget utilized</span>
                      <span className="sm:hidden text-[#0d3a24] font-bold">{team.budget} pts left</span>
                    </div>
                  </div>

                  {/* Expanded squad */}
                  {isOpen && (
                    <div className="border-t border-[#f4efe6] bg-[#faf8f5] px-6 py-5">
                      <p className="text-[#6b7280] text-xs uppercase tracking-wider font-bold mb-3">
                        Acquired Squad · {team.players?.length || 0}/7
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {team.players?.map(p => (
                          <div
                            key={p._id}
                            className="flex items-center gap-3 bg-white border border-[#e8e2d5] rounded-2xl px-3.5 py-2.5 shadow-xs"
                          >
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#faf8f5] border border-[#e8e2d5] shrink-0">
                              <ResultPhoto src={p.photo} alt={p.name} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[#111827] text-xs font-bold truncate">{p.name}</p>
                              <div className="flex gap-1 mt-0.5">
                                {displaySkills(p.skills).slice(0, 2).map(s => <SkillBadge key={s} skill={s} />)}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[#0d3a24] text-xs font-black tabular-nums">{p.soldPrice}</p>
                              <p className="text-[#c59b27] text-[9px] font-bold uppercase">pts</p>
                            </div>
                          </div>
                        ))}
                        {Array.from({ length: emptySlots }).map((_, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 border border-dashed border-[#e8e2d5] bg-white/60 rounded-2xl px-3.5 py-2.5"
                          >
                            <div className="w-10 h-10 rounded-xl bg-[#f4efe6] border border-dashed border-[#e8e2d5] shrink-0 flex items-center justify-center text-[#9ca3af] text-xs">
                              —
                            </div>
                            <p className="text-[#9ca3af] text-xs font-semibold">Empty roster slot {(team.players?.length || 0) + i + 1}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

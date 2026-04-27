'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Logo from '@/components/Logo';
import SkillBadge from '@/components/SkillBadge';
import Spinner from '@/components/Spinner';
import { displaySkills } from '@/lib/skills';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

function ResultPhoto({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div className="w-full h-full flex items-center justify-center">
      <svg className="w-4 h-4 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <div className="max-w-5xl mx-auto px-5 pt-10 pb-16">
        <div className="mb-6">
          <Link href="/" className="text-white/30 hover:text-white text-xs transition-colors">← Back to Home</Link>
        </div>
        <div className="mb-10">
          <p className="text-[#c9a227] text-xs uppercase tracking-widest font-bold mb-2">Season 8</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Auction Results</h1>
          <p className="text-white/30 text-sm mt-1">Final squad compositions and standings</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
        ) : teams.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-white/20 text-sm">Results will be available after the auction completes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map((team, idx) => {
              const pct = Math.round((team.pointsSpent / 500) * 100);
              const isOpen = expanded === team._id;
              const emptySlots = Math.max(0, 7 - (team.players?.length || 0));

              return (
                <div key={team._id}
                  className="bg-[#0a1628] border border-white/5 hover:border-[#c9a227]/15 rounded-2xl overflow-hidden transition-all duration-300">

                  {/* Team header — clickable to expand */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : team._id)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className={`text-base font-black tabular-nums w-7 shrink-0 ${idx === 0 ? 'text-[#c9a227]' : 'text-white/20'}`}>
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-white font-bold text-sm sm:text-base truncate">{team.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-white/30 text-xs">{team.players?.length || 0}/7 players</span>
                          <span className="text-white/15 text-xs">·</span>
                          <span className="text-white/30 text-xs">{team.pointsSpent} pts spent</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[#c9a227] font-black text-lg tabular-nums">{team.budget}</p>
                        <p className="text-white/25 text-[10px]">pts left</p>
                      </div>
                      <svg
                        className={`w-4 h-4 text-white/30 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Budget bar */}
                  <div className="px-5 pb-3">
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#c9a227]/50 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-white/20 mt-1">
                      <span>{pct}% budget used</span>
                      <span className="sm:hidden text-[#c9a227]/60">{team.budget} pts left</span>
                    </div>
                  </div>

                  {/* Expanded squad */}
                  {isOpen && (
                    <div className="border-t border-white/5 px-5 py-4">
                      <p className="text-white/30 text-xs uppercase tracking-wider font-semibold mb-3">
                        Squad · {team.players?.length || 0}/7
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {team.players?.map(p => (
                          <div key={p._id}
                            className="flex items-center gap-3 bg-[#060f1e] border border-white/5 rounded-xl px-3 py-2.5">
                            {/* Photo */}
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-[#0a1628] border border-white/5 shrink-0">
                              <ResultPhoto src={p.photo} alt={p.name} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-semibold truncate">{p.name}</p>
                              <div className="flex gap-1 mt-0.5">
                              {displaySkills(p.skills).slice(0, 2).map(s => <SkillBadge key={s} skill={s} />)}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[#c9a227] text-xs font-bold tabular-nums">{p.soldPrice}</p>
                              <p className="text-white/20 text-[9px]">pts</p>
                            </div>
                          </div>
                        ))}
                        {/* Empty slots */}
                        {Array.from({ length: emptySlots }).map((_, i) => (
                          <div key={i}
                            className="flex items-center gap-3 border border-dashed border-white/5 rounded-xl px-3 py-2.5">
                            <div className="w-9 h-9 rounded-lg bg-white/3 border border-dashed border-white/5 shrink-0" />
                            <p className="text-white/15 text-xs">Empty slot {(team.players?.length || 0) + i + 1}</p>
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

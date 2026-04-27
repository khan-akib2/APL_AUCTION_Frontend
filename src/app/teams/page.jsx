'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import Spinner from '@/components/Spinner';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/teams-public`)
      .then(r => r.json())
      .then(d => { setTeams(d.teams || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sorted = [...teams].sort((a, b) => b.pointsSpent - a.pointsSpent);

  return (
    <div className="min-h-screen bg-[#060f1e] text-white">
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

      <div className="max-w-6xl mx-auto px-5 pt-10 pb-16">
        <div className="mb-6">
          <Link href="/" className="text-white/30 hover:text-white text-xs transition-colors">← Back to Home</Link>
        </div>
        <div className="mb-10">
          <p className="text-[#c9a227] text-xs uppercase tracking-widest font-bold mb-2">Season 8</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white">All Teams</h1>
          <p className="text-white/30 text-sm mt-1">{teams.length} teams competing</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sorted.map((team, idx) => {
              const pct = Math.round((team.pointsSpent / 500) * 100);
              return (
                <div key={team._id} className="bg-[#0a1628] border border-white/5 hover:border-[#c9a227]/20 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#c9a227]/5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[#c9a227]/30 text-xs font-bold w-5">#{idx + 1}</span>
                      <div>
                        <p className="text-white font-bold text-sm">{team.name}</p>
                        <p className="text-white/30 text-xs mt-0.5">{team.playerCount}/7 players</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[#c9a227] font-black text-base tabular-nums">{team.budget}</p>
                      <p className="text-white/25 text-[10px]">pts left</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-[#c9a227]/60 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-white/25">
                    <span>Spent: {team.pointsSpent} pts</span>
                    <span>{pct}% used</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

  const sorted = [...teams].sort((a, b) => (b.pointsSpent || 0) - (a.pointsSpent || 0));

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
              <span className="text-[#c59b27] text-[9px] uppercase font-bold tracking-wider">Tournament Teams</span>
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

      <div className="max-w-6xl mx-auto px-5 pt-8 pb-16">
        <div className="mb-4">
          <Link href="/" className="text-[#6b7280] hover:text-[#0d3a24] text-xs font-semibold transition-colors">← Back to Home</Link>
        </div>
        <div className="mb-8">
          <p className="text-[#c59b27] text-xs uppercase tracking-widest font-bold mb-1">Franchise Rosters</p>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#111827]">Competing Teams</h1>
          <p className="text-[#6b7280] text-sm mt-0.5">{teams.length} franchises active in tournament</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sorted.map((team, idx) => {
              const maxBudget = (team.budget || 0) + (team.pointsSpent || 0) || 1000;
              const pct = Math.min(100, Math.round(((team.pointsSpent || 0) / maxBudget) * 100));
              return (
                <div
                  key={team._id}
                  className="bg-white border border-[#e8e2d5] hover:border-[#0d3a24]/30 rounded-3xl p-6 transition-all duration-300 hover:shadow-md shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-[#f4efe6] text-[#0d3a24] font-bold text-xs flex items-center justify-center shrink-0 border border-[#e8e2d5]">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-[#111827] font-bold text-sm">{team.name}</p>
                          <p className="text-[#6b7280] text-xs mt-0.5">{team.playerCount || 0} players signed</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[#0d3a24] font-black text-base tabular-nums">{team.budget}</p>
                        <p className="text-[#c59b27] text-[10px] font-bold uppercase tracking-wider">pts left</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#f4efe6]">
                    <div className="h-2 bg-[#f4efe6] rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-[#0d3a24] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#6b7280] font-semibold">
                      <span>Spent: {team.pointsSpent || 0} pts</span>
                      <span>{pct}% used</span>
                    </div>
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

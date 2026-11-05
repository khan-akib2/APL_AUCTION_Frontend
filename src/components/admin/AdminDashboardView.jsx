'use client';
import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import Spinner from '@/components/Spinner';
import { CricketIcon, FootballIcon } from '@/components/SportIcons';

export default function AdminDashboardView({ sport = 'cricket' }) {
  const { request } = useApi();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const isFootball = sport === 'football';
  const sportLabel = isFootball ? 'Football' : 'Cricket';
  const basePath = isFootball ? '/admin/football' : '/admin';

  const load = useCallback(async () => {
    const [pRes, tRes] = await Promise.all([
      request(`/api/players?pageSize=500&sport=${sport}`),
      request(`/api/teams?sport=${sport}`),
    ]);
    if (pRes && tRes) {
      const p = pRes.players || [];
      const t = tRes.teams || [];
      setStats({
        total: p.length,
        sold: p.filter(x => x.status === 'sold').length,
        unsold: p.filter(x => x.status === 'unsold').length,
        available: p.filter(x => ['available', 'resold'].includes(x.status)).length,
        teams: t.length,
        spent: t.reduce((s, x) => s + (x.pointsSpent || 0), 0),
      });
    }
    setLoading(false);
  }, [request, sport]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  const cards = [
    { label: 'Total Players', value: stats?.total },
    { label: 'Sold', value: stats?.sold },
    { label: 'Unsold', value: stats?.unsold },
    { label: 'Available', value: stats?.available },
    { label: 'Teams', value: stats?.teams },
  ];

  return (
    <div className={`p-4 lg:p-6 min-h-full ${isFootball ? 'bg-[#040e0a]' : 'bg-[#0a1628]'}`}>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
          {isFootball ? <FootballIcon className="w-5 h-5 text-emerald-400" /> : <CricketIcon className="w-5 h-5 text-[#c9a227]" />}
          <span>{sportLabel} Dashboard</span>
        </h1>
        <p className={`text-xs mt-1 ${isFootball ? 'text-emerald-400/50' : 'text-[#c9a227]/40'}`}>
          Live {sportLabel.toLowerCase()} auction overview and statistics
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-5">
        {cards.map(c => (
          <div
            key={c.label}
            className={`border rounded-xl p-4 relative overflow-hidden transition-all shadow-md ${
              isFootball
                ? 'bg-[#071d14] border-emerald-500/20 hover:border-emerald-500/40 shadow-emerald-950/40'
                : 'bg-[#0d1e3a] border-[#c9a227]/15 hover:border-[#c9a227]/30 shadow-black/40'
            }`}
          >
            <div className={`absolute top-0 right-0 w-12 h-12 rounded-full -translate-y-4 translate-x-4 ${
              isFootball ? 'bg-emerald-400/5' : 'bg-[#c9a227]/5'
            }`} />
            <div className={`text-3xl font-black relative tabular-nums ${
              isFootball ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-[#c9a227]'
            }`}>
              {c.value ?? '—'}
            </div>
            <div className="text-white/40 text-[11px] font-semibold mt-1.5 uppercase tracking-wider">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <a
          href={`${basePath}/auction`}
          className={`border rounded-xl p-5 transition-all shadow-md group ${
            isFootball
              ? 'bg-[#071d14] border-emerald-500/25 hover:border-emerald-400/50 hover:bg-[#0a261a]'
              : 'bg-[#0d1e3a] border-[#c9a227]/20 hover:border-[#c9a227]/40 hover:bg-[#0d1e3a]/80'
          }`}
        >
          <div className={`font-bold text-sm flex items-center gap-2 ${
            isFootball ? 'text-emerald-300 group-hover:text-emerald-200' : 'text-[#c9a227] group-hover:text-[#f0c040]'
          }`}>
            <span>{sportLabel} Auction Control</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </div>
          <div className="text-white/35 text-xs mt-1">Start live bidding, manage queue, and monitor rounds</div>
        </a>
        <a
          href={isFootball ? '/audience/football' : '/audience'}
          target="_blank"
          className={`border rounded-xl p-5 transition-all shadow-md group ${
            isFootball
              ? 'bg-[#071d14] border-emerald-500/20 hover:border-emerald-500/40 hover:bg-[#0a261a]'
              : 'bg-[#0d1e3a] border-[#c9a227]/15 hover:border-[#c9a227]/30'
          }`}
        >
          <div className="text-white/60 group-hover:text-white font-bold text-sm flex items-center gap-1.5">
            <span>{sportLabel} Audience Broadcast View</span>
            <span className="text-xs">↗</span>
          </div>
          <div className="text-white/30 text-xs mt-1">Open real-time spectator view on a separate screen or projector</div>
        </a>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import Spinner from '@/components/Spinner';

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
    <div className="p-4 lg:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <span>{isFootball ? '⚽' : '🏏'}</span>
          <span>{sportLabel} Dashboard</span>
        </h1>
        <p className="text-[#c9a227]/40 text-xs mt-0.5">Live {sportLabel.toLowerCase()} auction overview</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {cards.map(c => (
          <div key={c.label} className="bg-[#0d1e3a] border border-[#c9a227]/15 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-[#c9a227]/5 rounded-full -translate-y-4 translate-x-4" />
            <div className="text-2xl font-bold text-[#c9a227] relative">{c.value ?? '—'}</div>
            <div className="text-white/35 text-xs mt-1.5 uppercase tracking-wider">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a href={`${basePath}/auction`} className="bg-[#c9a227]/10 border border-[#c9a227]/20 rounded-xl p-4 hover:bg-[#c9a227]/15 transition-colors group">
          <div className="text-[#c9a227] font-semibold text-sm">{sportLabel} Auction Control →</div>
          <div className="text-white/30 text-xs mt-1">Start bidding for {sportLabel.toLowerCase()} players</div>
        </a>
        <a href="/audience" target="_blank" className="bg-[#0d1e3a] border border-[#c9a227]/15 rounded-xl p-4 hover:border-[#c9a227]/30 transition-colors">
          <div className="text-white/50 font-semibold text-sm">Audience View ↗</div>
          <div className="text-white/25 text-xs mt-1">Share with spectators</div>
        </a>
      </div>
    </div>
  );
}

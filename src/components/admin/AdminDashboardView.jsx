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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );

  const cards = [
    { label: 'Total Players', value: stats?.total, color: 'text-[#0d3a24]' },
    { label: 'Sold', value: stats?.sold, color: 'text-[#c59b27]' },
    { label: 'Unsold', value: stats?.unsold, color: 'text-[#6b7280]' },
    { label: 'Available', value: stats?.available, color: 'text-[#0d3a24]' },
    { label: 'Teams', value: stats?.teams, color: 'text-[#c59b27]' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full bg-[#f8f6f0]">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-serif text-[#111827] flex items-center gap-2.5">
          {isFootball ? (
            <FootballIcon className="w-6 h-6 text-[#0d3a24]" />
          ) : (
            <CricketIcon className="w-6 h-6 text-[#c59b27]" />
          )}
          <span>{sportLabel} Dashboard</span>
        </h1>
        <p className="text-xs text-[#6b7280] mt-1">
          Live {sportLabel.toLowerCase()} auction overview, team rosters, and quick controls
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {cards.map(c => (
          <div
            key={c.label}
            className="bg-white border border-[#e8e2d5] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight mb-1" style={{ color: c.color.replace('text-', '') }}>
              <span className={c.color}>{c.value ?? '—'}</span>
            </div>
            <div className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider">
              {c.label}
            </div>
          </div>
        ))}
      </div>

      {/* Action Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href={`${basePath}/auction`}
          className="bg-white border border-[#e8e2d5] hover:border-[#0d3a24]/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group block"
        >
          <div className="font-bold text-base text-[#0d3a24] flex items-center gap-2">
            <span>{sportLabel} Auction Control</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </div>
          <p className="text-[#6b7280] text-xs mt-1.5">
            Start live bidding, manage player queue, handle unsold & resale rounds
          </p>
        </a>

        <a
          href={isFootball ? '/audience/football' : '/audience'}
          target="_blank"
          className="bg-white border border-[#e8e2d5] hover:border-[#c59b27]/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group block"
        >
          <div className="font-bold text-base text-[#c59b27] flex items-center gap-2">
            <span>{sportLabel} Live Audience Broadcast</span>
            <span className="text-xs transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
          </div>
          <p className="text-[#6b7280] text-xs mt-1.5">
            Open full-screen spectator broadcast on projector or separate display
          </p>
        </a>
      </div>
    </div>
  );
}

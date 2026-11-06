'use client';
import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import Spinner from '@/components/Spinner';
import { CricketIcon, FootballIcon } from '@/components/SportIcons';

export default function AuctionLogView({ sport = 'cricket' }) {
  const { request } = useApi();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearConfirm, setClearConfirm] = useState(false);

  const isFootball = sport === 'football';
  const sportLabel = isFootball ? 'Football' : 'Cricket';

  const load = useCallback(async () => {
    const res = await request(`/api/auction/log?pageSize=500&sport=${sport}`);
    if (res) setLogs(res.logs || []);
    setLoading(false);
  }, [request, sport]);

  useEffect(() => { load(); }, [load]);

  const clearLogs = async () => {
    await request(`/api/auction/log?sport=${sport}`, { method: 'DELETE' });
    setClearConfirm(false);
    setLogs([]);
  };

  return (
    <div className="flex flex-col min-h-screen lg:h-[calc(100vh-48px)] bg-[#f8f6f0] text-[#111827]">
      {/* Header */}
      <div className="px-4 lg:px-8 py-5 border-b border-[#e8e2d5] bg-white shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-serif text-[#111827] flex items-center gap-2">
            {isFootball ? <FootballIcon className="w-5 h-5 text-[#0d3a24]" /> : <CricketIcon className="w-5 h-5 text-[#c59b27]" />}
            <span>{sportLabel} Auction Log</span>
          </h1>
          <p className="text-[#6b7280] text-xs mt-0.5">{logs.length} historical audit entries</p>
        </div>
        <button
          onClick={() => setClearConfirm(true)}
          disabled={logs.length === 0}
          className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-40"
        >
          Clear All
        </button>
      </div>

      {/* Main Table Box */}
      <div className="flex-1 overflow-hidden p-4 lg:p-8">
        <div className="h-full border border-[#e8e2d5] rounded-2xl overflow-hidden flex flex-col bg-white shadow-sm">
          {/* Header Bar */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#faf8f5] border-b border-[#e8e2d5] shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0d3a24]/30" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#c59b27]/30" />
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
            <span className="ml-2 text-[#6b7280] text-xs font-mono">{sport}-auction-log · {logs.length} entries</span>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40"><Spinner size="lg" /></div>
            ) : (
              <>
                {/* Mobile list */}
                <div className="lg:hidden divide-y divide-gray-100">
                  {logs.length === 0 && (
                    <div className="text-[#9ca3af] text-xs text-center py-10">No {sportLabel.toLowerCase()} auction logs yet</div>
                  )}
                  {logs.map(log => (
                    <div key={log._id} className="px-4 py-3.5 flex items-start justify-between gap-3 hover:bg-[#faf8f5] transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            log.action === 'captain_locked'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : log.action === 'captain_unlocked'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-[#f4efe6] text-[#0d3a24]'
                          }`}>
                            {log.action?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {log.details ? (
                          <div className="text-xs text-gray-700 mt-1 font-medium">{log.details}</div>
                        ) : (
                          <>
                            <div className="text-[#111827] font-semibold text-sm truncate">{log.playerId?.name || '—'}</div>
                            <div className="text-[#6b7280] text-xs">{log.teamId?.name || '—'}</div>
                          </>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[#c59b27] text-sm font-bold">{log.amount ? `${log.amount} pts` : '—'}</div>
                        <div className="text-[#9ca3af] text-[11px]">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead className="sticky top-0 bg-[#f4efe6] z-10 border-b border-[#e8e2d5]">
                      <tr>
                        <th className="text-left px-6 py-3 text-[#4b5563] text-xs uppercase tracking-wider font-semibold">Time</th>
                        <th className="text-left px-4 py-3 text-[#4b5563] text-xs uppercase tracking-wider font-semibold">Action</th>
                        <th className="text-left px-4 py-3 text-[#4b5563] text-xs uppercase tracking-wider font-semibold">Player</th>
                        <th className="text-left px-4 py-3 text-[#4b5563] text-xs uppercase tracking-wider font-semibold">Team</th>
                        <th className="text-left px-6 py-3 text-[#4b5563] text-xs uppercase tracking-wider font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8e2d5]/60">
                      {logs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-[#9ca3af] text-xs">
                            No {sportLabel.toLowerCase()} auction logs yet
                          </td>
                        </tr>
                      )}
                      {logs.map(log => (
                        <tr key={log._id} className="hover:bg-[#faf8f5] transition-colors">
                          <td className="px-6 py-3 text-[#6b7280] text-xs tabular-nums">
                            {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                              log.action === 'captain_locked'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : log.action === 'captain_unlocked'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-[#f4efe6] text-[#0d3a24]'
                            }`}>
                              {log.action?.replace(/_/g, ' ')}
                            </span>
                            {log.details && (
                              <div className="text-[11px] text-gray-500 mt-0.5 max-w-xs truncate" title={log.details}>
                                {log.details}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#111827] font-semibold">{log.playerId?.name || '—'}</td>
                          <td className="px-4 py-3 text-[#4b5563]">{log.teamId?.name || '—'}</td>
                          <td className="px-6 py-3 text-[#c59b27] font-bold tabular-nums">{log.amount ? `${log.amount} pts` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {clearConfirm && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-gray-100">
            <h2 className="text-lg font-bold font-serif text-[#111827] mb-2">Clear {sportLabel} Logs?</h2>
            <p className="text-[#6b7280] text-xs leading-relaxed mb-6">This will permanently delete all {sportLabel.toLowerCase()} auction log entries.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setClearConfirm(false)}
                className="flex-1 bg-[#f3f4f6] text-[#374151] font-semibold py-2.5 rounded-xl text-sm hover:bg-[#e5e7eb] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearLogs}
                className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-red-700 shadow-sm transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

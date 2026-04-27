'use client';
import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import Spinner from '@/components/Spinner';

export default function AuctionLogPage() {
  const { request } = useApi();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearConfirm, setClearConfirm] = useState(false);

  const load = useCallback(async () => {
    const res = await request('/api/auction/log?pageSize=500');
    if (res) setLogs(res.logs || []);
    setLoading(false);
  }, [request]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const clearLogs = async () => {
    await request('/api/auction/log', { method: 'DELETE' });
    setClearConfirm(false);
    setLogs([]);
  };

  return (
    <div className="flex flex-col min-h-screen lg:h-[calc(100vh-48px)]">
      <div className="px-4 lg:px-6 py-4 border-b border-[#c9a227]/15 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-white">Auction Log</h1>
          <p className="text-white/40 text-xs mt-0.5">{logs.length} entries</p>
        </div>
        <button onClick={() => setClearConfirm(true)} disabled={logs.length === 0}
          className="bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-30">
          Clear All
        </button>
      </div>

      <div className="flex-1 overflow-hidden p-4 lg:p-6">
        <div className="h-full border border-[#c9a227]/20 rounded-xl overflow-hidden bg-[#060f1e] flex flex-col">
          {/* iframe-style header bar */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0a1628] border-b border-[#c9a227]/15 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
            <span className="ml-2 text-white/20 text-xs">auction-log · {logs.length} entries</span>
          </div>

          {/* scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40"><Spinner size="lg" /></div>
            ) : (
              <>
                {/* Mobile list */}
                <div className="lg:hidden divide-y divide-[#c9a227]/10">
                  {logs.map(log => (
                    <div key={log._id} className="px-4 py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[#c9a227]/60 text-xs uppercase tracking-wider">{log.action?.replace('_', ' ')}</span>
                        </div>
                        <div className="text-white/70 text-sm truncate">{log.playerId?.name || '—'}</div>
                        <div className="text-white/30 text-xs">{log.teamId?.name || '—'}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[#c9a227] text-sm font-semibold">{log.amount ? `${log.amount}pts` : '—'}</div>
                        <div className="text-white/25 text-xs">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead className="sticky top-0 bg-[#0a1628] z-10">
                      <tr className="border-b border-[#c9a227]/15">
                        <th className="text-left px-6 py-3 text-white/40 text-xs uppercase tracking-wider font-medium">Time</th>
                        <th className="text-left px-4 py-3 text-white/40 text-xs uppercase tracking-wider font-medium">Action</th>
                        <th className="text-left px-4 py-3 text-white/40 text-xs uppercase tracking-wider font-medium">Player</th>
                        <th className="text-left px-4 py-3 text-white/40 text-xs uppercase tracking-wider font-medium">Team</th>
                        <th className="text-left px-6 py-3 text-white/40 text-xs uppercase tracking-wider font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log._id} className="border-b border-[#c9a227]/8 hover:bg-[#c9a227]/5 transition-colors">
                          <td className="px-6 py-3 text-white/25 text-xs tabular-nums">
                            {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3"><span className="text-xs text-[#c9a227]/60 uppercase tracking-wider">{log.action?.replace('_', ' ')}</span></td>
                          <td className="px-4 py-3 text-white/70">{log.playerId?.name || '—'}</td>
                          <td className="px-4 py-3 text-white/40">{log.teamId?.name || '—'}</td>
                          <td className="px-6 py-3 text-[#c9a227]/80 tabular-nums">{log.amount ? `${log.amount} pts` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {!loading && logs.length === 0 && <p className="text-center text-white/30 py-16 text-sm">No activity yet</p>}
          </div>
        </div>
      </div>

      {clearConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1e3a] border border-red-500/30 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-white mb-2">Clear All Logs?</h2>
            <p className="text-white/50 text-sm mb-6">All auction log entries will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setClearConfirm(false)}
                className="flex-1 bg-[#0a1628] border border-[#c9a227]/15 text-white/50 py-2.5 rounded-lg text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={clearLogs}
                className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-lg text-sm hover:bg-red-500 transition-colors">
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useApi } from '@/hooks/useApi';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/Toast';
import SkillBadge from '@/components/SkillBadge';
import Spinner from '@/components/Spinner';
import AuctionTimer from '@/components/AuctionTimer';
import { displaySkills } from '@/lib/skills';

export default function AuctionControl() {
  const { request } = useApi();
  const socket = useSocket();
  const toast = useToast();

  const [players, setPlayers] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [activePlayer, setActivePlayer] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [mobileTab, setMobileTab] = useState('auction');
  const [timer, setTimer] = useState({ remaining: null, paused: false });
  const [timerDuration, setTimerDuration] = useState(30);
  const [queueSearch, setQueueSearch] = useState('');
  const [timerOpen, setTimerOpen] = useState(false);

  const loadData = useCallback(async () => {
    const [pRes, sRes, tRes] = await Promise.all([
      request('/api/players?pageSize=500'),
      request('/api/auction/active'),
      request('/api/teams'),
    ]);
    if (pRes) setPlayers(pRes.players || []);
    if (tRes) setTeams(tRes.teams || []);
    if (sRes?.session) {
      setActiveSession(sRes.session);
      setActivePlayer(sRes.session.playerId);
      setBidHistory(sRes.session.bids?.slice().reverse() || []);
      setTimer({ remaining: sRes.session.timerRemaining, paused: sRes.session.timerPaused });
    } else {
      setActiveSession(null); setActivePlayer(null);
      setTimer({ remaining: null, paused: false });
    }
    setLoading(false);
  }, [request]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData(); }, [loadData]);

  // Close timer dropdown on outside click
  const timerDropdownRef = useRef(null);
  useEffect(() => {
    if (!timerOpen) return;
    const handler = (e) => {
      if (timerDropdownRef.current && !timerDropdownRef.current.contains(e.target)) {
        setTimerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [timerOpen]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadData(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadData]);

  useEffect(() => {
    if (!socket) return;
    socket.on('auction:start', ({ session, player }) => {
      setActiveSession(session); setActivePlayer(player); setBidHistory([]);
      setTimer({ remaining: session.timerRemaining, paused: false });
      setMobileTab('auction');
    });
    socket.on('auction:bid_update', (data) => {
      setActiveSession(prev => prev ? {
        ...prev,
        currentBid: data.currentBid,
        currentHighestBidderName: data.bidderTeamName,
        currentHighestBidder: data.bidderTeamId,
      } : prev);
      setBidHistory(prev => [{ teamName: data.bidderTeamName, amount: data.currentBid }, ...prev]);
    });
    socket.on('auction:timer', (data) => setTimer(data));
    socket.on('auction:sold', ({ player, team }) => {
      toast(`${player.name} → ${team.name}`, 'success');
      setActiveSession(null); setActivePlayer(null); setBidHistory([]);
      setTimer({ remaining: null, paused: false });
      loadData();
    });
    socket.on('auction:unsold', ({ player }) => {
      toast(`${player.name} unsold`, 'info');
      setActiveSession(null); setActivePlayer(null); setBidHistory([]);
      setTimer({ remaining: null, paused: false });
      loadData();
    });
    socket.on('players:updated', () => loadData());
    return () => {
      socket.off('auction:start'); socket.off('auction:bid_update');
      socket.off('auction:timer'); socket.off('auction:sold'); socket.off('auction:unsold');
      socket.off('players:updated');
    };
  }, [socket, toast, loadData]);

  const startBidding = async () => {
    if (!selectedPlayer) return toast('Select a player first', 'warning');
    setActionLoading(true);
    const res = await request('/api/auction/start', { method: 'POST', body: JSON.stringify({ playerId: selectedPlayer._id, timerDuration }) });
    setActionLoading(false);
    if (res?.error) toast(res.error, 'error');
    else {
      setActiveSession(res.session); setActivePlayer(res.player); setBidHistory([]);
      setTimer({ remaining: res.session.timerRemaining, paused: false });
      setMobileTab('auction');
    }
  };

  const markSold = async () => {
    if (!activeSession) return;
    setActionLoading(true);
    const res = await request('/api/auction/sold', { method: 'POST', body: JSON.stringify({ sessionId: activeSession._id }) });
    setActionLoading(false);
    if (res?.error) { toast(res.error, 'error'); return; }
    toast(`${res.player?.name} → ${res.team?.name}`, 'success');
    setActiveSession(null); setActivePlayer(null); setBidHistory([]);
    setTimer({ remaining: null, paused: false });
    loadData();
  };

  const markUnsold = async () => {
    if (!activeSession) return;
    setActionLoading(true);
    const res = await request('/api/auction/unsold', { method: 'POST', body: JSON.stringify({ sessionId: activeSession._id }) });
    setActionLoading(false);
    if (res?.error) { toast(res.error, 'error'); return; }
    toast(`${res.player?.name} unsold`, 'info');
    setActiveSession(null); setActivePlayer(null); setBidHistory([]);
    setTimer({ remaining: null, paused: false });
    loadData();
  };

  const pauseTimer = async () => {
    setTimer(t => ({ ...t, paused: true }));
    const res = await request('/api/auction/timer/pause', { method: 'POST' });
    if (res?.error) { toast(res.error, 'error'); setTimer(t => ({ ...t, paused: false })); }
  };

  const resumeTimer = async () => {
    setTimer(t => ({ ...t, paused: false }));
    const res = await request('/api/auction/timer/resume', { method: 'POST' });
    if (res?.error) { toast(res.error, 'error'); setTimer(t => ({ ...t, paused: true })); }
  };

  const triggerResale = async (playerId, playerName) => {
    // Optimistic: remove from resale candidates immediately
    setPlayers(prev => prev.map(p => p._id === playerId ? { ...p, status: 'resold', soldTo: null, soldPrice: null } : p));
    const res = await request('/api/auction/resale', { method: 'POST', body: JSON.stringify({ playerId }) });
    if (res?.error) {
      toast(res.error, 'error');
      loadData(); // revert on error
    } else {
      toast(`${playerName} back in queue`, 'success');
      // Sync teams budget optimistically
      if (res.team) setTeams(prev => prev.map(t => t._id === res.team._id?.toString() ? { ...t, budget: res.team.budget, pointsSpent: res.team.pointsSpent, playerCount: res.team.playerCount, players: res.team.players } : t));
    }
  };

  const available = players
    .filter(p => ['available','resold','unsold'].includes(p.status))
    .filter(p => !queueSearch.trim() || p.name.toLowerCase().includes(queueSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  // For each team, show only their single highest-priced sold player
  const resaleCandidates = teams
    .map(t => {
      const teamId = t._id?.toString();
      const soldPlayers = players.filter(p =>
        p.status === 'sold' &&
        (p.soldTo?._id?.toString() === teamId || p.soldTo?.toString() === teamId)
      );
      if (!soldPlayers.length) return null;
      const highest = soldPlayers.reduce((a, b) => (a.soldPrice || 0) > (b.soldPrice || 0) ? a : b);
      return { team: t, player: highest };
    })
    .filter(Boolean)
    .sort((a, b) => (b.player.soldPrice || 0) - (a.player.soldPrice || 0));

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 48px)' }}>
      {/* Header + tabs */}
      <div className="shrink-0 px-4 lg:px-6 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-white">Auction Control</h1>
          {activeSession && (
            <span className="flex items-center gap-1.5 text-xs text-white/40 bg-[#c9a227]/8 border border-[#c9a227]/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="flex lg:hidden border border-[#c9a227]/20 rounded-lg overflow-hidden">
          {['queue','auction','bids'].map(t => (
            <button key={t} onClick={() => setMobileTab(t)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${mobileTab === t ? 'bg-[#c9a227]/15 text-white' : 'text-white/30'}`}>
              {t === 'queue' ? 'Queue' : t === 'auction' ? 'Auction' : 'Bids'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 px-4 lg:px-6 pb-4 lg:pb-6 overflow-y-auto overflow-x-hidden">

        {/* Queue */}
        <div className={`lg:col-span-3 flex flex-col min-h-0 overflow-visible ${mobileTab !== 'queue' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-xl flex flex-col h-full overflow-hidden shadow-2xl">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0a1628] border-b border-[#c9a227]/15 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
              <span className="ml-2 text-white/20 text-xs">queue · {queueSearch ? `${available.length} of ${players.filter(p => ['available','resold'].includes(p.status)).length}` : `${available.length} players`}</span>
            </div>
            <div className="px-2 pt-2 shrink-0">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/25 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  value={queueSearch}
                  onChange={e => setQueueSearch(e.target.value)}
                  placeholder="Search players..."
                  className="w-full bg-[#0a1628] border border-[#c9a227]/15 rounded-lg pl-7 pr-3 py-1.5 text-white text-xs placeholder-white/20 focus:outline-none focus:border-[#c9a227]/40 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
              {available.map(p => (
                <button key={p._id} onClick={() => setSelectedPlayer(p)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    selectedPlayer?._id === p._id ? 'bg-[#c9a227]/15 text-white' : 'text-white/50 hover:bg-[#c9a227]/8 hover:text-white/80'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{p.name}</span>
                    {p.isMysteryPlayer && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">Mystery</span>}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">{displaySkills(p.skills).join(' · ')} · {p.basePrice}pts</div>
                  {p.status === 'resold' && <span className="text-[10px] text-orange-400/60 uppercase tracking-wider">Resold</span>}
                  {p.status === 'unsold' && <span className="text-[10px] text-red-400/60 uppercase tracking-wider">Unsold</span>}
                </button>
              ))}
              {available.length === 0 && <p className="text-white/30 text-xs text-center py-8">No players available</p>}
            </div>
          </div>
          {/* Timer duration selector + start — outside card so dropdown isn't clipped */}
          <div className="shrink-0 pt-2">
            <button onClick={startBidding} disabled={!selectedPlayer || !!activeSession || actionLoading}
              className="w-full bg-[#c9a227] text-[#0a1628] font-semibold py-2.5 rounded-lg text-sm hover:bg-[#f0c040] disabled:opacity-20 flex items-center justify-center gap-2">
              {actionLoading ? <Spinner size="sm" /> : 'Start Bidding'}
            </button>
          </div>
        </div>

        {/* Active Auction */}
        <div className={`lg:col-span-5 flex flex-col min-h-0 ${mobileTab !== 'auction' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-xl flex flex-col h-full overflow-hidden shadow-2xl">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0a1628] border-b border-[#c9a227]/15 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
              <span className="ml-2 text-white/20 text-xs">auction · {activeSession ? 'active' : 'idle'}</span>
            </div>
            {activeSession && activePlayer ? (
              <div className="flex flex-col h-full flex-1 overflow-hidden">
                <div className="relative overflow-hidden flex-1" style={{ minHeight: '260px' }}>
                  {activePlayer.photo ? (
                    <>
                      <Image src={activePlayer.photo} alt="" fill unoptimized
                        className="absolute inset-0 object-cover scale-110 blur-xl opacity-30 pointer-events-none" />
                      <Image src={activePlayer.photo} alt={activePlayer.name} fill unoptimized
                        className="absolute inset-0 object-cover"
                        style={{ objectPosition: '50% 20%' }}
                        loading="eager"
                        onError={(e) => { e.target.style.display = 'none'; }} />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-[#0d1e3a]" />
                  )}
                  <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(to bottom, rgba(10,22,40,0.05) 0%, rgba(10,22,40,0.15) 40%, rgba(10,22,40,0.80) 70%, rgba(10,22,40,0.97) 100%)' }} />

                  {/* Timer top-left — removed as per requirement */}

                  <div className="absolute top-3 right-3 bg-[#0a1628]/80 backdrop-blur border border-[#c9a227]/30 rounded-lg px-2.5 py-1.5 text-center">
                    <p className="text-white/40 text-[8px] uppercase tracking-wider">Base</p>
                    <p className="text-[#c9a227] font-black text-base tabular-nums leading-none">{activePlayer.basePrice}</p>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[#c9a227]/70 text-[10px] uppercase tracking-widest">{displaySkills(activePlayer.skills)[0]}</p>
                      {activePlayer.gender && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${activePlayer.gender === 'Female' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                          {activePlayer.gender}
                        </span>
                      )}
                      {activePlayer.isMysteryPlayer && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">Mystery</span>
                      )}
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-black text-white uppercase leading-none tracking-tight mb-2">
                      {activePlayer.name}
                    </h2>
                    <div className="flex flex-wrap gap-1.5">
                      {displaySkills(activePlayer.skills).map(s => <SkillBadge key={s} skill={s} />)}
                    </div>
                  </div>
                </div>

                {/* Bid strip */}
                <div className="shrink-0 border-t border-[#c9a227]/15 bg-[#0a1628]/60">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#c9a227]/10">
                    <div>
                      <p className="text-white/40 text-[9px] uppercase tracking-widest">Current Bid</p>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-4xl font-black text-[#c9a227] tabular-nums leading-none">{activeSession.currentBid}</span>
                        <span className="text-white/40 text-sm">pts</span>
                      </div>
                    </div>
                    {activeSession.currentHighestBidderName && (
                      <div className="text-right">
                        <p className="text-white/30 text-[9px] uppercase tracking-wider">Leading</p>
                        <p className="text-white/80 text-sm font-bold">{activeSession.currentHighestBidderName}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3">
                    <button onClick={markSold} disabled={!activeSession.currentHighestBidder || actionLoading}
                      className="bg-[#c9a227] text-[#0a1628] font-black py-3 rounded-xl text-sm hover:bg-[#f0c040] disabled:opacity-20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]">
                      {actionLoading ? <Spinner size="sm" /> : 'Mark Sold'}
                    </button>
                    <button onClick={markUnsold} disabled={actionLoading}
                      className="bg-white/5 border border-white/10 text-white/50 font-semibold py-3 rounded-xl text-sm hover:bg-white/10 hover:text-white transition-all">
                      Mark Unsold
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <p className="text-white/20 text-4xl mb-3">—</p>
                <p className="text-white/40 text-sm">No active auction</p>
                <p className="text-white/20 text-xs mt-1">Select a player and start bidding</p>
              </div>
            )}
          </div>
        </div>

        {/* Bids + Resale */}
        <div className={`lg:col-span-4 flex flex-col gap-3 min-h-0 ${mobileTab !== 'bids' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-xl flex flex-col flex-1 overflow-hidden shadow-2xl">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0a1628] border-b border-[#c9a227]/15 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
              <span className="ml-2 text-white/20 text-xs">bid-feed · {bidHistory.length} bids</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
              {bidHistory.length === 0 && <p className="text-white/30 text-xs text-center py-6">No bids yet</p>}
              {bidHistory.map((b, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${i === 0 ? 'bg-[#c9a227]/12 border border-[#c9a227]/20' : 'bg-[#c9a227]/5'}`}>
                  <span className="text-white/60 truncate mr-2">{b.teamName}</span>
                  <span className="text-white font-semibold shrink-0">{b.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {resaleCandidates.length > 0 && (
            <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0a1628] border-b border-[#c9a227]/15 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
                <span className="ml-2 text-white/20 text-xs">resale · {resaleCandidates.length} players</span>
              </div>
              <div className="p-3 space-y-1.5">
                {resaleCandidates.map(({ team: t, player: p }) => (
                  <div key={p._id} className="flex items-center justify-between gap-2 bg-[#0a1628]/60 rounded-lg px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm text-white font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-white/40 truncate">{t.name} · <span className="text-[#c9a227]/70">{p.soldPrice} pts</span></p>
                    </div>
                    <button
                      onClick={() => triggerResale(p._id, p.name)}
                      disabled={actionLoading}
                      className="shrink-0 text-xs bg-orange-500/10 border border-orange-500/25 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
                      Trigger
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

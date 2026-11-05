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
import { CricketIcon, FootballIcon } from '@/components/SportIcons';

export default function AuctionControlView({ sport = 'cricket' }) {
  const { request } = useApi();
  const socket = useSocket();
  const toast = useToast();

  const isFootball = sport === 'football';
  const sportLabel = isFootball ? 'Football' : 'Cricket';

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
  const [finalizingState, setFinalizingState] = useState(null);
  const [finalizingCountdown, setFinalizingCountdown] = useState(0);

  const loadData = useCallback(async () => {
    const [pRes, sRes, tRes] = await Promise.all([
      request(`/api/players?pageSize=500&sport=${sport}`),
      request(`/api/auction/active?sport=${sport}`),
      request(`/api/teams?sport=${sport}`),
    ]);
    if (pRes) setPlayers(pRes.players || []);
    if (tRes) setTeams(tRes.teams || []);
    if (sRes?.session) {
      setActiveSession(sRes.session);
      setActivePlayer(sRes.session.playerId);
      setBidHistory(sRes.session.bids?.slice().reverse() || []);
      setTimer({ remaining: sRes.session.timerRemaining, paused: sRes.session.timerPaused });
      if (sRes.session.status === 'finalizing') {
        const elapsed = Math.floor((Date.now() - new Date(sRes.session.finalizingAt || Date.now()).getTime()) / 1000);
        const rem = Math.max(0, 3 - elapsed);
        setFinalizingState({
          sessionId: sRes.session._id,
          action: sRes.session.finalizingAction || 'sold',
          leaderTeamName: sRes.session.currentHighestBidderName,
          winningBid: sRes.session.currentBid,
        });
        setFinalizingCountdown(rem);
      } else {
        setFinalizingState(null);
        setFinalizingCountdown(0);
      }
    } else {
      setActiveSession(null); setActivePlayer(null);
      setFinalizingState(null); setFinalizingCountdown(0);
      setTimer({ remaining: null, paused: false });
    }
    setLoading(false);
  }, [request, sport]);

  useEffect(() => {
    if (!finalizingState) return;
    const interval = setInterval(() => {
      setFinalizingCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [finalizingState]);

  useEffect(() => { loadData(); }, [loadData]);

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
    socket.emit('join:sport', sport);
    const matchSport = (evSport) => !evSport || evSport === sport;

    socket.on('auction:start', ({ session, player, sport: evSport }) => {
      if (!matchSport(evSport)) return;
      setActiveSession(session); setActivePlayer(player); setBidHistory([]);
      setTimer({ remaining: session.timerRemaining, paused: false });
      setMobileTab('auction');
    });
    socket.on('auction:bid_update', (data) => {
      if (!matchSport(data.sport)) return;
      setActiveSession(prev => prev ? {
        ...prev,
        currentBid: data.currentBid,
        currentHighestBidderName: data.bidderTeamName,
        currentHighestBidder: data.bidderTeamId,
      } : prev);
      setBidHistory(prev => [{ teamName: data.bidderTeamName, amount: data.currentBid }, ...prev]);
    });
    socket.on('auction:timer', (data) => {
      if (!matchSport(data.sport)) return;
      setTimer(data);
    });
    socket.on('auction:finalizing', (data) => {
      if (!matchSport(data.sport)) return;
      setFinalizingState(data);
      setFinalizingCountdown(data.countdown || 3);
      if (data.action === 'sold') {
        toast(`Sale initiated for ${data.leaderTeamName || 'leader'}... Finalizing in 3s`, 'info');
      } else {
        toast('Marking unsold... Finalizing in 3s', 'info');
      }
    });
    socket.on('auction:sold', ({ player, team, sport: evSport }) => {
      if (!matchSport(evSport)) return;
      setFinalizingState(null);
      setFinalizingCountdown(0);
      setActionLoading(false);
      toast(`${player.name} → ${team.name}`, 'success');
      setActiveSession(null); setActivePlayer(null); setBidHistory([]);
      setTimer({ remaining: null, paused: false });
      loadData();
    });
    socket.on('auction:unsold', ({ player, sport: evSport }) => {
      if (!matchSport(evSport)) return;
      setFinalizingState(null);
      setFinalizingCountdown(0);
      setActionLoading(false);
      toast(`${player.name} unsold`, 'info');
      setActiveSession(null); setActivePlayer(null); setBidHistory([]);
      setTimer({ remaining: null, paused: false });
      loadData();
    });
    socket.on('players:updated', (data) => {
      if (!data?.sport || matchSport(data.sport)) loadData();
    });
    return () => {
      socket.off('auction:start'); socket.off('auction:bid_update');
      socket.off('auction:timer'); socket.off('auction:finalizing');
      socket.off('auction:sold'); socket.off('auction:unsold');
      socket.off('players:updated');
    };
  }, [socket, toast, loadData, sport]);

  const startBidding = async () => {
    if (!selectedPlayer) return toast('Select a player first', 'warning');
    setActionLoading(true);
    const res = await request('/api/auction/start', {
      method: 'POST',
      body: JSON.stringify({ playerId: selectedPlayer._id, timerDuration, sport }),
    });
    setActionLoading(false);
    if (res?.error) toast(res.error, 'error');
    else {
      setActiveSession(res.session); setActivePlayer(res.player); setBidHistory([]);
      setTimer({ remaining: res.session.timerRemaining, paused: false });
      setMobileTab('auction');
    }
  };

  const markSold = async () => {
    if (!activeSession || finalizingState || actionLoading) return;
    setActionLoading(true);
    const res = await request('/api/auction/sold', { method: 'POST', body: JSON.stringify({ sessionId: activeSession._id }) });
    if (res?.error) {
      setActionLoading(false);
      toast(res.error, 'error');
      return;
    }
    if (res?.status === 'finalizing') {
      setFinalizingState({
        sessionId: activeSession._id,
        action: 'sold',
        leaderTeamName: activeSession.currentHighestBidderName,
        winningBid: activeSession.currentBid,
      });
      setFinalizingCountdown(3);
    }
  };

  const markUnsold = async () => {
    if (!activeSession || finalizingState || actionLoading) return;
    setActionLoading(true);
    const res = await request('/api/auction/unsold', { method: 'POST', body: JSON.stringify({ sessionId: activeSession._id }) });
    if (res?.error) {
      setActionLoading(false);
      toast(res.error, 'error');
      return;
    }
    if (res?.status === 'finalizing') {
      setFinalizingState({
        sessionId: activeSession._id,
        action: 'unsold',
      });
      setFinalizingCountdown(3);
    }
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

  const available = players
    .filter(p => ['available', 'resold', 'unsold'].includes(p.status))
    .filter(p => !queueSearch.trim() || p.name.toLowerCase().includes(queueSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 48px)' }}>
      {/* Header + tabs */}
      <div className="shrink-0 px-4 lg:px-6 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            {isFootball ? <FootballIcon className="w-5 h-5 text-[#c9a227]" /> : <CricketIcon className="w-5 h-5 text-[#c9a227]" />}
            <span>{sportLabel} Auction Control</span>
          </h1>
          {activeSession && (
            <span className="flex items-center gap-1.5 text-xs text-white/40 bg-[#c9a227]/8 border border-[#c9a227]/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="flex lg:hidden border border-[#c9a227]/20 rounded-lg overflow-hidden">
          {['queue', 'auction', 'bids'].map(t => (
            <button key={t} onClick={() => setMobileTab(t)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${mobileTab === t ? 'bg-[#c9a227]/15 text-white' : 'text-white/30'}`}>
              {t === 'queue' ? 'Queue' : t === 'auction' ? 'Auction' : 'Bids'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 px-4 lg:px-6 pb-4 lg:pb-6 overflow-y-auto overflow-x-hidden">
        {/* Queue Column */}
        <div className={`lg:col-span-3 flex flex-col min-h-0 overflow-visible ${mobileTab !== 'queue' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-xl flex flex-col h-full overflow-hidden shadow-2xl">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0a1628] border-b border-[#c9a227]/15 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
              <span className="ml-2 text-white/20 text-xs">queue · {available.length} {sportLabel.toLowerCase()} players</span>
            </div>
            <div className="px-2 pt-2 shrink-0">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/25 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  value={queueSearch}
                  onChange={e => setQueueSearch(e.target.value)}
                  placeholder={`Search ${sportLabel.toLowerCase()} players...`}
                  className="w-full bg-[#0a1628] border border-[#c9a227]/15 rounded-lg pl-7 pr-3 py-1.5 text-white text-xs placeholder-white/20 focus:outline-none focus:border-[#c9a227]/40 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
              {available.length === 0 && (
                <div className="text-white/20 text-xs text-center py-10">No available {sportLabel.toLowerCase()} players</div>
              )}
              {available.map(p => (
                <button key={p._id} onClick={() => setSelectedPlayer(p)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    selectedPlayer?._id === p._id ? 'bg-[#c9a227]/15 text-white' : 'text-white/50 hover:bg-[#c9a227]/8 hover:text-white/80'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{p.name}</span>
                    {p.isMysteryPlayer && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">Mystery</span>}
                  </div>
                  <div className="text-white/30 text-xs mt-0.5 flex items-center justify-between">
                    <span>{displaySkills(p.skills)[0] || '—'} · {p.gender}</span>
                    <span className="text-[#c9a227]/60 font-semibold">{p.basePrice} pts</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Stage */}
        <div className={`lg:col-span-6 flex flex-col min-h-0 ${mobileTab !== 'auction' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-xl flex-1 flex flex-col overflow-hidden shadow-2xl min-h-[460px]">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0a1628] border-b border-[#c9a227]/15 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
              <span className="ml-2 text-white/20 text-xs">auction · {sportLabel.toLowerCase()}</span>
            </div>

            <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto min-h-0">
              {activePlayer ? (
                <>
                  <div className="flex items-start gap-5">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-[#c9a227]/20 bg-[#0a1628] shrink-0">
                      {activePlayer.photo ? (
                        <Image src={activePlayer.photo} alt={activePlayer.name} fill unoptimized className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-10 h-10 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white/40 text-xs uppercase tracking-wider">{activePlayer.gender}</span>
                        {activePlayer.isMysteryPlayer && <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">Mystery</span>}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">{activePlayer.name}</h2>
                      <div className="flex flex-wrap gap-1.5 mb-3">{displaySkills(activePlayer.skills).map(s => <SkillBadge key={s} skill={s} />)}</div>
                      <div className="text-white/40 text-xs">Base: <span className="text-[#c9a227] font-semibold">{activePlayer.basePrice} pts</span></div>
                    </div>
                  </div>

                  <div className="my-6 bg-[#0a1628]/60 border border-[#c9a227]/15 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Current Highest Bid</p>
                      <div className="text-3xl sm:text-4xl font-black text-[#c9a227] tabular-nums">{activeSession?.currentBid} <span className="text-sm font-normal text-white/40">pts</span></div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Leader</p>
                      <span className="text-base font-bold text-white">{activeSession?.currentHighestBidderName || '— No bids yet —'}</span>
                    </div>
                  </div>

                  {/* Finalizing overlay indicator */}
                  {finalizingState && (
                    <div className="mb-4 bg-[#c9a227]/15 border border-[#c9a227]/50 rounded-xl p-3 flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227] animate-ping" />
                        <span className="text-xs font-bold text-[#c9a227]">
                          Finalizing {finalizingState.action === 'sold' ? `Sale to ${finalizingState.leaderTeamName}` : 'Unsold'}
                        </span>
                      </div>
                      <span className="text-xs font-black text-[#c9a227] tabular-nums">{finalizingCountdown}s</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={markSold}
                      disabled={!activeSession?.currentHighestBidder || actionLoading || Boolean(finalizingState)}
                      className="bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                      SOLD
                    </button>
                    <button
                      onClick={markUnsold}
                      disabled={actionLoading || Boolean(finalizingState)}
                      className="bg-red-600/80 hover:bg-red-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                      UNSOLD
                    </button>
                  </div>
                </>
              ) : selectedPlayer ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <h3 className="text-xl font-bold text-white mb-2">{selectedPlayer.name}</h3>
                  <p className="text-white/40 text-xs mb-6">Base Price: {selectedPlayer.basePrice} pts</p>
                  <button
                    onClick={startBidding}
                    disabled={actionLoading}
                    className="bg-[#c9a227] text-[#0a1628] font-bold px-8 py-3 rounded-xl hover:bg-[#f0c040] transition-colors shadow-lg">
                    {actionLoading ? <Spinner size="sm" /> : `Start Auction for ${selectedPlayer.name}`}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 text-white/30">
                  <p className="text-sm">Select a {sportLabel.toLowerCase()} player from the queue to start bidding</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Bids */}
        <div className={`lg:col-span-3 flex flex-col min-h-0 ${mobileTab !== 'bids' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-xl flex flex-col h-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-3 py-2 bg-[#0a1628] border-b border-[#c9a227]/15 shrink-0">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Bid History</span>
              <span className="text-[#c9a227] text-xs font-bold">{bidHistory.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {bidHistory.length === 0 ? (
                <p className="text-white/20 text-xs text-center py-12">No bids recorded</p>
              ) : (
                bidHistory.map((b, i) => (
                  <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${i === 0 ? 'bg-[#c9a227]/15 text-[#c9a227] font-bold' : 'text-white/50'}`}>
                    <span>{b.teamName}</span>
                    <span className="tabular-nums font-bold">{b.amount} pts</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

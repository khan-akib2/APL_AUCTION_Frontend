'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useApi } from '@/hooks/useApi';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/Toast';
import Spinner from '@/components/Spinner';
import { CricketIcon, FootballIcon } from '@/components/SportIcons';
import SkillBadge from '@/components/SkillBadge';
import AuctionTimer from '@/components/AuctionTimer';
import BigCountdownOverlay from '@/components/BigCountdownOverlay';
import { playTimerUrgentSound } from '@/lib/sounds';
import { displaySkills } from '@/lib/skills';

function dedupeBids(bids) {
  if (!Array.isArray(bids)) return [];
  const result = [];
  for (const b of bids) {
    const last = result[result.length - 1];
    if (
      last &&
      Number(last.amount) === Number(b.amount) &&
      String(last.teamName || '').trim().toLowerCase() === String(b.teamName || '').trim().toLowerCase()
    ) {
      continue;
    }
    result.push(b);
  }
  return result;
}

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
  const [queueSearch, setQueueSearch] = useState('');
  const [finalizingState, setFinalizingState] = useState(null);
  const [finalizingCountdown, setFinalizingCountdown] = useState(0);
  const [timer, setTimer] = useState({ remaining: null, paused: false });
  const [timerSecondsInput, setTimerSecondsInput] = useState('6');
  const [liveTimerInput, setLiveTimerInput] = useState('');

  const loadData = useCallback(async () => {
    const [pRes, sRes] = await Promise.all([
      request(`/api/players?pageSize=500&sport=${sport}`),
      request(`/api/auction/active?sport=${sport}`),
    ]);
    if (pRes) setPlayers(pRes.players || []);
    if (sRes?.session) {
      setActiveSession(sRes.session);
      setActivePlayer(sRes.session.playerId);
      setBidHistory(dedupeBids(sRes.session.bids).slice().reverse());
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
    } else if (sRes && !sRes.error) {
      setActiveSession(null);
      setActivePlayer(null);
      setBidHistory([]);
      setTimer({ remaining: null, paused: false });
      setFinalizingState(null);
      setFinalizingCountdown(0);
    }
    setLoading(false);
  }, [request, sport]);

  useEffect(() => {
    if (!finalizingState) return;
    const interval = setInterval(() => {
      setFinalizingCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Safety fallback: if socket event is delayed, auto-reload to ensure player is cleared
          setTimeout(() => {
            loadData();
          }, 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [finalizingState, loadData]);

  useEffect(() => { loadData(); }, [loadData]);

  // Socket room isolation and live event listening
  useEffect(() => {
    if (!socket) return;
    const roomName = `auction:${sport}`;
    socket.emit('join:sport', sport);
    socket.emit('joinRoom', { room: roomName, sport });

    const handlePlayerNominated = (data) => {
      if (data?.sport && data.sport !== sport) return;
      const s = data.session;
      const p = data.player || s?.playerId;
      setActiveSession(s);
      setActivePlayer(p);
      setSelectedPlayer(p);
      setBidHistory([]);
      setTimer({ remaining: s?.timerRemaining ?? 6, paused: false });
      setFinalizingState(null);
      setFinalizingCountdown(0);
      loadData();
    };

    const handleBidPlaced = (data) => {
      if (data?.sport && data.sport !== sport) return;
      const amount = data.amount ?? data.currentBid;
      const teamId = data.teamId ?? data.bidderTeamId;
      const teamName = data.teamName ?? data.bidderTeamName;
      if (amount === undefined || amount === null || !teamName) return;

      const numAmt = Number(amount);
      const normTeam = String(teamName).trim().toLowerCase();

      setActiveSession(prev => prev ? {
        ...prev,
        currentBid: numAmt,
        currentHighestBidder: teamId,
        currentHighestBidderName: teamName,
      } : prev);

      setBidHistory(prev => {
        if (
          prev.length > 0 &&
          Number(prev[0].amount) === numAmt &&
          String(prev[0].teamName || '').trim().toLowerCase() === normTeam
        ) {
          return prev;
        }
        return [{
          teamName,
          amount: numAmt,
          createdAt: data.createdAt || data.timestamp || new Date().toISOString(),
        }, ...prev];
      });
    };

    const handleTimerTick = (data) => {
      if (data?.sport && data.sport !== sport) return;
      setTimer({ remaining: data.remaining, paused: data.paused });
      if (data.remaining <= 3 && data.remaining > 0) playTimerUrgentSound();
    };

    const handleFinalizing = (data) => {
      if (data?.sport && data.sport !== sport) return;
      setFinalizingState(data);
      setFinalizingCountdown(data.countdown || 3);
    };

    const handleSold = (data) => {
      if (data?.sport && data.sport !== sport) return;
      const teamName = data.teamName || data.team?.name || 'winning team';
      const amount = data.amount ?? data.session?.currentBid ?? data.player?.soldPrice ?? '';
      toast(`Player SOLD to ${teamName} for ${amount} pts!`, 'success');
      setActiveSession(null);
      setActivePlayer(null);
      setSelectedPlayer(null);
      setBidHistory([]);
      setTimer({ remaining: null, paused: false });
      setFinalizingState(null);
      setFinalizingCountdown(0);
      loadData();
    };

    const handleUnsold = (data) => {
      if (data?.sport && data.sport !== sport) return;
      toast('Player marked UNSOLD', 'info');
      setActiveSession(null);
      setActivePlayer(null);
      setSelectedPlayer(null);
      setBidHistory([]);
      setTimer({ remaining: null, paused: false });
      setFinalizingState(null);
      setFinalizingCountdown(0);
      loadData();
    };

    socket.on('auction:start', handlePlayerNominated);
    socket.on('auction:bid_update', handleBidPlaced);
    socket.on('auction:timer', handleTimerTick);
    socket.on('auction:finalizing', handleFinalizing);
    socket.on('auction:sold', handleSold);
    socket.on('auction:unsold', handleUnsold);

    socket.on('players:updated', () => loadData());
    socket.on('auction:resale', () => loadData());
    socket.on('teams:reset', () => loadData());

    return () => {
      socket.emit('leaveRoom', { room: roomName, sport });
      socket.off('auction:start', handlePlayerNominated);
      socket.off('auction:bid_update', handleBidPlaced);
      socket.off('auction:timer', handleTimerTick);
      socket.off('auction:finalizing', handleFinalizing);
      socket.off('auction:sold', handleSold);
      socket.off('auction:unsold', handleUnsold);
      socket.off('players:updated');
      socket.off('auction:resale');
      socket.off('teams:reset');
    };
  }, [socket, sport, loadData, toast]);

  const startBidding = async (playerId) => {
    const targetId = playerId || selectedPlayer?._id;
    if (!targetId) return toast('Select a player to auction', 'warning');
    if (activeSession) return toast('An auction is currently active', 'warning');

    const duration = Math.max(3, parseInt(timerSecondsInput, 10) || 6);

    setActionLoading(true);
    const res = await request('/api/auction/start', {
      method: 'POST',
      body: JSON.stringify({ playerId: targetId, sport, timerDuration: duration }),
    });
    setActionLoading(false);
    if (res?.error) {
      toast(res.error, 'error');
      return;
    }
    if (res?.session) {
      setActiveSession(res.session);
      const p = res.player || res.session.playerId;
      setActivePlayer(p);
      setSelectedPlayer(p);
      setBidHistory([]);
      setTimer({ remaining: res.session.timerRemaining ?? duration, paused: false });
      setFinalizingState(null);
      setFinalizingCountdown(0);
    }
    toast(`Live bidding started (${duration}s timer)!`, 'success');
    loadData();
  };

  const togglePauseTimer = async () => {
    if (!activeSession) return;
    const isCurrentlyPaused = Boolean(timer.paused);
    const endpoint = isCurrentlyPaused ? '/api/auction/timer/resume' : '/api/auction/timer/pause';
    setActionLoading(true);
    const res = await request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ sport }),
    });
    setActionLoading(false);
    if (res?.error) {
      toast(res.error, 'error');
    } else {
      toast(isCurrentlyPaused ? 'Timer resumed' : 'Timer paused', 'info');
      setTimer(prev => ({ ...prev, paused: !isCurrentlyPaused }));
    }
  };

  const handleSetLiveTimer = async (secondsOverride) => {
    if (!activeSession) return;
    const sec = Number(secondsOverride !== undefined ? secondsOverride : liveTimerInput);
    if (!sec || sec < 1) return toast('Enter valid seconds', 'warning');
    setActionLoading(true);
    const res = await request('/api/auction/timer/set', {
      method: 'POST',
      body: JSON.stringify({ sport, seconds: sec }),
    });
    setActionLoading(false);
    if (res?.error) {
      toast(res.error, 'error');
    } else {
      toast(`Timer set to ${sec}s`, 'success');
      setLiveTimerInput('');
    }
  };

  const handleAddLiveSeconds = async (addSec) => {
    if (!activeSession) return;
    const current = Number(timer.remaining) || 0;
    handleSetLiveTimer(current + addSec);
  };

  const markSold = async () => {
    if (!activeSession) return;
    if (!activeSession.currentHighestBidder) return toast('No bids placed yet', 'warning');
    setActionLoading(true);
    const res = await request('/api/auction/sold', {
      method: 'POST',
      body: JSON.stringify({ sessionId: activeSession._id, sport }),
    });
    setActionLoading(false);
    if (res?.error) {
      toast(res.error, 'error');
    } else {
      toast('Finalizing 3-second countdown initiated...', 'info');
      if (res?.session) {
        setActiveSession(res.session);
        setFinalizingState({
          sessionId: res.session._id,
          action: 'sold',
          leaderTeamName: res.session.currentHighestBidderName,
          winningBid: res.session.currentBid,
        });
        setFinalizingCountdown(res.countdown || 3);
      }
    }
  };

  const markUnsold = async () => {
    if (!activeSession) return;
    setActionLoading(true);
    const res = await request('/api/auction/unsold', {
      method: 'POST',
      body: JSON.stringify({ sessionId: activeSession._id, sport }),
    });
    setActionLoading(false);
    if (res?.error) {
      toast(res.error, 'error');
    } else {
      toast('Finalizing unsold...', 'info');
      if (res?.session) {
        setActiveSession(res.session);
        setFinalizingState({
          sessionId: res.session._id,
          action: 'unsold',
        });
        setFinalizingCountdown(res.countdown || 3);
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 bg-[#f8f6f0]">
      <Spinner size="lg" />
    </div>
  );

  const availableQueue = players.filter(p => p.status === 'available' && p.name.toLowerCase().includes(queueSearch.toLowerCase()));
  const resalePlayers = players.filter(p => ['unsold', 'resold'].includes(p.status));

  return (
    <div className="flex flex-col bg-[#f8f6f0] text-[#111827]" style={{ height: 'calc(100vh - 48px)' }}>
      {/* Top Title Bar */}
      <div className="shrink-0 px-4 lg:px-8 py-4 border-b border-[#e8e2d5] bg-white flex items-center justify-between">
        <h1 className="text-xl font-bold font-serif text-[#111827] flex items-center gap-2.5">
          {isFootball ? (
            <FootballIcon className="w-5 h-5 text-[#0d3a24]" />
          ) : (
            <CricketIcon className="w-5 h-5 text-[#c59b27]" />
          )}
          <span>Auction Control</span>
        </h1>
        {activeSession && (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full animate-pulse bg-emerald-600" />
            Live Bidding
          </span>
        )}
      </div>

      {/* Main 3-Column Content Layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:p-6 overflow-hidden">

        {/* COLUMN 1 (LEFT): Queue */}
        <div className="lg:col-span-3 flex flex-col min-h-0 overflow-hidden">
          <div className="bg-white border border-[#e8e2d5] rounded-2xl flex flex-col h-full overflow-hidden shadow-sm">
            {/* Header with dots */}
            <div className="flex items-center gap-1.5 px-4 py-3 bg-[#faf8f5] border-b border-[#e8e2d5] shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0d3a24]/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#c59b27]/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
              <span className="ml-2 text-[#6b7280] text-xs font-mono font-medium">queue · {availableQueue.length} players</span>
            </div>

            {/* Search Input */}
            <div className="p-3 shrink-0 bg-white">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={queueSearch}
                  onChange={e => setQueueSearch(e.target.value)}
                  placeholder="Search players..."
                  className="w-full bg-[#faf8f5] border border-[#e8e2d5] rounded-xl pl-8 pr-3 py-2 text-[#111827] text-xs placeholder-[#9ca3af] focus:outline-none focus:border-[#0d3a24] transition-colors"
                />
              </div>
            </div>

            {/* Player List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1 min-h-0 divide-y divide-gray-100">
              {availableQueue.length === 0 && (
                <div className="text-[#9ca3af] text-xs text-center py-12">No players in queue</div>
              )}
              {availableQueue.map(p => {
                const isSelected = selectedPlayer?._id === p._id;
                return (
                  <button
                    key={p._id}
                    onClick={() => setSelectedPlayer(p)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                      isSelected
                        ? 'bg-[#0d3a24]/10 text-[#0d3a24] border-l-4 border-[#0d3a24] font-bold shadow-sm'
                        : 'text-[#4b5563] hover:bg-[#faf8f5] hover:text-[#111827]'
                    }`}
                  >
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <div className="text-[#c59b27] text-xs font-bold mt-0.5">- {p.basePrice}pts</div>
                  </button>
                );
              })}
            </div>

            {/* Fixed Bottom Controls: Timer Duration & Start Bidding */}
            <div className="p-3.5 border-t border-[#e8e2d5] shrink-0 bg-[#faf8f5]">
              <div className="mb-2.5 bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                    <svg className="w-3.5 h-3.5 text-[#0d3a24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" strokeWidth="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7v5l3 2" />
                    </svg>
                    Bidding Timer:
                  </span>
                  <span className="font-black text-xs text-[#0d3a24] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    {Math.max(3, parseInt(timerSecondsInput, 10) || 6)}s
                  </span>
                </div>

                {/* Preset Pills */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[6, 10, 15, 30].map(sec => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTimerSecondsInput(String(sec))}
                      className={`py-1 rounded-lg text-xs font-bold transition-all border ${
                        parseInt(timerSecondsInput, 10) === sec
                          ? 'bg-[#0d3a24] text-white border-[#0d3a24] shadow-xs'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>

                {/* Direct Editable Seconds Input */}
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-stone-100">
                  <label htmlFor="custom-sec-input" className="text-[11px] text-stone-600 font-semibold shrink-0">
                    Editable seconds:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="custom-sec-input"
                      type="number"
                      min="3"
                      max="300"
                      value={timerSecondsInput}
                      onChange={(e) => setTimerSecondsInput(e.target.value)}
                      onBlur={() => {
                        const val = parseInt(timerSecondsInput, 10);
                        if (isNaN(val) || val < 3) setTimerSecondsInput('6');
                        else if (val > 300) setTimerSecondsInput('300');
                      }}
                      className="w-16 px-2 py-1 text-xs font-black text-center bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-[#0d3a24] focus:bg-white transition-colors"
                      placeholder="e.g. 10"
                    />
                    <span className="text-xs text-stone-500 font-bold">sec</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => startBidding()}
                disabled={!selectedPlayer || Boolean(activeSession) || actionLoading}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  selectedPlayer && !activeSession
                    ? 'bg-[#0d3a24] hover:bg-[#154d32] text-white shadow-md'
                    : 'bg-stone-100 text-[#9ca3af] cursor-not-allowed border border-stone-200'
                }`}
              >
                {actionLoading ? (
                  <Spinner size="sm" />
                ) : (
                  `Start Bidding (${Math.max(3, parseInt(timerSecondsInput, 10) || 6)}s)`
                )}
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2 (CENTER): Active Auction Stage */}
        <div className="lg:col-span-6 flex flex-col min-h-0 overflow-hidden">
          <div className="bg-white border border-[#e8e2d5] rounded-2xl flex-1 flex flex-col overflow-hidden shadow-sm min-h-[460px]">
            {/* Header with dots */}
            <div className="flex items-center gap-1.5 px-4 py-3 bg-[#faf8f5] border-b border-[#e8e2d5] shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0d3a24]/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#c59b27]/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
              <span className="ml-2 text-[#6b7280] text-xs font-mono font-medium">auction · active stage</span>
            </div>

            {/* Stage Body */}
            <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto min-h-0 relative">
              {activePlayer ? (
                <>
                  {/* Active Player Card with Full Bleed Photo & Overlays matching Image 2 */}
                  <div className="relative rounded-3xl overflow-hidden shadow-md flex-1 min-h-[300px] border border-[#e8e2d5] bg-white flex flex-col justify-end mb-4">
                    {activePlayer.photo ? (
                      <>
                        <Image
                          src={activePlayer.photo}
                          alt=""
                          fill
                          unoptimized
                          className="absolute inset-0 object-cover scale-110 blur-xl opacity-30 pointer-events-none"
                        />
                        <Image
                          src={activePlayer.photo}
                          alt={activePlayer.name}
                          fill
                          unoptimized
                          className="absolute inset-0 object-cover"
                          style={{ objectPosition: '50% 20%' }}
                          loading="eager"
                        />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-[#faf8f5] flex items-center justify-center">
                        {isFootball ? (
                          <FootballIcon className="w-20 h-20 text-[#0d3a24]/20" />
                        ) : (
                          <CricketIcon className="w-20 h-20 text-[#c59b27]/20" />
                        )}
                      </div>
                    )}

                    {/* Full Bleed Gradient Overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(13,58,36,0.2) 35%, rgba(13,58,36,0.85) 70%, rgba(13,58,36,0.98) 100%)'
                      }}
                    />

                    {/* Base price badge top-left (matching Image 2) */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur border border-[#e8e2d5] rounded-2xl px-3.5 py-2 text-center shadow-sm z-10">
                      <p className="text-[#6b7280] text-[9px] uppercase tracking-wider font-bold">Base</p>
                      <p className="text-[#0d3a24] font-black text-lg tabular-nums leading-none">{activePlayer.basePrice} pts</p>
                    </div>

                    {/* Live 6-second countdown timer badge top-right */}
                    {timer.remaining !== null && (
                      <div className="absolute top-4 right-4 z-10">
                        <AuctionTimer remaining={timer.remaining} paused={timer.paused} size="lg" />
                      </div>
                    )}

                    {/* Big Glowing Countdown Overlay (3, 2, 1) */}
                    <BigCountdownOverlay remaining={timer.remaining} paused={timer.paused} />

                    {/* Player info — bottom overlay */}
                    <div className="relative z-10 px-6 pb-5 pt-10 text-white">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-[#d8b04a] text-xs uppercase tracking-widest font-bold">
                          {displaySkills(activePlayer.skills || [])[0] || (activePlayer.gender ? activePlayer.gender.toUpperCase() : (isFootball ? 'FORWARD' : 'BATSMAN'))}
                        </p>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black uppercase leading-tight tracking-tight mb-2 truncate drop-shadow-md">
                        {activePlayer.name}
                      </h1>
                      <div className="flex flex-wrap gap-1.5">
                        {displaySkills(activePlayer.skills || []).map(s => <SkillBadge key={s} skill={s} />)}
                      </div>
                    </div>
                  </div>

                  {/* Bidding Summary Box */}
                  <div className="rounded-2xl p-4 sm:p-5 mb-4 border border-[#e8e2d5] bg-[#faf8f5] flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[#6b7280] text-[10px] uppercase tracking-wider font-bold mb-0.5">CURRENT BID</p>
                      <div className="text-3xl sm:text-4xl font-black tabular-nums text-[#0d3a24]">
                        {activeSession?.currentBid ?? activePlayer.basePrice} <span className="text-xs font-normal text-[#6b7280]">pts</span>
                      </div>
                    </div>
                    {timer.remaining !== null && (
                      <div className="text-center px-2">
                        <AuctionTimer remaining={timer.remaining} paused={timer.paused} size="md" />
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-[#6b7280] text-[10px] uppercase tracking-wider font-bold mb-0.5">LEADING</p>
                      <div className="text-base font-bold text-[#c59b27] truncate max-w-[180px]">
                        {activeSession?.currentHighestBidderName || '— No bids yet —'}
                      </div>
                    </div>
                  </div>

                  {/* Live Timer Control Bar: Pause / Resume & Live Edit Seconds */}
                  {timer.remaining !== null && (
                    <div className="mb-3.5 p-3 rounded-2xl bg-white border border-[#e8e2d5] shadow-xs flex flex-wrap items-center justify-between gap-2.5">
                      {/* Pause / Resume Button */}
                      <button
                        type="button"
                        onClick={togglePauseTimer}
                        disabled={actionLoading || Boolean(finalizingState)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                          timer.paused
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50 animate-pulse'
                            : 'bg-amber-500 hover:bg-amber-600 text-white'
                        }`}
                      >
                        {timer.paused ? (
                          <>
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            <span>Resume Timer ({timer.remaining}s)</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                            <span>Pause Timer</span>
                          </>
                        )}
                      </button>

                      {/* Live Edit Seconds */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-[11px] font-bold text-stone-500">Edit Sec:</span>
                        <input
                          type="number"
                          min="1"
                          max="300"
                          value={liveTimerInput}
                          onChange={(e) => setLiveTimerInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSetLiveTimer();
                          }}
                          className="w-16 px-2 py-1 text-xs font-bold text-center bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#0d3a24] focus:bg-white"
                          placeholder={String(timer.remaining)}
                        />
                        <button
                          type="button"
                          onClick={() => handleSetLiveTimer()}
                          disabled={actionLoading || !liveTimerInput}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#0d3a24] text-white hover:bg-[#154d32] transition-all disabled:opacity-40"
                        >
                          Set
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddLiveSeconds(5)}
                          disabled={actionLoading}
                          className="px-2 py-1 text-xs font-bold rounded-lg bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200"
                          title="Add 5 seconds"
                        >
                          +5s
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddLiveSeconds(10)}
                          disabled={actionLoading}
                          className="px-2 py-1 text-xs font-bold rounded-lg bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200"
                          title="Add 10 seconds"
                        >
                          +10s
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Critical 3, 2, 1 Countdown Banner */}
                  {timer.remaining !== null && timer.remaining <= 3 && timer.remaining > 0 && !finalizingState && (
                    <div className="mb-3.5">
                      <AuctionTimer remaining={timer.remaining} paused={timer.paused} size="banner" />
                    </div>
                  )}

                  {/* Finalizing Overlay Banner */}
                  {finalizingState && (
                    <div className="mb-3.5 border border-amber-300 rounded-2xl p-3 flex items-center justify-between bg-amber-50 text-amber-900 shadow-sm animate-pulse">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full animate-ping bg-amber-600" />
                        <span className="text-xs font-bold">
                          Finalizing {finalizingState.action === 'sold' ? `Sale to ${finalizingState.leaderTeamName}` : 'Unsold'}...
                        </span>
                      </div>
                      <span className="text-xs font-black tabular-nums">{finalizingCountdown}s</span>
                    </div>
                  )}

                  {/* Action Buttons: Mark Sold / Mark Unsold */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={markSold}
                      disabled={!activeSession?.currentHighestBidder || actionLoading || Boolean(finalizingState)}
                      className={`py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        activeSession?.currentHighestBidder && !finalizingState
                          ? 'bg-[#c59b27] hover:bg-[#d8aa2b] text-white shadow-md'
                          : 'bg-stone-100 text-[#9ca3af] cursor-not-allowed border border-stone-200'
                      }`}
                    >
                      {actionLoading ? <Spinner size="sm" /> : 'Mark Sold'}
                    </button>
                    <button
                      onClick={markUnsold}
                      disabled={!activeSession || actionLoading || Boolean(finalizingState)}
                      className="bg-[#f4efe6] hover:bg-[#eae3d5] text-[#374151] font-semibold py-3 rounded-xl border border-[#e8e2d5] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Mark Unsold
                    </button>
                  </div>
                </>
              ) : (
                /* Empty Stage */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#9ca3af]">
                  <div className="w-16 h-16 rounded-full border border-[#e8e2d5] flex items-center justify-center mb-3 bg-[#faf8f5]">
                    {isFootball ? (
                      <FootballIcon className="w-8 h-8 text-[#0d3a24]/40" />
                    ) : (
                      <CricketIcon className="w-8 h-8 text-[#c59b27]/40" />
                    )}
                  </div>
                  <p className="text-[#111827] font-bold text-sm mb-1">No Active Auction</p>
                  <p className="text-[#6b7280] text-xs max-w-xs">Select a player from the queue or resale list and click Start Bidding</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 3 (RIGHT): Two Stacked Panels (Bid-Feed & Resale) */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0 overflow-hidden">

          {/* Top Panel: Bid Feed */}
          <div className="bg-white border border-[#e8e2d5] rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm">
            {/* Header with dots */}
            <div className="flex items-center gap-1.5 px-4 py-3 bg-[#faf8f5] border-b border-[#e8e2d5] shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0d3a24]/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#c59b27]/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
              <span className="ml-2 text-[#6b7280] text-xs font-mono font-medium">bid-feed · {bidHistory.length} bids</span>
            </div>

            {/* Live Bids List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 min-h-0">
              {bidHistory.length === 0 ? (
                <div className="text-[#9ca3af] text-xs text-center py-8">No live bids placed yet</div>
              ) : (
                bidHistory.map((b, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs shadow-sm ${
                      i === 0
                        ? 'bg-amber-50 border-amber-200 text-[#111827]'
                        : 'bg-[#faf8f5] border-[#e8e2d5] text-[#4b5563]'
                    }`}
                  >
                    <span className="font-bold truncate max-w-[150px]">{b.teamName}</span>
                    <span className={`font-black tabular-nums text-sm ${i === 0 ? 'text-[#c59b27]' : 'text-[#0d3a24]'}`}>
                      {b.amount} pts
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Panel: Resale Queue */}
          <div className="bg-white border border-[#e8e2d5] rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm">
            {/* Header with dots */}
            <div className="flex items-center gap-1.5 px-4 py-3 bg-[#faf8f5] border-b border-[#e8e2d5] shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0d3a24]/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#c59b27]/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
              <span className="ml-2 text-[#6b7280] text-xs font-mono font-medium">resale · {resalePlayers.length} players</span>
            </div>

            {/* Resale Players List with Trigger Buttons */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 min-h-0">
              {resalePlayers.length === 0 ? (
                <div className="text-[#9ca3af] text-xs text-center py-8">No players in resale queue</div>
              ) : (
                resalePlayers.map(p => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-[#e8e2d5] gap-2 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-[#111827] truncate">{p.name}</div>
                      <div className="text-[#6b7280] text-[11px] truncate">
                        {p.status === 'resold' ? `${p.soldTo?.name || 'Previous Team'} · ${p.soldPrice || p.basePrice} pts` : `Unsold · ${p.basePrice} pts`}
                      </div>
                    </div>
                    <button
                      onClick={() => startBidding(p._id)}
                      disabled={Boolean(activeSession) || actionLoading}
                      className="text-xs font-bold px-3 py-1 rounded-lg border border-[#c59b27] bg-[#c59b27] hover:bg-[#d8aa2b] text-white shadow-sm transition-all shrink-0 disabled:opacity-40"
                    >
                      Trigger
                    </button>
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

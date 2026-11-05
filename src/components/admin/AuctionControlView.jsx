'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useApi } from '@/hooks/useApi';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/Toast';
import Spinner from '@/components/Spinner';
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
  const [queueSearch, setQueueSearch] = useState('');
  const [finalizingState, setFinalizingState] = useState(null);
  const [finalizingCountdown, setFinalizingCountdown] = useState(0);

  const loadData = useCallback(async () => {
    const [pRes, sRes] = await Promise.all([
      request(`/api/players?pageSize=500&sport=${sport}`),
      request(`/api/auction/active?sport=${sport}`),
    ]);
    if (pRes) setPlayers(pRes.players || []);
    if (sRes?.session) {
      setActiveSession(sRes.session);
      setActivePlayer(sRes.session.playerId);
      setBidHistory(sRes.session.bids?.slice().reverse() || []);
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
      setActiveSession(null);
      setActivePlayer(null);
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
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [finalizingState]);

  useEffect(() => { loadData(); }, [loadData]);

  // Socket room isolation and live event listening
  useEffect(() => {
    if (!socket) return;
    socket.emit('join:sport', sport);

    const matchSport = (evSport) => !evSport || evSport === sport;

    socket.on('auction:start', ({ session, player, sport: evSport }) => {
      if (!matchSport(evSport)) return;
      setActiveSession(session);
      setActivePlayer(player);
      setSelectedPlayer(null);
      setBidHistory([]);
      setFinalizingState(null);
      setFinalizingCountdown(0);
    });

    socket.on('auction:bid_update', (data) => {
      if (!matchSport(data?.sport)) return;
      setActiveSession(prev => prev ? {
        ...prev,
        currentBid: data.currentBid,
        currentHighestBidderName: data.bidderTeamName,
        currentHighestBidder: data.bidderTeamId,
      } : prev);
      setBidHistory(prev => [{ teamName: data.bidderTeamName, amount: data.currentBid }, ...prev]);
    });

    socket.on('auction:finalizing', (data) => {
      if (!matchSport(data?.sport)) return;
      setFinalizingState(data);
      setFinalizingCountdown(data.countdown || 3);
    });

    socket.on('auction:sold', ({ player, team, sport: evSport }) => {
      if (!matchSport(evSport)) return;
      setFinalizingState(null);
      setFinalizingCountdown(0);
      setActionLoading(false);
      toast(`${player.name} SOLD to ${team?.name || 'highest bidder'}!`, 'success');
      setActiveSession(null);
      setActivePlayer(null);
      setBidHistory([]);
      loadData();
    });

    socket.on('auction:unsold', ({ player, sport: evSport }) => {
      if (!matchSport(evSport)) return;
      setFinalizingState(null);
      setFinalizingCountdown(0);
      setActionLoading(false);
      toast(`${player?.name || 'Player'} marked UNSOLD`, 'info');
      setActiveSession(null);
      setActivePlayer(null);
      setBidHistory([]);
      loadData();
    });

    socket.on('players:updated', (data) => {
      if (!data?.sport || matchSport(data.sport)) loadData();
    });

    return () => {
      socket.off('auction:start');
      socket.off('auction:bid_update');
      socket.off('auction:finalizing');
      socket.off('auction:sold');
      socket.off('auction:unsold');
      socket.off('players:updated');
    };
  }, [socket, toast, loadData, sport]);

  const startBidding = async (playerIdToStart = null) => {
    const targetPlayerId = playerIdToStart || selectedPlayer?._id;
    if (!targetPlayerId) return toast('Select a player from the queue first', 'warning');
    setActionLoading(true);
    const res = await request('/api/auction/start', {
      method: 'POST',
      body: JSON.stringify({ playerId: targetPlayerId, sport }),
    });
    setActionLoading(false);
    if (res?.error) {
      toast(res.error, 'error');
    } else {
      setActiveSession(res.session);
      setActivePlayer(res.player);
      setSelectedPlayer(null);
      setBidHistory([]);
      toast(`Auction started for ${res.player.name}`, 'success');
    }
  };

  const markSold = async () => {
    if (!activeSession || finalizingState || actionLoading) return;
    if (!activeSession?.currentHighestBidder && !activeSession?.currentHighestBidderName) {
      return toast('No bids placed yet. Use Mark Unsold instead.', 'warning');
    }
    setActionLoading(true);
    const res = await request('/api/auction/sold', {
      method: 'POST',
      body: JSON.stringify({ sessionId: activeSession._id }),
    });
    setActionLoading(false);
    if (res?.error) {
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
    const res = await request('/api/auction/unsold', {
      method: 'POST',
      body: JSON.stringify({ sessionId: activeSession._id }),
    });
    setActionLoading(false);
    if (res?.error) {
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

  // Queue players: available players
  const availableQueue = players
    .filter(p => p.status === 'available')
    .filter(p => !queueSearch.trim() || p.name.toLowerCase().includes(queueSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Resale players: unsold or resold players eligible for re-trigger
  const resalePlayers = players
    .filter(p => ['unsold', 'resold'].includes(p.status))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  // Visual Theme Tokens
  const pageBg = isFootball ? 'bg-[#040e0a]' : 'bg-[#0a1628]';
  const panelBg = isFootball ? 'bg-[#071d14] border-emerald-500/20' : 'bg-[#0d1e3a] border-[#c9a227]/20';
  const panelHeaderBg = isFootball ? 'bg-[#05140e] border-emerald-500/15' : 'bg-[#0a1628] border-[#c9a227]/15';
  const accentColor = isFootball ? 'text-emerald-400' : 'text-[#c9a227]';
  const accentBorder = isFootball ? 'border-emerald-500/30' : 'border-[#c9a227]/25';
  const primaryBtn = isFootball
    ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold shadow-lg shadow-emerald-500/25'
    : 'bg-[#c9a227] hover:bg-[#f0c040] text-[#0a1628] font-bold shadow-lg shadow-[#c9a227]/20';

  return (
    <div className={`flex flex-col ${pageBg} text-white`} style={{ height: 'calc(100vh - 48px)' }}>
      {/* Top Title Bar */}
      <div className="shrink-0 px-4 lg:px-6 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
          {isFootball ? <FootballIcon className="w-5 h-5 text-emerald-400" /> : <CricketIcon className="w-5 h-5 text-[#c9a227]" />}
          <span>Auction Control</span>
        </h1>
        {activeSession && (
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
            isFootball ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-[#c9a227]/15 border-[#c9a227]/30 text-[#c9a227]'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${isFootball ? 'bg-emerald-400' : 'bg-[#c9a227]'}`} />
            Live
          </span>
        )}
      </div>

      {/* Main 3-Column Content Layout (matching user screenshot) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 px-4 lg:px-6 pb-4 lg:pb-6 overflow-hidden">

        {/* COLUMN 1 (LEFT): Queue */}
        <div className="lg:col-span-3 flex flex-col min-h-0 overflow-hidden">
          <div className={`${panelBg} border rounded-xl flex flex-col h-full overflow-hidden shadow-xl`}>
            {/* Header with dots */}
            <div className={`flex items-center gap-1.5 px-3.5 py-2.5 ${panelHeaderBg} border-b shrink-0`}>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-2 text-white/35 text-xs font-mono font-medium">queue · {availableQueue.length} players</span>
            </div>

            {/* Search Input */}
            <div className="p-2.5 shrink-0">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={queueSearch}
                  onChange={e => setQueueSearch(e.target.value)}
                  placeholder="Search players..."
                  className={`w-full ${panelHeaderBg} border ${accentBorder} rounded-lg pl-8 pr-3 py-2 text-white text-xs placeholder-white/25 focus:outline-none focus:border-white/40 transition-colors`}
                />
              </div>
            </div>

            {/* Player List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1 min-h-0 divide-y divide-white/5">
              {availableQueue.length === 0 && (
                <div className="text-white/25 text-xs text-center py-12">No players in queue</div>
              )}
              {availableQueue.map(p => {
                const isSelected = selectedPlayer?._id === p._id;
                return (
                  <button
                    key={p._id}
                    onClick={() => setSelectedPlayer(p)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isSelected
                        ? (isFootball ? 'bg-emerald-500/20 text-white border-l-4 border-emerald-400 font-bold' : 'bg-[#c9a227]/20 text-white border-l-4 border-[#c9a227] font-bold')
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <div className="text-white/30 text-xs mt-0.5">- {p.basePrice}pts</div>
                  </button>
                );
              })}
            </div>

            {/* Fixed Bottom Button: Start Bidding */}
            <div className="p-3 border-t border-white/10 shrink-0">
              <button
                onClick={() => startBidding()}
                disabled={!selectedPlayer || Boolean(activeSession) || actionLoading}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  selectedPlayer && !activeSession
                    ? primaryBtn
                    : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                {actionLoading ? <Spinner size="sm" /> : 'Start Bidding'}
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2 (CENTER): Active Auction Stage */}
        <div className="lg:col-span-6 flex flex-col min-h-0 overflow-hidden">
          <div className={`${panelBg} border rounded-xl flex-1 flex flex-col overflow-hidden shadow-xl min-h-[460px]`}>
            {/* Header with dots */}
            <div className={`flex items-center gap-1.5 px-3.5 py-2.5 ${panelHeaderBg} border-b shrink-0`}>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-2 text-white/35 text-xs font-mono font-medium">auction · active</span>
            </div>

            {/* Stage Body */}
            <div className="flex-1 p-5 lg:p-6 flex flex-col justify-between overflow-y-auto min-h-0 relative">
              {activePlayer ? (
                <>
                  {/* Top: Player Image Area with BASE Price Badge */}
                  <div className="relative flex-1 flex flex-col items-center justify-center min-h-[220px] rounded-xl overflow-hidden mb-4 bg-black/20 border border-white/5">
                    {/* BASE badge in top right */}
                    <div className={`absolute top-3 right-3 rounded-lg px-2.5 py-1 text-center border backdrop-blur ${
                      isFootball ? 'bg-[#05140e]/90 border-emerald-500/40 text-emerald-400' : 'bg-[#0a1628]/90 border-[#c9a227]/30 text-[#c9a227]'
                    }`}>
                      <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold leading-none mb-0.5">BASE</p>
                      <p className="font-black text-sm tabular-nums leading-tight">{activePlayer.basePrice}</p>
                    </div>

                    {/* Photo or Clean Silhouette */}
                    {activePlayer.photo ? (
                      <div className="relative w-44 h-44 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                        <Image src={activePlayer.photo} alt={activePlayer.name} fill unoptimized className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        {isFootball ? (
                          <FootballIcon className="w-12 h-12 text-emerald-400/30" />
                        ) : (
                          <CricketIcon className="w-12 h-12 text-[#c9a227]/30" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Player Name and Gender/Role Pill */}
                  <div className="mb-4">
                    <div className="mb-1">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/30 tracking-wider">
                        {activePlayer.gender || (isFootball ? 'FORWARD' : 'BATSMAN')}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight truncate">
                      {activePlayer.name}
                    </h2>
                  </div>

                  {/* Bidding Summary Row (matching user screenshot) */}
                  <div className={`rounded-xl p-4 mb-4 border flex items-center justify-between ${
                    isFootball ? 'bg-[#05150f] border-emerald-500/20' : 'bg-[#0a1628] border-[#c9a227]/15'
                  }`}>
                    <div>
                      <p className="text-white/35 text-[10px] uppercase tracking-wider font-bold mb-0.5">CURRENT BID</p>
                      <div className={`text-3xl sm:text-4xl font-black tabular-nums ${accentColor}`}>
                        {activeSession?.currentBid ?? activePlayer.basePrice} <span className="text-xs font-normal text-white/40">pts</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/35 text-[10px] uppercase tracking-wider font-bold mb-0.5">LEADING</p>
                      <div className="text-base font-bold text-white truncate max-w-[180px]">
                        {activeSession?.currentHighestBidderName || '— No bids yet —'}
                      </div>
                    </div>
                  </div>

                  {/* Finalizing Overlay Banner */}
                  {finalizingState && (
                    <div className={`mb-3.5 border rounded-xl p-3 flex items-center justify-between animate-pulse ${
                      isFootball ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' : 'bg-[#c9a227]/15 border-[#c9a227]/50 text-[#c9a227]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full animate-ping ${isFootball ? 'bg-emerald-400' : 'bg-[#c9a227]'}`} />
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
                      className={`py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
                        activeSession?.currentHighestBidder && !finalizingState
                          ? primaryBtn
                          : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      {actionLoading ? <Spinner size="sm" /> : 'Mark Sold'}
                    </button>
                    <button
                      onClick={markUnsold}
                      disabled={!activeSession || actionLoading || Boolean(finalizingState)}
                      className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Mark Unsold
                    </button>
                  </div>
                </>
              ) : (
                /* Empty Stage */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/30">
                  <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-3 bg-black/20">
                    {isFootball ? <FootballIcon className="w-8 h-8 text-emerald-400/30" /> : <CricketIcon className="w-8 h-8 text-[#c9a227]/30" />}
                  </div>
                  <p className="text-white/60 font-bold text-sm mb-1">No Active Auction</p>
                  <p className="text-white/30 text-xs max-w-xs">Select a player from the queue or resale list and click Start Bidding</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 3 (RIGHT): Two Stacked Panels (Bid-Feed & Resale) */}
        <div className="lg:col-span-3 flex flex-col gap-3.5 min-h-0 overflow-hidden">

          {/* Top Panel: Bid Feed */}
          <div className={`${panelBg} border rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-xl`}>
            {/* Header with dots */}
            <div className={`flex items-center gap-1.5 px-3.5 py-2.5 ${panelHeaderBg} border-b shrink-0`}>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-2 text-white/35 text-xs font-mono font-medium">bid-feed · {bidHistory.length} bids</span>
            </div>

            {/* Live Bids List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
              {bidHistory.length === 0 ? (
                <div className="text-white/25 text-xs text-center py-8">No live bids placed yet</div>
              ) : (
                bidHistory.map((b, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs ${
                      i === 0
                        ? (isFootball ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200' : 'bg-[#c9a227]/15 border-[#c9a227]/40 text-white')
                        : 'bg-black/20 border-white/5 text-white/70'
                    }`}
                  >
                    <span className="font-bold truncate max-w-[150px]">{b.teamName}</span>
                    <span className={`font-black tabular-nums text-sm ${i === 0 ? accentColor : 'text-white/80'}`}>{b.amount}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Panel: Resale Queue */}
          <div className={`${panelBg} border rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-xl`}>
            {/* Header with dots */}
            <div className={`flex items-center gap-1.5 px-3.5 py-2.5 ${panelHeaderBg} border-b shrink-0`}>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-2 text-white/35 text-xs font-mono font-medium">resale · {resalePlayers.length} players</span>
            </div>

            {/* Resale Players List with Trigger Buttons */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
              {resalePlayers.length === 0 ? (
                <div className="text-white/25 text-xs text-center py-8">No players in resale queue</div>
              ) : (
                resalePlayers.map(p => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/20 border border-white/5 gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-white truncate">{p.name}</div>
                      <div className="text-white/35 text-[11px] truncate">
                        {p.status === 'resold' ? `${p.soldTo?.name || 'Previous Team'} · ${p.soldPrice || p.basePrice} pts` : `Unsold · ${p.basePrice} pts`}
                      </div>
                    </div>
                    <button
                      onClick={() => startBidding(p._id)}
                      disabled={Boolean(activeSession) || actionLoading}
                      className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all shrink-0 ${
                        isFootball
                          ? 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-30'
                          : 'border-[#c9a227]/40 text-[#c9a227] hover:bg-[#c9a227]/20 disabled:opacity-30'
                      }`}
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

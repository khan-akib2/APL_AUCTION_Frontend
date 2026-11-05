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
    const roomName = `auction:${sport}`;
    socket.emit('joinRoom', { room: roomName, sport });

    const handlePlayerNominated = (data) => {
      if (data.sport && data.sport !== sport) return;
      setActiveSession(data.session);
      setActivePlayer(data.player);
      setSelectedPlayer(data.player);
      setBidHistory([]);
      setFinalizingState(null);
      setFinalizingCountdown(0);
      loadData();
    };

    const handleBidPlaced = (data) => {
      if (data.sport && data.sport !== sport) return;
      setActiveSession(prev => prev ? {
        ...prev,
        currentBid: data.amount,
        currentHighestBidder: data.teamId,
        currentHighestBidderName: data.teamName,
      } : prev);
      setBidHistory(prev => [{
        teamName: data.teamName,
        amount: data.amount,
        createdAt: new Date().toISOString(),
      }, ...prev]);
    };

    const handleFinalizing = (data) => {
      if (data.sport && data.sport !== sport) return;
      setFinalizingState(data);
      setFinalizingCountdown(data.countdown || 3);
    };

    const handleFinalized = (data) => {
      if (data.sport && data.sport !== sport) return;
      setFinalizingState(null);
      setFinalizingCountdown(0);
      setActiveSession(null);
      setActivePlayer(null);
      setSelectedPlayer(null);
      setBidHistory([]);
      loadData();
    };

    const handleSold = (data) => {
      if (data.sport && data.sport !== sport) return;
      toast(`Player SOLD to ${data.teamName} for ${data.amount} pts!`, 'success');
      setActiveSession(null);
      setActivePlayer(null);
      setSelectedPlayer(null);
      setBidHistory([]);
      setFinalizingState(null);
      loadData();
    };

    const handleUnsold = (data) => {
      if (data.sport && data.sport !== sport) return;
      toast('Player marked UNSOLD', 'info');
      setActiveSession(null);
      setActivePlayer(null);
      setSelectedPlayer(null);
      setBidHistory([]);
      setFinalizingState(null);
      loadData();
    };

    socket.on('playerNominated', handlePlayerNominated);
    socket.on('bidPlaced', handleBidPlaced);
    socket.on('auctionFinalizing', handleFinalizing);
    socket.on('auctionFinalized', handleFinalized);
    socket.on('playerSold', handleSold);
    socket.on('playerUnsold', handleUnsold);

    return () => {
      socket.emit('leaveRoom', { room: roomName, sport });
      socket.off('playerNominated', handlePlayerNominated);
      socket.off('bidPlaced', handleBidPlaced);
      socket.off('auctionFinalizing', handleFinalizing);
      socket.off('auctionFinalized', handleFinalized);
      socket.off('playerSold', handleSold);
      socket.off('playerUnsold', handleUnsold);
    };
  }, [socket, sport, loadData, toast]);

  const startBidding = async (playerId) => {
    const targetId = playerId || selectedPlayer?._id;
    if (!targetId) return toast('Select a player to auction', 'warning');
    if (activeSession) return toast('An auction is currently active', 'warning');

    setActionLoading(true);
    const res = await request('/api/auction/start', {
      method: 'POST',
      body: JSON.stringify({ playerId: targetId, sport }),
    });
    setActionLoading(false);
    if (res?.error) {
      toast(res.error, 'error');
      return;
    }
    toast('Live bidding started!', 'success');
    loadData();
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
    if (res?.error) toast(res.error, 'error');
    else {
      toast('Finalizing 3-second countdown initiated...', 'info');
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
    if (res?.error) toast(res.error, 'error');
    else {
      toast('Finalizing unsold...', 'info');
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

            {/* Fixed Bottom Button: Start Bidding */}
            <div className="p-3.5 border-t border-[#e8e2d5] shrink-0 bg-[#faf8f5]">
              <button
                onClick={() => startBidding()}
                disabled={!selectedPlayer || Boolean(activeSession) || actionLoading}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  selectedPlayer && !activeSession
                    ? 'bg-[#0d3a24] hover:bg-[#154d32] text-white shadow-md'
                    : 'bg-stone-100 text-[#9ca3af] cursor-not-allowed border border-stone-200'
                }`}
              >
                {actionLoading ? <Spinner size="sm" /> : 'Start Bidding'}
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
                  {/* Top: Player Image Area with BASE Price Badge */}
                  <div className="relative flex-1 flex flex-col items-center justify-center min-h-[220px] rounded-2xl overflow-hidden mb-5 bg-[#faf8f5] border border-[#e8e2d5]">
                    {/* BASE badge in top right */}
                    <div className="absolute top-3.5 right-3.5 rounded-xl px-3 py-1.5 text-center bg-white border border-[#e8e2d5] shadow-sm">
                      <p className="text-[9px] uppercase tracking-wider text-[#6b7280] font-bold leading-none mb-0.5">BASE</p>
                      <p className="font-black text-sm text-[#0d3a24] tabular-nums leading-tight">{activePlayer.basePrice}</p>
                    </div>

                    {/* Photo or Clean Silhouette */}
                    {activePlayer.photo ? (
                      <div className="relative w-44 h-44 rounded-2xl overflow-hidden border border-[#e8e2d5] shadow-md">
                        <Image src={activePlayer.photo} alt={activePlayer.name} fill unoptimized className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-[#f4efe6] border border-[#e8e2d5] flex items-center justify-center shadow-inner">
                        {isFootball ? (
                          <FootballIcon className="w-12 h-12 text-[#0d3a24]/40" />
                        ) : (
                          <CricketIcon className="w-12 h-12 text-[#c59b27]/40" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Player Name and Role Pill */}
                  <div className="mb-4">
                    <div className="mb-1">
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#f4efe6] text-[#0d3a24] border border-[#e8e2d5] tracking-wider">
                        {activePlayer.gender || (isFootball ? 'FORWARD' : 'BATSMAN')}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#111827] uppercase tracking-tight truncate">
                      {activePlayer.name}
                    </h2>
                  </div>

                  {/* Bidding Summary Box */}
                  <div className="rounded-2xl p-4 sm:p-5 mb-4 border border-[#e8e2d5] bg-[#faf8f5] flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[#6b7280] text-[10px] uppercase tracking-wider font-bold mb-0.5">CURRENT BID</p>
                      <div className="text-3xl sm:text-4xl font-black tabular-nums text-[#0d3a24]">
                        {activeSession?.currentBid ?? activePlayer.basePrice} <span className="text-xs font-normal text-[#6b7280]">pts</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[#6b7280] text-[10px] uppercase tracking-wider font-bold mb-0.5">LEADING</p>
                      <div className="text-base font-bold text-[#c59b27] truncate max-w-[180px]">
                        {activeSession?.currentHighestBidderName || '— No bids yet —'}
                      </div>
                    </div>
                  </div>

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

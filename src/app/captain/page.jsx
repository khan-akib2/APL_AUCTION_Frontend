'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SkillBadge from '@/components/SkillBadge';
import Spinner from '@/components/Spinner';
import Logo from '@/components/Logo';
import AuctionTimer from '@/components/AuctionTimer';
import MysteryPlayerCard from '@/components/MysteryPlayerCard';
import MysteryRevealOverlay from '@/components/MysteryRevealOverlay';
import { playBidSound, playSoldSound, playUnsoldSound, playTimerUrgentSound } from '@/lib/sounds';
import { displaySkills } from '@/lib/skills';

export default function CaptainDashboard() {
  const { user, logout } = useAuth();
  const { request } = useApi();
  const socket = useSocket();
  const toast = useToast();
  const router = useRouter();

  const [team, setTeam] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [activePlayer, setActivePlayer] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [tab, setTab] = useState('auction');
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [timer, setTimer] = useState({ remaining: null, paused: false });
  // Mystery state
  const [revealing, setRevealing] = useState(false);
  const [revealedPlayerIds, setRevealedPlayerIds] = useState(new Set()); // player IDs revealed by this team
  const [revealOverlayPlayer, setRevealOverlayPlayer] = useState(null); // shown after winning mystery player

  const loadData = useCallback(async () => {
    const [teamRes, sessionRes] = await Promise.all([
      request('/api/teams'),
      request('/api/auction/active'),
    ]);
    const myTeam = teamRes?.teams?.[0] || null;
    if (myTeam) setTeam(myTeam);
    if (sessionRes?.session) {
      setActiveSession(sessionRes.session);
      setActivePlayer(sessionRes.session.playerId);
      setBidHistory(sessionRes.session.bids?.slice().reverse() || []);
      setTimer({ remaining: sessionRes.session.timerRemaining, paused: sessionRes.session.timerPaused });
    } else {
      setActiveSession(null); setActivePlayer(null);
      setTimer({ remaining: null, paused: false });
    }
    setLoading(false);
    return !!myTeam;
  }, [request]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Poll if socket disconnected OR if no team assigned yet
      if (!socket?.connected || !team) loadData();
    }, 3000);
    return () => clearInterval(interval);
  }, [socket, loadData, team]);

  // Reload when tab becomes visible
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadData(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadData]);

  useEffect(() => {
    if (!socket) return;
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    // Sync initial state
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsConnected(socket.connected);
    socket.on('viewers:count', (count) => setViewerCount(count));
    socket.on('auction:start', ({ session, player }) => {
      setActiveSession(session); setActivePlayer(player); setBidHistory([]);
      setTimer({ remaining: session.timerRemaining, paused: false });
      setTab('auction');
    });
    socket.on('auction:bid_update', (data) => {
      setActiveSession(prev => prev ? { ...prev, currentBid: data.currentBid, currentHighestBidderName: data.bidderTeamName, currentHighestBidder: data.bidderTeamId } : prev);
      setBidHistory(prev => [{ teamName: data.bidderTeamName, amount: data.currentBid }, ...prev]);
      playBidSound();
      if (data.bidderTeamId !== team?._id?.toString()) toast(`Outbid — ${data.currentBid} pts`, 'warning');
    });
    socket.on('auction:sold', ({ player, team: soldTeam }) => {
      if (soldTeam._id?.toString() === team?._id?.toString()) {
        playSoldSound();
        // If mystery player — show reveal overlay with full details
        if (player.isMysteryPlayer) {
          setRevealOverlayPlayer(player);
        } else {
          toast(`Won: ${player.name}`, 'success');
        }
        // Confetti for winning team
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 }, colors: ['#c9a227', '#f0c040', '#ffffff', '#ffd700'] });
        });
      } else {
        const displayName = player.isMysteryPlayer ? 'Mystery Player' : player.name;
        toast(`${displayName} → ${soldTeam.name}`, 'info');
      }
      setActiveSession(null); setActivePlayer(null); setBidHistory([]);
      setTimer({ remaining: null, paused: false });
      loadData();
    });
    socket.on('auction:unsold', () => { setActiveSession(null); setActivePlayer(null); setBidHistory([]); setTimer({ remaining: null, paused: false }); playUnsoldSound(); });
    socket.on('auction:resale', () => { loadData(); });
    socket.on('team:token_added', ({ teamId, revealTokens }) => {
      setTeam(prev => {
        if (!prev || prev._id?.toString() !== teamId) return prev;
        return { ...prev, revealTokens };
      });
    });
    socket.on('team:assigned', ({ captainId }) => {
      // If this socket belongs to the assigned captain, reload immediately
      if (user?.id === captainId || user?._id === captainId) loadData();
    });
    socket.on('auction:timer', (data) => {
      setTimer(data);
      // Timer sounds disabled
    });
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('viewers:count');
      socket.off('auction:start');
      socket.off('auction:bid_update');
      socket.off('auction:sold');
      socket.off('auction:unsold');
      socket.off('auction:resale');
      socket.off('team:token_added');
      socket.off('team:assigned');
      socket.off('auction:timer');
    };
  }, [socket, toast, team, loadData]);

  const placeBid = async (bidAmount = 10) => {
    if (!activeSession) return;
    setBidding(true);
    const res = await request('/api/auction/bid', { method: 'POST', body: JSON.stringify({ sessionId: activeSession._id, bidAmount }) });
    setBidding(false);
    if (res?.error) toast(res.error, 'error');
  };

  const handleReveal = async () => {
    if (!activePlayer?._id) return;
    setRevealing(true);
    const res = await request('/api/auction/reveal', { method: 'POST', body: JSON.stringify({ playerId: activePlayer._id }) });
    setRevealing(false);
    if (res?.error) { toast(res.error, 'error'); return; }
    // Update local state: mark player as revealed, update token count, show full player data
    setRevealedPlayerIds(prev => new Set([...prev, activePlayer._id]));
    if (res.player) setActivePlayer(res.player);
    if (res.tokensLeft !== undefined) setTeam(prev => prev ? { ...prev, revealTokens: res.tokensLeft } : prev);
    toast('Player revealed!', 'success');
  };

  const isLeading = activeSession?.currentHighestBidder?.toString() === team?._id?.toString();
  const canBid = activeSession && team && team.playerCount < 7 && !isLeading;
  const budgetPct = team ? Math.round((team.pointsSpent / 500) * 100) : 0;

  // Budget alert thresholds
  const budgetCritical = team && team.budget <= 25;
  const budgetLow = team && team.budget <= 50 && team.budget > 25;

  // Toast once when budget drops low
  useEffect(() => {
    if (!team) return;
    if (team.budget <= 25) toast(`Critical! Only ${team.budget} pts left`, 'error');
    else if (team.budget <= 50) toast(`Budget low — ${team.budget} pts remaining`, 'warning');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.budget]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a1628]"><Spinner size="lg" /></div>;
  if (!team) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-white/50 text-sm mt-4 mb-1">Waiting for team assignment...</p>
        <p className="text-white/25 text-xs">This page will update automatically</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d1e3a]/95 backdrop-blur border-b border-[#c9a227]/15 px-4 lg:px-8 h-12 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          {team?.logo ? (
            <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-[#c9a227]/20 bg-[#0a1628] shrink-0">
              <Image src={team.logo} alt={team.name} fill unoptimized className="object-contain p-0.5" />
            </div>
          ) : (
            <Logo size="sm" className="shrink-0 rounded-xl w-7 h-7" />
          )}
          <span className="text-[#c9a227]/50 text-xs uppercase tracking-widest hidden sm:block">APL</span>
          <span className="text-[#c9a227]/20 hidden sm:block">·</span>
          <span className="text-white text-sm font-semibold truncate">{team?.name}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {viewerCount > 0 && (
            <div className="hidden sm:flex items-center gap-2 bg-[#c9a227]/10 border border-[#c9a227]/20 rounded-full px-3 py-1">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c9a227] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#c9a227]" />
              </span>
              <span className="text-[#c9a227] text-xs font-bold tabular-nums leading-none">{viewerCount} watching live</span>
            </div>
          )}
          <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 border ${budgetCritical ? 'bg-red-500/15 border-red-500/40' : budgetLow ? 'bg-orange-500/10 border-orange-400/30' : 'bg-[#c9a227]/10 border-[#c9a227]/20'}`}>
            <span className={`font-black text-sm tabular-nums ${budgetCritical ? 'text-red-400' : budgetLow ? 'text-orange-400' : 'text-[#c9a227]'}`}>{team?.budget ?? 0}</span>
            <span className="text-white/40 text-xs">pts</span>
          </div>
          {(team?.revealTokens ?? 0) > 0 && (
            <div className="flex items-center gap-1 bg-purple-500/15 border border-purple-500/30 rounded-lg px-2.5 py-1.5">
              <svg className="w-3.5 h-3.5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-purple-300 font-bold text-xs tabular-nums">{team.revealTokens}</span>
            </div>
          )}
          <button onClick={() => { logout(); router.push('/login'); }} className="text-white/30 hover:text-white/60 text-xs transition-colors">
            Sign Out
          </button>
        </div>
      </header>

      {/* Budget progress bar */}
      <div className={`h-1 ${budgetCritical ? 'bg-red-900/40' : budgetLow ? 'bg-orange-900/30' : 'bg-[#c9a227]/8'}`}>
        <div className={`h-full transition-all duration-700 ${budgetCritical ? 'bg-red-500' : budgetLow ? 'bg-orange-400' : 'bg-[#c9a227]/60'}`}
          style={{ width: `${budgetPct}%` }} />
      </div>

      {/* Budget alert banner */}
      {(budgetCritical || budgetLow) && (
        <div className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold ${
          budgetCritical
            ? 'bg-red-500/15 border-b border-red-500/30 text-red-400'
            : 'bg-orange-500/10 border-b border-orange-400/25 text-orange-400'
        }`}>
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {budgetCritical
            ? `Critical! Only ${team?.budget} pts left — bid carefully`
            : `Budget low — ${team?.budget} pts remaining`}
        </div>
      )}

      {/* Mobile tabs */}
      <div className="p-3 lg:p-4 overflow-hidden" style={{ height: 'calc(100vh - 88px)' }}>
        {activeSession && activePlayer ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4" style={{ height: '100%' }}>

            {/* LEFT: Bid Controls + History */}
            <div className="lg:col-span-3 flex flex-col gap-3 overflow-hidden" style={{ height: '100%' }}>
              {/* Bid control — fixed height, never grows */}
              <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-2xl overflow-hidden shadow-xl shrink-0">
                <div className="px-4 py-3 border-b border-[#c9a227]/10">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-1">Current Bid</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#c9a227] tabular-nums leading-none">{activeSession.currentBid}</span>
                    <span className="text-white/40 text-sm">pts</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-[#c9a227]/10 border-b border-[#c9a227]/10">
                  <div className="px-3 py-2 text-center">
                    <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Your Budget</p>
                    <p className="text-white/80 text-sm font-bold tabular-nums">{team?.budget ?? '—'}</p>
                  </div>
                  <div className="px-3 py-2 text-center">
                    <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Leading</p>
                    <p className={`text-sm font-bold ${isLeading ? 'text-[#c9a227]' : 'text-white/60'}`}>
                      {activeSession.currentHighestBidderName ? (isLeading ? 'You' : activeSession.currentHighestBidderName.split(' ')[0]) : '—'}
                    </p>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 5, 10].map(amt => {
                      const nextBid = activeSession.currentBid + amt;
                      const canBidAmt = canBid && team.budget >= nextBid;
                      return (
                        <button key={amt}
                          onClick={() => placeBid(amt)}
                          disabled={!canBidAmt || bidding}
                          className="bg-[#c9a227] text-[#0a1628] font-black py-2.5 rounded-xl text-xs hover:bg-[#f0c040] disabled:opacity-25 disabled:cursor-not-allowed flex flex-col items-center justify-center transition-all active:scale-[0.97]">
                          <span className="text-xs font-black">+{amt}</span>
                          <span className="text-[9px] opacity-70">{nextBid}</span>
                        </button>
                      );
                    })}
                  </div>
                  {bidding && <div className="flex justify-center"><Spinner size="sm" /></div>}
                  {!canBid && activeSession && (
                    <p className="text-center text-white/40 text-[10px]">
                      {team?.playerCount >= 7 ? 'Squad full' : isLeading ? 'You are leading' : 'Low budget'}
                    </p>
                  )}
                </div>
              </div>

              {/* Bid history — fills remaining space, scrolls */}
              <div className="bg-[#0d1e3a] border border-[#c9a227]/15 rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-0 flex-1">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#c9a227]/10 shrink-0">
                  <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Bid History</p>
                  <span className="text-[#c9a227] text-xs font-semibold bg-[#c9a227]/10 px-2 py-0.5 rounded-md">{bidHistory.length}</span>
                </div>
                <div className="overflow-y-auto divide-y divide-[#c9a227]/5 flex-1 min-h-0">
                  {bidHistory.length === 0 && <p className="text-white/30 text-xs text-center py-6">No bids yet</p>}
                  {bidHistory.map((b, i) => (
                    <div key={i} className={`flex items-center justify-between px-3 py-2 ${i === 0 ? 'bg-[#c9a227]/8' : ''}`}>
                      <span className={`text-xs font-semibold truncate ${i === 0 ? 'text-white' : 'text-white/60'}`}>{b.teamName}</span>
                      <span className={`text-xs font-black tabular-nums ml-2 ${i === 0 ? 'text-[#c9a227]' : 'text-white/50'}`}>{b.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CENTER: Player Card */}
            <div className="lg:col-span-6 flex flex-col overflow-hidden" style={{ height: '100%' }}>
              {activePlayer.isMysteryPlayer && activePlayer._isMasked ? (
                <div className="h-full">
                  <MysteryPlayerCard
                    player={activePlayer}
                    revealTokens={team?.revealTokens ?? 0}
                    onReveal={handleReveal}
                    revealing={revealing}
                    revealed={revealedPlayerIds.has(activePlayer._id)}
                  />
                </div>
              ) : (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl h-full" style={{ minHeight: '400px' }}>

                {/* Full-bleed background photo */}
                {activePlayer.photo ? (
                  <>
                    {/* Blurred bg fill */}
                    <Image src={activePlayer.photo} alt="" fill unoptimized
                      className="absolute inset-0 object-cover scale-110 blur-xl opacity-40 pointer-events-none" />
                    {/* Sharp main photo — centered to show face */}
                    <Image src={activePlayer.photo} alt={activePlayer.name} fill unoptimized
                      className="absolute inset-0 object-cover"
                      style={{ objectPosition: '50% 20%' }}
                      loading="eager" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-[#0d1e3a]" />
                )}

                {/* Dark gradient overlay — heavier at bottom */}
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to bottom, rgba(10,22,40,0.1) 0%, rgba(10,22,40,0.2) 40%, rgba(10,22,40,0.85) 70%, rgba(10,22,40,0.98) 100%)' }} />

                {/* LIVE badge top-right */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-500/90 backdrop-blur px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-white text-[10px] font-bold uppercase tracking-wider">Live</span>
                </div>

                {/* Base price badge top-left */}
                <div className="absolute top-4 left-4 bg-[#0a1628]/80 backdrop-blur border border-[#c9a227]/30 rounded-xl px-3 py-2 text-center">
                  <p className="text-white/40 text-[9px] uppercase tracking-wider">Base</p>
                  <p className="text-[#c9a227] font-black text-lg tabular-nums leading-none">{activePlayer.basePrice}</p>
                </div>

                {/* Player info — bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[#c9a227] text-[10px] uppercase tracking-[0.2em] font-bold opacity-90">
                      {displaySkills(activePlayer.skills)[0] || 'Player'}
                    </p>
                    {activePlayer.gender && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${activePlayer.gender === 'Female' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                        {activePlayer.gender}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-4xl font-black text-white uppercase leading-none tracking-tight mb-2">
                    {activePlayer.name}
                  </h1>
                  <div className="flex flex-wrap gap-1.5">
                    {displaySkills(activePlayer.skills).map(s => <SkillBadge key={s} skill={s} />)}
                  </div>
                </div>
              </div>
              )} {/* end mystery/normal conditional */}
            </div>

            {/* RIGHT: Budget + Squad */}
            <div className="lg:col-span-3 flex flex-col gap-3 overflow-hidden" style={{ height: '100%' }}>
              {/* Budget */}
              <div className={`rounded-2xl p-4 shadow-xl border shrink-0 ${budgetCritical ? 'bg-red-500/10 border-red-500/30' : budgetLow ? 'bg-orange-500/8 border-orange-400/25' : 'bg-[#0d1e3a] border-[#c9a227]/20'}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs uppercase tracking-wider font-bold ${budgetCritical ? 'text-red-400/70' : budgetLow ? 'text-orange-400/70' : 'text-white/40'}`}>Budget</p>
                  <p className={`font-black text-base tabular-nums ${budgetCritical ? 'text-red-400' : budgetLow ? 'text-orange-400' : 'text-[#c9a227]'}`}>
                    {team?.budget} <span className="text-white/30 text-xs font-normal">pts</span>
                  </p>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${budgetCritical ? 'bg-red-500' : budgetLow ? 'bg-orange-400' : 'bg-[#c9a227]/70'}`}
                    style={{ width: `${budgetPct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-white/30 mt-1.5">
                  <span>Spent: {team?.pointsSpent || 0} pts</span>
                  <span>{budgetPct}%</span>
                </div>
              </div>

              {/* Squad */}
              <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-2xl p-4 flex-1 flex flex-col shadow-xl min-h-0">
                <p className="text-white/40 text-xs uppercase tracking-wider font-bold mb-3 shrink-0">
                  My Squad · {team?.playerCount || 0}/7
                </p>
                <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
                  {team?.players?.map(p => (
                    <div key={p._id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#0a1628]/50 border border-[#c9a227]/8">
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-xs font-semibold truncate">{p.name}</p>
                        <div className="flex gap-1 mt-0.5">{p.skills?.slice(0,1).map(s => <SkillBadge key={s} skill={s} />)}</div>
                      </div>
                      <span className="text-[#c9a227] text-xs font-bold ml-2 shrink-0">{p.soldPrice} pts</span>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 7 - (team?.players?.length || 0)) }).map((_, i) => (
                    <div key={i} className="py-2 px-3 rounded-xl border border-dashed border-white/8">
                      <p className="text-white/15 text-xs">Slot {(team?.players?.length || 0) + i + 1}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-[#0d1e3a] border border-[#c9a227]/10 rounded-2xl flex flex-col items-center justify-center p-12 text-center" style={{ minHeight: 'calc(100vh - 160px)' }}>
            <div className="w-16 h-16 rounded-full bg-[#c9a227]/5 border border-[#c9a227]/10 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-[#c9a227]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-white/60 text-xl font-bold mb-2">Waiting for Auction</p>
            <p className="text-white/25 text-sm">The next player will appear here</p>
          </div>
        )}
      </div>

      {/* Mystery reveal overlay — shown to winning captain */}
      {revealOverlayPlayer && (
        <MysteryRevealOverlay
          player={revealOverlayPlayer}
          onClose={() => { setRevealOverlayPlayer(null); toast(`Won: ${revealOverlayPlayer.name}`, 'success'); }}
        />
      )}
    </div>
  );
}

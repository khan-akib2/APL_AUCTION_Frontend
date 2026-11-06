'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
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
import BigCountdownOverlay from '@/components/BigCountdownOverlay';
import MysteryPlayerCard from '@/components/MysteryPlayerCard';
import MysteryRevealOverlay from '@/components/MysteryRevealOverlay';
import { playBidSound, playSoldSound, playUnsoldSound, playTimerUrgentSound } from '@/lib/sounds';
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
  const [viewerCount, setViewerCount] = useState(0);
  const [timer, setTimer] = useState({ remaining: null, paused: false });
  // Mystery state
  const [revealing, setRevealing] = useState(false);
  const [revealedPlayerIds, setRevealedPlayerIds] = useState(new Set());
  const [revealOverlayPlayer, setRevealOverlayPlayer] = useState(null);
  const [finalizingState, setFinalizingState] = useState(null);
  const [finalizingCountdown, setFinalizingCountdown] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState(null);
  const bidListRef = useRef(null);
  const lockoutTriggeredRef = useRef(false);

  useEffect(() => {
    lockoutTriggeredRef.current = isLocked;
  }, [isLocked]);

  const captainSport = team?.sport || user?.sport || 'cricket';

  const loadData = useCallback(async () => {
    const sportParam = (team?.sport || user?.sport) ? `?sport=${team?.sport || user?.sport}` : '';
    const [teamRes, sessionRes] = await Promise.all([
      request(`/api/teams${sportParam}`),
      request(`/api/auction/active${sportParam}`),
    ]);
    const myTeam = teamRes?.teams?.[0] || null;
    if (myTeam) {
      setTeam(myTeam);
      setIsLocked(Boolean(myTeam.isLocked));
      setLockReason(myTeam.lockReason || null);
    }
    if (sessionRes?.session) {
      setActiveSession(sessionRes.session);
      setActivePlayer(sessionRes.session.playerId);
      setBidHistory(dedupeBids(sessionRes.session.bids).slice().reverse());
      setTimer({ remaining: sessionRes.session.timerRemaining, paused: sessionRes.session.timerPaused });
      if (sessionRes.session.status === 'finalizing') {
        const elapsed = Math.floor((Date.now() - new Date(sessionRes.session.finalizingAt || Date.now()).getTime()) / 1000);
        setFinalizingState(sessionRes.session);
        setFinalizingCountdown(Math.max(0, 3 - elapsed));
      } else {
        setFinalizingState(null);
        setFinalizingCountdown(0);
      }
    } else {
      setActiveSession(null);
      setActivePlayer(null);
      setBidHistory([]);
      setFinalizingState(null);
      setFinalizingCountdown(0);
    }
    setLoading(false);
  }, [request, team?.sport, user?.sport]);

  useEffect(() => {
    if (!finalizingState) return;
    const interval = setInterval(() => {
      setFinalizingCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => loadData(), 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [finalizingState, loadData]);

  useEffect(() => { loadData(); }, [loadData]);

  // Anti-cheat lockout handler
  const triggerLockout = useCallback(async (reason) => {
    if (lockoutTriggeredRef.current || !team?._id) return;
    lockoutTriggeredRef.current = true;
    setIsLocked(true);
    setLockReason(reason);
    toast(`Anti-Cheat Triggered: ${reason}`, 'error');

    try {
      await request('/api/auction/lock-captain', {
        method: 'POST',
        body: JSON.stringify({
          teamId: team._id,
          reason,
          sport: captainSport,
        }),
      });
    } catch (err) {
      console.error('Failed to report anti-cheat lockout:', err);
    }
  }, [team, captainSport, request, toast]);

  // Anti-cheat detection listeners (active during live bidding rounds only)
  useEffect(() => {
    const isActiveAuction = Boolean(
      activeSession &&
      (activeSession.status === 'active' || activeSession.status === 'finalizing') &&
      !isLocked &&
      team?._id
    );

    if (!isActiveAuction) return;

    // 1. Tab switch or window minimized
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerLockout('Tab switch or browser minimized');
      }
    };

    // 2. Window blur (switching out of the window)
    const handleWindowBlur = () => {
      setTimeout(() => {
        if (document.hidden || !document.hasFocus()) {
          triggerLockout('Switched away from auction window');
        }
      }, 200);
    };

    // 3. DevTools / Inspect keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        triggerLockout('DevTools shortcut pressed (F12)');
        return false;
      }

      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier && e.shiftKey) {
        const key = (e.key || '').toUpperCase();
        if (key === 'I' || key === 'J' || key === 'C') {
          e.preventDefault();
          e.stopPropagation();
          triggerLockout(`Inspect element shortcut pressed (${e.ctrlKey ? 'Ctrl' : 'Cmd'}+Shift+${key})`);
          return false;
        }
      }

      if (isModifier && (e.key || '').toUpperCase() === 'U') {
        e.preventDefault();
        e.stopPropagation();
        triggerLockout('View Source shortcut pressed (Ctrl+U)');
        return false;
      }
    };

    // 4. Disable right-click context menu (preventing "Inspect Element")
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // 5. Inspect panel detection (docked devtools detection)
    const checkDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > threshold || heightDiff > threshold) {
        triggerLockout('Inspect element / DevTools panel detected');
      }
    };

    const devToolsInterval = setInterval(checkDevTools, 1000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      clearInterval(devToolsInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [activeSession, isLocked, team?._id, triggerLockout]);

  // Socket setup
  useEffect(() => {
    if (!socket) return;
    const roomName = `auction:${captainSport}`;
    socket.emit('join:sport', captainSport);
    socket.emit('joinRoom', { room: roomName, sport: captainSport });

    const handlePlayerNominated = (data) => {
      if (data?.sport && data.sport !== captainSport) return;
      const s = data.session;
      const p = data.player || s?.playerId;
      setActiveSession(s);
      setActivePlayer(p);
      setBidHistory([]);
      setFinalizingState(null);
      setFinalizingCountdown(0);
      setTimer({ remaining: s?.timerRemaining, paused: false });
    };

    const handleBidPlaced = (data) => {
      if (data?.sport && data.sport !== captainSport) return;
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
        // Prevent duplicate bids
        if (
          prev.length > 0 &&
          Number(prev[0].amount) === numAmt &&
          String(prev[0].teamName || '').trim().toLowerCase() === normTeam
        ) {
          return prev;
        }
        playBidSound();
        return [{
          teamName,
          amount: numAmt,
          createdAt: data.createdAt || data.timestamp || new Date().toISOString(),
        }, ...prev];
      });

      if (bidListRef.current) {
        bidListRef.current.scrollTop = 0;
      }
      if (data.timerRemaining !== undefined) {
        setTimer({ remaining: data.timerRemaining, paused: false });
      }
      setFinalizingState(null);
      setFinalizingCountdown(0);
    };

    const handleTimerTick = (data) => {
      if (data?.sport && data.sport !== captainSport) return;
      setTimer({ remaining: data.remaining, paused: data.paused });
      if (data.remaining <= 3 && data.remaining > 0) playTimerUrgentSound();
    };

    const handleFinalizing = (data) => {
      if (data?.sport && data.sport !== captainSport) return;
      setFinalizingState(data);
      setFinalizingCountdown(data.countdown || 3);
    };

    const handleFinalized = (data) => {
      if (data?.sport && data.sport !== captainSport) return;
      setFinalizingState(null);
      setFinalizingCountdown(0);
      setActiveSession(null);
      setActivePlayer(null);
      setBidHistory([]);
      loadData();
    };

    const handleSold = (data) => {
      if (data?.sport && data.sport !== captainSport) return;
      playSoldSound();
      const teamName = data.teamName || data.team?.name || '';
      const amount = data.amount ?? data.session?.currentBid ?? data.player?.soldPrice ?? 0;
      const winningTeamId = data.teamId || data.team?._id;
      const p = data.player || data.session?.playerId;
      toast(`SOLD to ${teamName} for ${amount} pts!`, 'success');
      if (winningTeamId === team?._id && p?.isMysteryPlayer) {
        setRevealOverlayPlayer(p);
      }
      setActiveSession(null);
      setActivePlayer(null);
      setBidHistory([]);
      setFinalizingState(null);
      loadData();
    };

    const handleUnsold = (data) => {
      if (data?.sport && data.sport !== captainSport) return;
      playUnsoldSound();
      toast('Player went UNSOLD', 'info');
      setActiveSession(null);
      setActivePlayer(null);
      setBidHistory([]);
      setFinalizingState(null);
      loadData();
    };

    const handleCaptainLocked = (data) => {
      if (data?.teamId === team?._id) {
        setIsLocked(true);
        setLockReason(data.reason || 'Anti-cheat violation detected');
        toast(`⚠️ ${data.reason || 'Auction access suspended'}`, 'error');
      }
    };

    const handleCaptainUnlocked = (data) => {
      if (data?.teamId === team?._id) {
        setIsLocked(false);
        setLockReason(null);
        toast('🎉 Your auction access has been restored by the admin!', 'success');
        loadData();
      }
    };

    socket.on('auction:start', handlePlayerNominated);
    socket.on('auction:bid_update', handleBidPlaced);
    socket.on('auction:timer', handleTimerTick);
    socket.on('auction:finalizing', handleFinalizing);
    socket.on('auction:sold', handleSold);
    socket.on('auction:unsold', handleUnsold);
    socket.on('auctionFinalized', handleFinalized);
    socket.on('auction:resale', () => loadData());
    socket.on('teams:reset', () => loadData());
    socket.on('team:token_added', (d) => {
      if (d.teamId === team?._id) setTeam(prev => prev ? { ...prev, revealTokens: d.revealTokens } : prev);
    });
    socket.on('captain:locked', handleCaptainLocked);
    socket.on('captain:unlocked', handleCaptainUnlocked);

    return () => {
      socket.emit('leaveRoom', { room: roomName, sport: captainSport });
      socket.off('auction:start', handlePlayerNominated);
      socket.off('auction:bid_update', handleBidPlaced);
      socket.off('auction:timer', handleTimerTick);
      socket.off('auction:finalizing', handleFinalizing);
      socket.off('auction:sold', handleSold);
      socket.off('auction:unsold', handleUnsold);
      socket.off('auctionFinalized', handleFinalized);
      socket.off('auction:resale');
      socket.off('teams:reset');
      socket.off('team:token_added');
      socket.off('captain:locked', handleCaptainLocked);
      socket.off('captain:unlocked', handleCaptainUnlocked);
    };
  }, [socket, captainSport, team?._id, loadData, toast]);

  const placeBid = async (increment) => {
    if (!activeSession || !team || bidding || isLocked || activeSession.status === 'closed') return;
    const nextBid = activeSession.currentBid + increment;
    if (team.budget < nextBid) return toast('Insufficient budget', 'warning');
    const maxSquad = team.teamSize || 7;
    if ((team.playerCount || team.players?.length || 0) >= maxSquad) return toast(`Squad is full (${maxSquad}/${maxSquad})`, 'warning');

    setBidding(true);
    const res = await request('/api/auction/bid', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: activeSession._id,
        teamId: team._id,
        amount: nextBid,
        bidAmount: increment,
        sport: captainSport,
      }),
    });
    setBidding(false);
    if (res?.error) {
      toast(res.error, 'error');
    } else {
      setFinalizingState(null);
      setFinalizingCountdown(0);
      if (res?.session?.timerRemaining !== undefined) {
        setTimer({ remaining: res.session.timerRemaining, paused: false });
      }
    }
  };

  const handleReveal = async () => {
    if (!activePlayer || revealing || isLocked) return;
    setRevealing(true);
    let res = await request(`/api/players/${activePlayer._id}/reveal`, {
      method: 'POST',
      body: JSON.stringify({ teamId: team._id }),
    });
    if (res?.error && res?.status === 404) {
      res = await request('/api/auction/reveal', {
        method: 'POST',
        body: JSON.stringify({ playerId: activePlayer._id, teamId: team._id }),
      });
    }
    setRevealing(false);
    if (res?.error) toast(res.error, 'error');
    else if (res?.player) {
      setActivePlayer(res.player);
      setRevealedPlayerIds(prev => new Set([...prev, activePlayer._id]));
      setTeam(prev => prev ? { ...prev, revealTokens: res.tokensLeft } : prev);
      toast('Mystery player revealed for your team!', 'success');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f6f0]">
      <Spinner size="lg" />
    </div>
  );

  if (!team) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f6f0]">
      <div className="text-center p-8 bg-white border border-[#e8e2d5] rounded-3xl shadow-sm max-w-sm mx-4">
        <Spinner size="lg" />
        <p className="text-[#111827] font-serif font-bold text-base mt-4 mb-1">Waiting for Team Assignment...</p>
        <p className="text-[#6b7280] text-xs">Your captain account will automatically connect once assigned.</p>
      </div>
    </div>
  );

  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#0d131f] text-white flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
        {/* Glowing background accents */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-800/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-[#162032] border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl relative z-10">
          {/* Lock Icon */}
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <div className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30 mb-3">
            Anti-Cheat Violation
          </div>

          <h1 className="text-2xl font-bold font-serif text-white mb-2">
            Auction Access Suspended
          </h1>

          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-6">
            You were removed from live bidding for switching tabs or attempting to open Developer Tools during an active round.
          </p>

          <div className="bg-[#0b101b] border border-red-500/20 rounded-2xl p-4 mb-6 text-left space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Violation Reason</span>
              <span className="text-red-400 font-mono text-xs font-semibold block mt-0.5 break-words">
                {lockReason || 'Tab switch or Inspect element detected'}
              </span>
            </div>
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-gray-400">Team:</span>
              <span className="text-white font-bold">{team?.name}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-amber-300 text-xs font-medium mb-6 bg-amber-500/10 py-3 px-4 rounded-xl border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span>Waiting for Auction Admin to re-admit you...</span>
          </div>

          <p className="text-[11px] text-gray-400 mb-6 leading-relaxed">
            Please ask the Admin to unlock your team on the auction board. This screen will automatically resume once approved.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => loadData()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              Check Status
            </button>
            <button
              onClick={() => { logout(); router.push('/login'); }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isLeading = activeSession?.currentHighestBidder === team._id;
  const isTimeEnded = timer.remaining !== null && timer.remaining <= 0;
  const isTimerPaused = Boolean(timer.paused);
  const canBid = Boolean(activeSession) && Boolean(team) && !isLeading && !isLocked && (team.playerCount || 0) < (team.teamSize || 7) && activeSession.status !== 'closed' && !isTimeEnded && !isTimerPaused;
  const budgetPct = Math.round(((team.pointsSpent || 0) / 1000) * 100);

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-[#111827] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-[#e8e2d5] px-4 lg:px-8 h-16 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          {team?.logo ? (
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-[#e8e2d5] bg-[#faf8f5] shrink-0 p-0.5">
              <Image src={team.logo} alt={team.name} fill unoptimized className="object-contain" />
            </div>
          ) : (
            <Logo size="sm" className="shrink-0 rounded-xl w-8 h-8" />
          )}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#0d3a24] block leading-none">
              APL {captainSport.toUpperCase()} CAPTAIN
            </span>
            <span className="text-[#111827] font-bold text-sm truncate block mt-0.5">{team?.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Budget Pill */}
          <div className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 border border-emerald-200 bg-emerald-50 text-[#0d3a24] shadow-sm">
            <span className="font-black text-sm tabular-nums">{team?.budget ?? 0}</span>
            <span className="text-xs font-semibold">pts left</span>
          </div>

          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="text-[#6b7280] hover:text-red-600 text-xs font-medium px-2 py-1 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Bidding Arena */}
      <div className="p-4 lg:p-6 flex-1 min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        {activeSession && activePlayer ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-1 gap-4 h-full min-h-0">

            {/* LEFT: Bid Controls & History */}
            <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden h-full min-h-0">
              {/* Bid Control Box */}
              <div className="bg-white border border-[#e8e2d5] rounded-3xl overflow-hidden shadow-sm shrink-0">
                <div className="px-5 py-4 border-b border-[#e8e2d5] bg-[#faf8f5] flex items-center justify-between">
                  <div>
                    <p className="text-[#6b7280] text-[10px] uppercase tracking-widest font-bold mb-1">Current Bid</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-[#0d3a24] tabular-nums leading-none">
                        {activeSession.currentBid}
                      </span>
                      <span className="text-[#6b7280] text-sm">pts</span>
                    </div>
                  </div>
                  {timer.remaining !== null && (
                    <AuctionTimer remaining={timer.remaining} paused={timer.paused} size="sm" />
                  )}
                </div>

                <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100 bg-white">
                  <div className="px-3 py-2.5 text-center">
                    <p className="text-[#6b7280] text-[9px] uppercase tracking-wider mb-0.5">Your Purse</p>
                    <p className="text-[#111827] text-sm font-bold tabular-nums">{team?.budget ?? '—'} pts</p>
                  </div>
                  <div className="px-3 py-2.5 text-center">
                    <p className="text-[#6b7280] text-[9px] uppercase tracking-wider mb-0.5">Leading</p>
                    <p className={`text-sm font-bold truncate ${isLeading ? 'text-[#0d3a24]' : 'text-[#c59b27]'}`}>
                      {activeSession.currentHighestBidderName ? (isLeading ? 'You' : activeSession.currentHighestBidderName.split(' ')[0]) : '—'}
                    </p>
                  </div>
                </div>

                {/* Quick Bid Increment Buttons */}
                <div className="p-4 space-y-2.5">
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 5, 10].map(amt => {
                      const nextBid = activeSession.currentBid + amt;
                      const canBidAmt = canBid && team.budget >= nextBid;
                      return (
                        <button
                          key={amt}
                          onClick={() => placeBid(amt)}
                          disabled={!canBidAmt || bidding}
                          className="bg-[#0d3a24] hover:bg-[#154d32] text-white font-black py-3 rounded-2xl text-xs disabled:opacity-30 disabled:cursor-not-allowed flex flex-col items-center justify-center transition-all shadow-sm active:scale-95"
                        >
                          <span className="text-xs font-black">+{amt}</span>
                          <span className="text-[10px] opacity-80">{nextBid}</span>
                        </button>
                      );
                    })}
                  </div>

                  {bidding && <div className="flex justify-center"><Spinner size="sm" /></div>}
                  {!canBid && activeSession && (
                    <p className="text-center text-[#9ca3af] text-[11px] pt-1 font-medium">
                      {isTimeEnded
                        ? 'Bidding time ended — Waiting for admin'
                        : isTimerPaused
                        ? 'Bidding paused by admin'
                        : (team?.playerCount || 0) >= (team?.teamSize || 7)
                        ? `Squad full (${team?.teamSize || 7}/${team?.teamSize || 7})`
                        : isLeading
                        ? 'You are leading the bid'
                        : 'Insufficient budget'}
                    </p>
                  )}
                </div>
              </div>

              {/* Bid history box */}
              <div className="bg-white border border-[#e8e2d5] rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-0 flex-1 max-h-[260px] sm:max-h-[300px]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e2d5] bg-[#faf8f5] shrink-0">
                  <p className="text-[#111827] text-xs font-bold uppercase tracking-wider">Bid History</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#f4efe6] text-[#0d3a24]">
                    {bidHistory.length}
                  </span>
                </div>
                <div ref={bidListRef} className="overflow-y-auto divide-y divide-gray-100 flex-1 min-h-0 p-2 max-h-[200px] sm:max-h-[240px]">
                  {bidHistory.length === 0 && <p className="text-[#9ca3af] text-xs text-center py-6">No bids placed yet</p>}
                  {bidHistory.map((b, i) => (
                    <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${i === 0 ? 'bg-amber-50 text-[#111827] font-semibold' : 'text-[#4b5563]'}`}>
                      <span className="text-xs truncate">{b.teamName}</span>
                      <span className={`text-xs font-black tabular-nums ml-2 ${i === 0 ? 'text-[#c59b27]' : 'text-[#0d3a24]'}`}>{b.amount} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CENTER: Player Card */}
            <div className="lg:col-span-6 flex flex-col overflow-hidden h-full min-h-0">
              {activePlayer.isMysteryPlayer && activePlayer._isMasked ? (
                <div className="h-full min-h-0 flex-1 relative">
                  <MysteryPlayerCard
                    player={activePlayer}
                    revealTokens={team?.revealTokens ?? 0}
                    onReveal={handleReveal}
                    revealing={revealing}
                    revealed={revealedPlayerIds.has(activePlayer._id)}
                  />
                  <BigCountdownOverlay remaining={timer.remaining} paused={timer.paused} />
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden shadow-md h-full border border-[#e8e2d5] bg-white flex flex-col justify-end min-h-0">
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
                      <Logo size="lg" className="opacity-20" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(13,58,36,0.2) 40%, rgba(13,58,36,0.85) 75%, rgba(13,58,36,0.98) 100%)'
                    }}
                  />

                  {/* Base price badge top-left */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur border border-[#e8e2d5] rounded-2xl px-3.5 py-2 text-center shadow-sm z-10">
                    <p className="text-[#6b7280] text-[9px] uppercase tracking-wider font-bold">Base</p>
                    <p className="text-[#0d3a24] font-black text-lg tabular-nums leading-none">{activePlayer.basePrice} pts</p>
                  </div>

                  {/* 6-second Countdown Timer badge top-right */}
                  {timer.remaining !== null && (
                    <div className="absolute top-4 right-4 z-10">
                      <AuctionTimer remaining={timer.remaining} paused={timer.paused} size="lg" />
                    </div>
                  )}

                  {/* Big Glowing Countdown Overlay (3, 2, 1) */}
                  <BigCountdownOverlay remaining={timer.remaining} paused={timer.paused} />

                  {/* Player info — bottom overlay */}
                  <div className="relative z-10 px-6 pb-6 pt-10 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-[#d8b04a] text-xs uppercase tracking-widest font-bold">
                        {displaySkills(activePlayer.skills)[0] || 'Player'}
                      </p>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black uppercase leading-tight tracking-tight mb-2 truncate drop-shadow-md">
                      {activePlayer.name}
                    </h1>
                    <div className="flex flex-wrap gap-1.5">
                      {displaySkills(activePlayer.skills).map(s => <SkillBadge key={s} skill={s} />)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Budget + Squad */}
            <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden h-full min-h-0">
              {/* Budget Card */}
              <div className="bg-white border border-[#e8e2d5] rounded-3xl p-5 shadow-sm shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs uppercase tracking-wider font-bold text-[#6b7280]">Purse Overview</p>
                  <p className="font-black text-lg tabular-nums text-[#0d3a24]">
                    {team?.budget} <span className="text-[#6b7280] text-xs font-normal">pts left</span>
                  </p>
                </div>
                <div className="h-1.5 bg-[#f4efe6] rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-700 bg-[#0d3a24]"
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[#6b7280]">
                  <span>Spent: {team?.pointsSpent || 0} pts</span>
                  <span>{budgetPct}% spent</span>
                </div>
              </div>

              {/* Squad Card */}
              <div className="bg-white border border-[#e8e2d5] rounded-3xl p-5 flex-1 flex flex-col shadow-sm min-h-0">
                <p className="text-[#111827] text-xs uppercase tracking-wider font-bold mb-3 shrink-0">
                  My Squad · {team?.playerCount || 0}/{team?.teamSize || 7}
                </p>
                <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
                  {team?.players?.map(p => (
                    <div key={p._id} className="flex items-center justify-between py-2 px-3 rounded-2xl bg-[#faf8f5] border border-[#e8e2d5] shadow-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-[#111827] text-xs font-semibold truncate">{p.name}</p>
                        <div className="flex gap-1 mt-0.5">{p.skills?.slice(0,1).map(s => <SkillBadge key={s} skill={s} />)}</div>
                      </div>
                      <span className="text-[#c59b27] text-xs font-bold ml-2 shrink-0">{p.soldPrice} pts</span>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 7 - (team?.players?.length || 0)) }).map((_, i) => (
                    <div key={i} className="py-2.5 px-3 rounded-2xl border border-dashed border-[#e8e2d5] bg-white">
                      <p className="text-[#9ca3af] text-xs text-center font-medium">Empty Slot {(team?.players?.length || 0) + i + 1}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full bg-white border border-[#e8e2d5] rounded-3xl flex flex-col items-center justify-center p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#f4efe6] border border-[#e8e2d5] flex items-center justify-center mb-4">
              <Logo size="sm" className="opacity-70" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-[#111827] mb-2">Standing By For Next Player</h2>
            <p className="text-[#6b7280] text-sm">The auctioneer will place the next player on the bidding block soon.</p>
          </div>
        )}
      </div>

      {/* Mystery reveal overlay */}
      {revealOverlayPlayer && (
        <MysteryRevealOverlay
          player={revealOverlayPlayer}
          onClose={() => { setRevealOverlayPlayer(null); toast(`Won: ${revealOverlayPlayer.name}`, 'success'); }}
        />
      )}
    </div>
  );
}

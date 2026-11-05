'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import Image from 'next/image';
import SkillBadge from '@/components/SkillBadge';
import Logo from '@/components/Logo';
import MysteryPlayerCard from '@/components/MysteryPlayerCard';
import { playBidSound, playSoldSound, playUnsoldSound } from '@/lib/sounds';
import { displaySkills } from '@/lib/skills';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

function TeamCard({ team, idx }) {
  const [expanded, setExpanded] = useState(false);
  const maxBudget = team.initialBudget || 1000;
  const pct = Math.round(((team.pointsSpent || 0) / maxBudget) * 100);

  return (
    <div className="bg-[#0b172a] border border-[#c9a227]/20 rounded-xl overflow-hidden transition-all hover:border-[#c9a227]/40">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full p-4 text-left focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-[#c9a227]/40 text-xs font-mono w-4 shrink-0 text-center">
              {String(idx + 1).padStart(2, '0')}
            </span>
            {team.logo ? (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#c9a227]/20 bg-[#07111e] shrink-0">
                <Image src={team.logo} alt={team.name} fill unoptimized className="object-contain p-1" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg border border-[#c9a227]/15 bg-[#07111e] flex items-center justify-center shrink-0">
                <span className="text-[#c9a227]/60 text-sm font-bold">{team.name?.[0]}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{team.name}</p>
              <p className="text-white/40 text-xs mt-0.5">
                {team.playerCount || team.players?.length || 0}/7 players acquired
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[#c9a227] font-black text-base tabular-nums">{team.budget}</p>
            <p className="text-white/30 text-[10px] uppercase tracking-wider">pts purse</p>
          </div>
        </div>

        {/* Purse spent bar */}
        <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-[#c9a227] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-white/35">
          <span>{pct}% allocated</span>
          <span className="flex items-center gap-1 text-[#c9a227]/70 font-medium">
            {expanded ? 'Hide squad' : 'View squad'}
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </button>

      {/* Squad roster expandable list */}
      {expanded && (
        <div className="border-t border-[#c9a227]/15 px-3 py-2.5 space-y-1.5 max-h-48 overflow-y-auto bg-[#07111e]/60">
          {!team.players?.length ? (
            <p className="text-white/25 text-xs text-center py-3">No players acquired yet</p>
          ) : (
            team.players.map(p => (
              <div key={p._id} className="flex items-center justify-between bg-[#0b172a] rounded-lg px-2.5 py-1.5 gap-2 border border-white/5">
                <div className="min-w-0">
                  <p className="text-white/85 text-xs font-medium truncate">{p.name}</p>
                  <p className="text-white/35 text-[10px]">
                    {p.isMysteryPlayer ? `Mystery · ${p.skills?.[0] || 'Player'}` : (p.skills?.[0] || 'Player')}
                  </p>
                </div>
                <span className="text-[#c9a227] text-xs font-bold tabular-nums shrink-0">{p.soldPrice} pts</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AudienceView({ initialSport = 'cricket' }) {
  const sport = initialSport;
  const isFootball = sport === 'football';
  const sportLabel = isFootball ? 'Football' : 'Cricket';

  const [activePlayer, setActivePlayer] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [teams, setTeams] = useState([]);
  const [connected, setConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [finalizingState, setFinalizingState] = useState(null);
  const [mysteryReveal, setMysteryReveal] = useState(null);
  const [activeTab, setActiveTab] = useState('auto'); // 'auto' | 'auction' | 'teams'

  const socketRef = useRef(null);

  const fetchTeams = useCallback(() => {
    return fetch(`${BACKEND_URL}/api/teams-public?sport=${sport}`)
      .then(r => r.json())
      .then(d => setTeams(d.teams || []))
      .catch(() => {});
  }, [sport]);

  const fetchActiveAuction = useCallback(() => {
    return fetch(`${BACKEND_URL}/api/auction/active-public?sport=${sport}`)
      .then(r => r.json())
      .then(d => {
        if (d.session) {
          setActiveSession(d.session);
          setActivePlayer(d.session.playerId);
          setBidHistory(d.session.bids?.slice().reverse() || []);
          if (d.session.status === 'finalizing') {
            setFinalizingState(d.session);
          } else {
            setFinalizingState(null);
          }
        } else {
          setActiveSession(null);
          setActivePlayer(null);
          setBidHistory([]);
          setFinalizingState(null);
        }
      })
      .catch(() => {});
  }, [sport]);

  // Initial load and periodic safety net poll
  useEffect(() => {
    fetchActiveAuction();
    fetchTeams();

    const interval = setInterval(() => {
      fetchActiveAuction();
      fetchTeams();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchActiveAuction, fetchTeams]);

  // Socket connection strictly scoped to this sport
  useEffect(() => {
    const s = io(BACKEND_URL, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 10000,
      forceNew: true,
    });
    socketRef.current = s;

    s.on('connect', () => {
      setConnected(true);
      s.emit('join:sport', sport);
    });

    s.on('disconnect', () => setConnected(false));
    s.on('viewers:count', (count) => setViewerCount(count));

    s.on('auction:start', ({ session, player, sport: evSport }) => {
      if (evSport && evSport !== sport) return;
      setActiveSession(session);
      setActivePlayer(player);
      setBidHistory([]);
      setFinalizingState(null);
    });

    s.on('auction:bid_update', (data) => {
      if (data?.sport && data.sport !== sport) return;
      setActiveSession(prev => prev ? { ...prev, currentBid: data.currentBid, currentHighestBidderName: data.bidderTeamName } : prev);
      setBidHistory(prev => [{ teamName: data.bidderTeamName, amount: data.currentBid }, ...prev]);
      playBidSound();
    });

    s.on('auction:finalizing', (data) => {
      if (data?.sport && data.sport !== sport) return;
      setFinalizingState(data);
    });

    s.on('auction:sold', ({ player, team, sport: evSport }) => {
      if (evSport && evSport !== sport) return;
      setFinalizingState(null);
      setActiveSession(null);
      setActivePlayer(null);
      setBidHistory([]);
      playSoldSound();

      if (player?.isMysteryPlayer) {
        setMysteryReveal({ player, teamName: team?.name || '' });
      } else {
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({
            particleCount: 180,
            spread: 90,
            origin: { y: 0.55 },
            colors: ['#c9a227', '#f0c040', '#ffffff', '#ffd700'],
          });
        });
      }
      fetchTeams();
    });

    s.on('auction:unsold', (data) => {
      if (data?.sport && data.sport !== sport) return;
      setFinalizingState(null);
      setActiveSession(null);
      setActivePlayer(null);
      setBidHistory([]);
      playUnsoldSound();
    });

    s.on('auction:resale', (data) => {
      if (data?.sport && data.sport !== sport) return;
      fetchTeams();
    });

    return () => {
      s.off('auction:finalizing');
      s.disconnect();
    };
  }, [sport, fetchTeams]);

  const hasLivePlayer = Boolean(activeSession && activePlayer);
  const showLiveAuction = activeTab === 'auction' || (activeTab === 'auto' && hasLivePlayer);

  return (
    <div className="h-screen max-h-screen bg-[#07111e] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* Broadcast Header */}
      <header className="bg-[#0a1628]/95 border-b border-[#c9a227]/20 px-6 lg:px-10 h-14 flex items-center justify-between shrink-0 z-20 backdrop-blur-md">
        {/* Left: Brand & Sport identity */}
        <div className="flex items-center gap-3">
          <Logo size="sm" className="rounded-xl w-8 h-8 shadow-md" />
          <div className="flex items-center gap-2.5">
            <span className="text-[#c9a227] font-black text-sm tracking-[0.25em] uppercase">
              APL AUCTION
            </span>
            <span className="text-white/20 text-xs font-mono">|</span>
            <span className="text-white/60 text-xs uppercase tracking-[0.2em] font-semibold">
              {sportLabel} Premier League
            </span>
          </div>
        </div>

        {/* Center: Clean Minimal Section Indicator */}
        <div className="hidden md:flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab(hasLivePlayer ? 'auction' : 'auto')}
            className={`text-xs font-semibold uppercase tracking-wider transition-colors pb-1 border-b-2 ${
              showLiveAuction
                ? 'text-[#c9a227] border-[#c9a227]'
                : 'text-white/40 border-transparent hover:text-white/70'
            }`}
          >
            Live Auction
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teams')}
            className={`text-xs font-semibold uppercase tracking-wider transition-colors pb-1 border-b-2 ${
              !showLiveAuction
                ? 'text-[#c9a227] border-[#c9a227]'
                : 'text-white/40 border-transparent hover:text-white/70'
            }`}
          >
            Teams & Rosters
          </button>
        </div>

        {/* Right: Live broadcast status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-red-400 text-[11px] font-bold uppercase tracking-widest leading-none">
              Live Broadcast
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-white/40 text-xs font-medium">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-white/20'}`} />
            <span>{connected ? `${viewerCount || 1} watching` : 'Connecting'}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 flex flex-col p-4 lg:p-6 overflow-hidden">
        {showLiveAuction ? (
          /* Live Lot Screen */
          <div
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 overflow-hidden min-h-0"
            style={{ height: '100%', maxHeight: '100%' }}
          >
            {/* LEFT COLUMN: Current Bid & Leading Team */}
            <div className="lg:col-span-3 flex flex-col gap-4 min-h-0 overflow-hidden">
              <div className="bg-[#0b172a] border border-[#c9a227]/25 rounded-2xl p-6 shadow-2xl shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a227]/5 rounded-full blur-2xl pointer-events-none" />

                <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold mb-2">
                  Current Highest Bid
                </p>

                <div className="flex items-baseline gap-2 mb-5">
                  <span className="text-6xl font-black text-[#c9a227] tabular-nums leading-none tracking-tight">
                    {activeSession.currentBid}
                  </span>
                  <span className="text-white/40 text-base font-semibold uppercase tracking-wider">
                    pts
                  </span>
                </div>

                <div className="border-t border-[#c9a227]/15 pt-4">
                  <p className="text-white/35 text-[10px] uppercase tracking-wider mb-2 font-medium">
                    Leading Bidder
                  </p>
                  <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border ${
                    activeSession.currentHighestBidderName
                      ? 'bg-[#c9a227]/10 border-[#c9a227]/40 text-[#c9a227]'
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}>
                    {activeSession.currentHighestBidderName && (
                      <span className="w-2 h-2 rounded-full bg-[#c9a227] animate-pulse shrink-0" />
                    )}
                    <span className="text-sm font-bold truncate">
                      {activeSession.currentHighestBidderName || 'Waiting for first bid...'}
                    </span>
                  </div>
                </div>

                {finalizingState && (
                  <div className="mt-4 pt-3 border-t border-red-500/20">
                    <div className="flex items-center gap-2.5 bg-red-500/15 border border-red-500/40 rounded-xl px-3.5 py-2 text-xs text-red-400 font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-ping shrink-0" />
                      <span className="truncate">Finalizing Sale · Bidding Locked</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CENTER COLUMN: Cinematic Player Card */}
            <div className="lg:col-span-6 flex flex-col min-h-0 overflow-hidden" style={{ height: '100%', maxHeight: '100%' }}>
              {activePlayer.isMysteryPlayer && activePlayer._isMasked ? (
                <div className="flex-1 h-full min-h-0 overflow-hidden">
                  <MysteryPlayerCard player={activePlayer} revealTokens={null} />
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden shadow-2xl w-full flex flex-col justify-end border border-white/10 bg-[#0b172a]" style={{ height: '100%', maxHeight: '100%' }}>
                  {activePlayer.photo ? (
                    <>
                      <Image
                        src={activePlayer.photo}
                        alt=""
                        fill
                        unoptimized
                        className="absolute inset-0 object-cover scale-110 blur-2xl opacity-35 pointer-events-none"
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
                    <div className="absolute inset-0 bg-[#07111e] flex items-center justify-center">
                      <svg className="w-20 h-20 text-[#c9a227]/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}

                  {/* Dark gradient overlay for text legibility */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(7,17,30,0.05) 0%, rgba(7,17,30,0.3) 45%, rgba(7,17,30,0.92) 80%, rgba(7,17,30,0.99) 100%)',
                    }}
                  />

                  {/* Base Price Tag */}
                  <div className="absolute top-5 left-5 bg-[#07111e]/85 backdrop-blur-md border border-[#c9a227]/30 rounded-xl px-4 py-2 z-10 shadow-lg">
                    <p className="text-white/40 text-[9px] uppercase tracking-widest font-semibold">Base Price</p>
                    <p className="text-[#c9a227] font-black text-xl tabular-nums leading-none mt-0.5">
                      {activePlayer.basePrice} <span className="text-xs font-semibold text-white/50">pts</span>
                    </p>
                  </div>

                  {/* Player Information Footer */}
                  <div className="relative z-10 px-6 pb-6 pt-10">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <p className="text-[#c9a227] text-xs uppercase tracking-[0.25em] font-bold">
                        {displaySkills(activePlayer.skills)[0] || 'Player'}
                      </p>
                      {activePlayer.gender && (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                          activePlayer.gender === 'Female'
                            ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {activePlayer.gender}
                        </span>
                      )}
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-black text-white uppercase leading-none tracking-tight mb-4 truncate">
                      {activePlayer.name}
                    </h1>

                    <div className="flex flex-wrap gap-2">
                      {displaySkills(activePlayer.skills).map(s => (
                        <SkillBadge key={s} skill={s} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Real-time Bid History */}
            <div
              className="lg:col-span-3 bg-[#0b172a] border border-[#c9a227]/25 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-0"
              style={{ height: '100%', maxHeight: '100%' }}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#c9a227]/15 bg-[#07111e]/50 shrink-0">
                <p className="text-white/50 text-xs font-bold uppercase tracking-wider">
                  Live Bid Stream
                </p>
                <span className="text-[#c9a227] text-xs font-mono font-bold bg-[#c9a227]/15 border border-[#c9a227]/30 px-2 py-0.5 rounded-md">
                  {bidHistory.length} bids
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden divide-y divide-white/5 p-2">
                {bidHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <p className="text-white/30 text-xs font-medium">Awaiting opening bid...</p>
                  </div>
                ) : (
                  bidHistory.map((b, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors ${
                        i === 0 ? 'bg-[#c9a227]/15 border border-[#c9a227]/30' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-white/30 text-xs font-mono w-5 text-right shrink-0">
                          #{bidHistory.length - i}
                        </span>
                        <span className={`text-sm font-semibold truncate ${i === 0 ? 'text-white' : 'text-white/60'}`}>
                          {b.teamName}
                        </span>
                      </div>
                      <span className={`text-sm font-black tabular-nums shrink-0 ml-2 ${
                        i === 0 ? 'text-[#c9a227]' : 'text-white/50'
                      }`}>
                        {b.amount} pts
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Professional Standby / Overview Screen (When no player is actively being bid on) */
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto space-y-6">
            {/* Standby Broadcast Hero Card */}
            <div className="relative rounded-2xl overflow-hidden border border-[#c9a227]/25 bg-gradient-to-r from-[#0b172a] via-[#0d1d36] to-[#0b172a] p-8 lg:p-10 shadow-2xl text-center flex flex-col items-center justify-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#c9a227]/10 border border-[#c9a227]/30 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9a227] animate-pulse" />
                <span className="text-[#c9a227] text-xs font-bold uppercase tracking-widest">
                  Official Auction Floor Standby
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase mb-2">
                Waiting for Next Lot
              </h2>
              <p className="text-white/45 text-sm max-w-lg mb-6 leading-relaxed">
                The auctioneer will place the next {sportLabel.toLowerCase()} player on the hammer shortly. Live bidding updates and real-time team pursing will stream automatically.
              </p>

              {/* Live Metric Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
                <div className="bg-[#07111e]/80 border border-white/5 rounded-xl p-3">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Registered Teams</p>
                  <p className="text-white font-bold text-lg mt-0.5">{teams.length}</p>
                </div>
                <div className="bg-[#07111e]/80 border border-white/5 rounded-xl p-3">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Starting Purse</p>
                  <p className="text-[#c9a227] font-bold text-lg mt-0.5">1,000 pts</p>
                </div>
                <div className="bg-[#07111e]/80 border border-white/5 rounded-xl p-3">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Squad Limit</p>
                  <p className="text-white font-bold text-lg mt-0.5">7 Players</p>
                </div>
                <div className="bg-[#07111e]/80 border border-white/5 rounded-xl p-3">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Sync Channel</p>
                  <p className="text-emerald-400 font-bold text-lg mt-0.5">Live Room</p>
                </div>
              </div>
            </div>

            {/* League Teams Roster Overview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-[0.2em]">
                  {sportLabel} League Teams & Purses
                </h3>
                <span className="text-white/30 text-xs font-mono">{teams.length} teams competing</span>
              </div>

              {teams.length === 0 ? (
                <div className="border border-white/5 rounded-2xl p-12 text-center text-white/30 text-sm bg-[#0b172a]">
                  No teams registered for this league yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {teams.map((team, idx) => (
                    <TeamCard key={team._id} team={team} idx={idx} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mystery reveal overlay */}
      {mysteryReveal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="flex flex-col items-center gap-5 px-6 max-w-sm w-full text-center">
            <div className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/40 rounded-full px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-purple-300 text-xs font-black uppercase tracking-wider">Mystery Revealed!</span>
            </div>

            <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-2 border-[#c9a227]/60 shadow-2xl shadow-[#c9a227]/20">
              {mysteryReveal.player.photo ? (
                <Image
                  src={mysteryReveal.player.photo}
                  alt={mysteryReveal.player.name}
                  fill
                  unoptimized
                  className="object-cover"
                  style={{ objectPosition: '50% 20%' }}
                />
              ) : (
                <div className="w-full h-full bg-[#0b172a] flex items-center justify-center">
                  <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            <div>
              <p className="text-[#c9a227]/60 text-xs uppercase tracking-widest mb-1">The mystery player was</p>
              <h2 className="text-3xl font-black text-white uppercase leading-tight">{mysteryReveal.player.name}</h2>
            </div>

            {mysteryReveal.player.skills?.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {displaySkills(mysteryReveal.player.skills).map(s => (
                  <span key={s} className="text-xs px-3 py-1 rounded-lg font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {s}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 bg-[#c9a227]/10 border border-[#c9a227]/25 rounded-xl px-4 py-2.5">
              <span className="text-white/40 text-sm">Sold to</span>
              <span className="text-[#c9a227] font-black text-base">{mysteryReveal.teamName}</span>
              <span className="text-white/40 text-sm">for</span>
              <span className="text-white font-black text-base">{mysteryReveal.player.soldPrice} pts</span>
            </div>

            <button
              onClick={() => {
                setMysteryReveal(null);
                import('canvas-confetti').then(({ default: confetti }) => {
                  confetti({ particleCount: 200, spread: 100, origin: { y: 0.55 }, colors: ['#c9a227', '#f0c040', '#ffffff', '#ffd700'] });
                });
              }}
              className="bg-[#c9a227] text-[#07111e] font-black px-8 py-3 rounded-xl text-sm hover:bg-[#f0c040] transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

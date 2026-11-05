'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import Image from 'next/image';
import SkillBadge from '@/components/SkillBadge';
import Logo from '@/components/Logo';
import MysteryPlayerCard from '@/components/MysteryPlayerCard';
import { playBidSound, playSoldSound, playUnsoldSound } from '@/lib/sounds';
import { displaySkills } from '@/lib/skills';
import { CricketIcon, FootballIcon } from '@/components/SportIcons';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// Football pitch line markings watermark
function FootballPitchLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-30 select-none">
      <svg
        className="w-full h-full max-w-6xl max-h-[85vh] text-emerald-400/20"
        viewBox="0 0 1000 600"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        {/* Outer pitch border */}
        <rect x="30" y="30" width="940" height="540" rx="6" />

        {/* Halfway line */}
        <line x1="500" y1="30" x2="500" y2="570" />

        {/* Center circle and spot */}
        <circle cx="500" cy="300" r="90" />
        <circle cx="500" cy="300" r="4" fill="currentColor" />

        {/* Left penalty box */}
        <rect x="30" y="150" width="160" height="300" />
        <rect x="30" y="220" width="60" height="160" />
        <circle cx="150" cy="300" r="4" fill="currentColor" />
        <path d="M190 240 A90 90 0 0 1 190 360" />

        {/* Right penalty box */}
        <rect x="810" y="150" width="160" height="300" />
        <rect x="910" y="220" width="60" height="160" />
        <circle cx="850" cy="300" r="4" fill="currentColor" />
        <path d="M810 240 A90 90 0 0 0 810 360" />

        {/* Corner arcs */}
        <path d="M30 50 A20 20 0 0 0 50 30" />
        <path d="M950 30 A20 20 0 0 0 970 50" />
        <path d="M30 550 A20 20 0 0 1 50 570" />
        <path d="M950 570 A20 20 0 0 1 970 550" />
      </svg>
    </div>
  );
}

// Position badge helper for football
function PositionPill({ skill, isFootball }) {
  if (!isFootball) return <SkillBadge skill={skill} />;

  const s = (skill || '').toLowerCase();
  let color = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (s.includes('forward') || s.includes('striker')) {
    color = 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20';
  } else if (s.includes('midfield')) {
    color = 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm shadow-sky-500/20';
  } else if (s.includes('defend')) {
    color = 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20';
  } else if (s.includes('goal') || s.includes('keeper')) {
    color = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20';
  }

  return (
    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${color}`}>
      {skill}
    </span>
  );
}

function TeamCard({ team, idx, isFootball }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round(((team.pointsSpent || 0) / 1000) * 100);

  const cardBorder = isFootball
    ? 'border-emerald-500/20 hover:border-emerald-400/50 bg-[#081e15]'
    : 'border-[#c9a227]/15 bg-[#0d1e3a]';
  const badgeColor = isFootball ? 'text-emerald-400/40' : 'text-[#c9a227]/30';
  const pointsColor = isFootball ? 'text-emerald-400' : 'text-[#c9a227]';
  const barColor = isFootball ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-[#c9a227]/60';

  return (
    <div className={`border rounded-lg lg:rounded-xl overflow-hidden transition-all duration-200 shadow-md ${cardBorder}`}>
      <button onClick={() => setExpanded(e => !e)} className="w-full p-3 sm:p-4 lg:p-5 text-left">
        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
          <div className="flex items-start gap-1.5 sm:gap-2 flex-1 min-w-0">
            <span className={`text-[10px] sm:text-xs w-4 shrink-0 text-center font-bold ${badgeColor}`}>{idx + 1}</span>
            {team.logo ? (
              <div className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden border shrink-0 ${isFootball ? 'border-emerald-500/30 bg-[#05140e]' : 'border-[#c9a227]/20 bg-[#0a1628]'}`}>
                <Image src={team.logo} alt={team.name} fill unoptimized className="object-contain p-1" />
              </div>
            ) : (
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border flex items-center justify-center shrink-0 ${isFootball ? 'border-emerald-500/20 bg-[#05140e]' : 'border-[#c9a227]/10 bg-[#0a1628]'}`}>
                <span className={`text-sm font-black ${isFootball ? 'text-emerald-400/50' : 'text-[#c9a227]/30'}`}>{team.name[0]}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white font-semibold text-xs sm:text-sm truncate">{team.name}</p>
              <p className="text-white/30 text-[10px] sm:text-xs">{team.playerCount || team.players?.length || 0}/7 players</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <p className={`font-bold text-xs sm:text-sm ${pointsColor}`}>{team.budget}</p>
            <p className="text-white/25 text-[9px] sm:text-xs">pts left</p>
          </div>
        </div>
        <div className="h-1 sm:h-1.5 bg-white/5 rounded-full overflow-hidden mb-1.5">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-white/20 text-[9px] sm:text-xs">{pct}% spent</p>
          <svg className={`w-3 h-3 text-white/20 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Players list — animated expand */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: expanded ? '300px' : '0px' }}
      >
        <div className={`border-t px-3 pb-3 space-y-1.5 max-h-48 overflow-y-auto ${isFootball ? 'border-emerald-500/10' : 'border-[#c9a227]/10'}`}>
          {!team.players?.length ? (
            <p className="text-white/20 text-xs text-center py-3">No players yet</p>
          ) : team.players.map(p => (
            <div key={p._id} className={`flex items-center justify-between rounded-lg px-2.5 py-2 gap-2 ${isFootball ? 'bg-[#05150f]' : 'bg-[#0a1628]/60'}`}>
              <div className="min-w-0">
                <p className="text-white/85 text-xs font-semibold truncate">
                  {p.name}
                </p>
                <p className={`text-[10px] ${isFootball ? 'text-emerald-400/60' : 'text-white/30'}`}>
                  {p.isMysteryPlayer ? `Mystery · ${p.skills?.[0] || '—'}` : (p.skills?.[0] || '—')}
                </p>
              </div>
              <span className={`text-[10px] font-bold shrink-0 ${pointsColor}`}>{p.soldPrice} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AudienceView({ initialSport = 'cricket' }) {
  const router = useRouter();
  const [sport, setSport] = useState(initialSport);
  const [activePlayer, setActivePlayer] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [teams, setTeams] = useState([]);
  const [connected, setConnected] = useState(false);
  const [tab, setTab] = useState('auction');
  const [viewerCount, setViewerCount] = useState(0);
  const [timer, setTimer] = useState({ remaining: null, paused: false });
  const [mysteryReveal, setMysteryReveal] = useState(null);
  const [finalizingState, setFinalizingState] = useState(null);

  const socketRef = useRef(null);
  const isFootball = sport === 'football';
  const sportLabel = isFootball ? 'Football' : 'Cricket';

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
          setTimer({ remaining: d.session.timerRemaining, paused: d.session.timerPaused });
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

  useEffect(() => {
    fetchActiveAuction();
    fetchTeams();

    const interval = setInterval(() => {
      fetchActiveAuction();
      fetchTeams();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchActiveAuction, fetchTeams]);

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
      setTimer({ remaining: session.timerRemaining, paused: false });
      setFinalizingState(null);
      setTab('auction');
    });

    s.on('auction:bid_update', (data) => {
      if (data?.sport && data.sport !== sport) return;
      setActiveSession(prev => prev ? { ...prev, currentBid: data.currentBid, currentHighestBidderName: data.bidderTeamName } : prev);
      setBidHistory(prev => [{ teamName: data.bidderTeamName, amount: data.currentBid }, ...prev]);
      playBidSound();
    });

    s.on('auction:timer', (data) => {
      if (data?.sport && data.sport !== sport) return;
      setTimer(data);
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
      setTimer({ remaining: null, paused: false });
      playSoldSound();

      if (player?.isMysteryPlayer) {
        setMysteryReveal({ player, teamName: team?.name || '' });
      } else {
        const confettiColors = isFootball
          ? ['#10b981', '#00f59b', '#ffffff', '#34d399', '#06b6d4']
          : ['#c9a227', '#f0c040', '#ffffff', '#ffd700'];
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({ particleCount: 220, spread: 110, origin: { y: 0.55 }, colors: confettiColors });
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
      setTimer({ remaining: null, paused: false });
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
  }, [sport, fetchTeams, isFootball]);

  const handleSportSwitch = (targetSport) => {
    if (targetSport === sport) return;
    setSport(targetSport);
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:sport', targetSport);
    }
    router.push(targetSport === 'football' ? '/audience/football' : '/audience');
  };

  // Theme tokens
  const pageBg = isFootball
    ? 'bg-[#040e0a]'
    : 'bg-[#0a1628]';

  const headerBg = isFootball
    ? 'bg-[#071912] border-emerald-500/25 shadow-lg shadow-emerald-950/40'
    : 'bg-[#0d1e3a] border-[#c9a227]/20';

  const activeTabStyle = isFootball
    ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold'
    : 'text-[#c9a227] border-b-2 border-[#c9a227] font-semibold';

  const cardContainerBg = isFootball
    ? 'bg-[#071d14] border-emerald-500/25 shadow-2xl shadow-emerald-950/50'
    : 'bg-[#0d1e3a] border-[#c9a227]/20 shadow-xl';

  const accentColor = isFootball ? 'text-emerald-400' : 'text-[#c9a227]';

  return (
    <div className={`h-screen max-h-screen ${pageBg} text-white flex flex-col overflow-hidden relative font-sans transition-colors duration-300`}>
      {/* Background Stadium Glow & Watermark (Only for Football) */}
      {isFootball && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(16, 185, 129, 0.15) 0%, rgba(4, 14, 10, 0) 80%)'
            }}
          />
          <FootballPitchLines />
        </>
      )}

      {/* Header */}
      <header className={`${headerBg} border-b px-4 lg:px-8 h-12 lg:h-14 flex items-center justify-between shrink-0 z-20 backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Logo size="sm" className="rounded-xl w-7 h-7" />
            <div className="flex flex-col">
              <span className={`font-black text-xs tracking-widest uppercase leading-none ${isFootball ? 'text-emerald-400' : 'text-[#c9a227]'}`}>
                {isFootball ? 'APL Football' : 'APL Cricket'}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-white/30 font-semibold">Live Auction Broadcast</span>
            </div>
          </div>

          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${
            isFootball
              ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300 shadow-sm shadow-emerald-500/20'
              : 'bg-[#c9a227]/10 border-[#c9a227]/25 text-[#c9a227]'
          }`}>
            {isFootball ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#c9a227] animate-pulse" />
            )}
            <span className="uppercase tracking-widest text-[10px]">{sportLabel} ARENA</span>
          </div>
        </div>

        {/* Center: Sport Switcher segmented control */}
        <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 shadow-inner backdrop-blur">
          <button
            type="button"
            onClick={() => handleSportSwitch('cricket')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !isFootball
                ? 'bg-[#c9a227] text-[#0a1628] shadow-md shadow-[#c9a227]/30 scale-[1.02]'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <CricketIcon className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Cricket</span>
          </button>
          <button
            type="button"
            onClick={() => handleSportSwitch('football')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isFootball
                ? 'bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/40 scale-[1.02]'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <FootballIcon className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Football</span>
          </button>
        </div>

        {/* Right: Live Connection & Viewers */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-black/30 border border-white/10 rounded-full px-2.5 py-1">
            <div className={`w-2 h-2 rounded-full ${connected ? (isFootball ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-[#c9a227]') : 'bg-white/20'}`} />
            <span className="text-white/40 text-[11px] font-medium hidden md:inline">{connected ? 'Live Feed' : 'Connecting'}</span>
          </div>
          {viewerCount > 0 && (
            <div className={`flex items-center gap-2 border rounded-full px-2.5 py-1 ${
              isFootball
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-[#c9a227]/10 border-[#c9a227]/20 text-[#c9a227]'
            }`}>
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isFootball ? 'bg-emerald-400' : 'bg-[#c9a227]'}`} />
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isFootball ? 'bg-emerald-400' : 'bg-[#c9a227]'}`} />
              </span>
              <span className="text-xs font-bold tabular-nums leading-none">{viewerCount} live</span>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className={`flex border-b shrink-0 z-10 ${
        isFootball ? 'border-emerald-500/20 bg-[#061710]/90 backdrop-blur' : 'border-[#c9a227]/15 bg-[#0a1628]'
      }`}>
        <button onClick={() => setTab('auction')}
          className={`flex-1 lg:flex-none px-5 lg:px-8 py-3 text-xs lg:text-sm transition-colors ${tab === 'auction' ? activeTabStyle : 'text-white/40 hover:text-white/80'}`}>
          Live {sportLabel} Auction
        </button>
        <button onClick={() => setTab('teams')}
          className={`flex-1 lg:flex-none px-5 lg:px-8 py-3 text-xs lg:text-sm transition-colors ${tab === 'teams' ? activeTabStyle : 'text-white/40 hover:text-white/80'}`}>
          {sportLabel} Clubs & Squads
        </button>
      </div>

      {/* Main View Area */}
      <div className="flex-1 min-h-0 flex flex-col p-3 lg:p-4 overflow-hidden z-10" style={{ height: 'calc(100vh - 105px)' }}>

        {/* Auction Tab */}
        {tab === 'auction' && (
          <>
            {activeSession && activePlayer ? (
              <div
                className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 overflow-hidden min-h-0"
                style={{ height: '100%', maxHeight: '100%' }}
              >
                {/* LEFT: Current Bid */}
                <div className="lg:col-span-3 flex flex-col gap-3 min-h-0 overflow-hidden">
                  <div className={`${cardContainerBg} rounded-2xl p-5 shrink-0`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Current Highest Bid</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black tracking-wider uppercase border ${
                        isFootball ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-[#c9a227]/20 border-[#c9a227]/40 text-[#c9a227]'
                      }`}>
                        Active
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-4">
                      <span className={`text-5xl font-black tabular-nums leading-none tracking-tight ${
                        isFootball
                          ? 'text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                          : 'text-[#c9a227]'
                      }`}>
                        {activeSession.currentBid}
                      </span>
                      <span className="text-white/40 text-base font-semibold">pts</span>
                    </div>

                    <div className={`border-t pt-3 ${isFootball ? 'border-emerald-500/15' : 'border-[#c9a227]/10'}`}>
                      <p className="text-white/30 text-[9px] uppercase tracking-wider mb-1 font-bold">Leading Bidder</p>
                      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
                        activeSession.currentHighestBidderName
                          ? (isFootball ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-950/80' : 'bg-[#c9a227]/15 border-[#c9a227]/40 text-[#c9a227]')
                          : 'bg-white/5 border-white/10 text-white/40'
                      }`}>
                        {activeSession.currentHighestBidderName && (
                          <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${isFootball ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-[#c9a227]'}`} />
                        )}
                        <span className="text-sm font-bold truncate">{activeSession.currentHighestBidderName || 'No bids yet'}</span>
                      </div>
                    </div>

                    {finalizingState && (
                      <div className={`mt-3 pt-3 border-t ${isFootball ? 'border-emerald-500/20' : 'border-[#c9a227]/10'}`}>
                        <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 text-xs font-bold ${
                          isFootball ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' : 'bg-[#c9a227]/15 border-[#c9a227]/40 text-[#c9a227]'
                        }`}>
                          <span className={`w-2 h-2 rounded-full animate-ping shrink-0 ${isFootball ? 'bg-emerald-400' : 'bg-[#c9a227]'}`} />
                          <span className="truncate">Bidding Locked · Finalizing Sale</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CENTER: Player Card */}
                <div className="lg:col-span-6 flex flex-col min-h-0 overflow-hidden" style={{ height: '100%', maxHeight: '100%' }}>
                  {activePlayer.isMysteryPlayer && activePlayer._isMasked ? (
                    <div className="flex-1 h-full min-h-0 overflow-hidden">
                      <MysteryPlayerCard player={activePlayer} revealTokens={null} />
                    </div>
                  ) : (
                  <div className={`relative rounded-2xl overflow-hidden shadow-2xl w-full flex flex-col justify-end border ${
                    isFootball ? 'border-emerald-500/30 shadow-emerald-950/60' : 'border-[#c9a227]/30 shadow-black'
                  }`} style={{ height: '100%', maxHeight: '100%' }}>
                    {activePlayer.photo ? (
                      <>
                        <Image src={activePlayer.photo} alt="" fill unoptimized
                          className="absolute inset-0 object-cover scale-110 blur-xl opacity-40 pointer-events-none"
                          onError={() => {}} />
                        <Image src={activePlayer.photo} alt={activePlayer.name} fill unoptimized
                          className="absolute inset-0 object-cover"
                          style={{ objectPosition: '50% 20%' }}
                          loading="eager"
                          onError={(e) => { e.target.style.display = 'none'; }} />
                      </>
                    ) : (
                      <div className={`absolute inset-0 flex items-center justify-center ${isFootball ? 'bg-[#061811]' : 'bg-[#0d1e3a]'}`}>
                        {isFootball ? (
                          <FootballIcon className="w-20 h-20 text-emerald-400/20" />
                        ) : (
                          <CricketIcon className="w-20 h-20 text-[#c9a227]/15" />
                        )}
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: isFootball
                          ? 'linear-gradient(to bottom, rgba(4,14,10,0.1) 0%, rgba(4,14,10,0.3) 40%, rgba(4,14,10,0.88) 70%, #040e0a 100%)'
                          : 'linear-gradient(to bottom, rgba(10,22,40,0.1) 0%, rgba(10,22,40,0.2) 40%, rgba(10,22,40,0.85) 70%, rgba(10,22,40,0.98) 100%)'
                      }}
                    />

                    {/* Top Badges */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-600/90 backdrop-blur px-3 py-1 rounded-full z-10 shadow-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-white text-[10px] font-bold uppercase tracking-wider">Live On Pitch</span>
                    </div>

                    <div className={`absolute top-4 left-4 backdrop-blur border rounded-xl px-3 py-2 text-center z-10 ${
                      isFootball ? 'bg-[#05140e]/90 border-emerald-500/40 text-emerald-400' : 'bg-[#0a1628]/80 border-[#c9a227]/30 text-[#c9a227]'
                    }`}>
                      <p className="text-white/40 text-[9px] uppercase tracking-wider font-semibold">Base Price</p>
                      <p className="font-black text-lg tabular-nums leading-none">{activePlayer.basePrice} pts</p>
                    </div>

                    {/* Player Info Footer */}
                    <div className="relative z-10 px-5 pb-5 pt-8">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {displaySkills(activePlayer.skills).map(s => (
                          <PositionPill key={s} skill={s} isFootball={isFootball} />
                        ))}
                        {activePlayer.gender && (
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            activePlayer.gender === 'Female'
                              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {activePlayer.gender}
                          </span>
                        )}
                      </div>
                      <h1 className="text-4xl sm:text-5xl font-black text-white uppercase leading-none tracking-tight mb-2 truncate">
                        {activePlayer.name}
                      </h1>
                    </div>
                  </div>
                  )}
                </div>

                {/* RIGHT: Bid History */}
                <div
                  className={`lg:col-span-3 ${cardContainerBg} rounded-2xl overflow-hidden flex flex-col min-h-0`}
                  style={{ height: '100%', maxHeight: '100%' }}
                >
                  <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
                    isFootball ? 'border-emerald-500/15' : 'border-[#c9a227]/10'
                  }`}>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider">
                      {isFootball ? 'Match Bid History' : 'Bid History'}
                    </p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      isFootball ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-[#c9a227]/10 text-[#c9a227]'
                    }`}>
                      {bidHistory.length}
                    </span>
                  </div>
                  <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden divide-y ${
                    isFootball ? 'divide-emerald-500/10' : 'divide-[#c9a227]/5'
                  }`}>
                    {bidHistory.length === 0 && (
                      <p className="text-white/30 text-xs text-center py-8">No bids registered yet</p>
                    )}
                    {bidHistory.map((b, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between px-4 py-2.5 transition-colors ${
                          i === 0
                            ? (isFootball ? 'bg-emerald-500/15 border-l-4 border-emerald-400' : 'bg-[#c9a227]/8 border-l-4 border-[#c9a227]')
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-white/25 text-xs font-mono w-6 text-right shrink-0">#{bidHistory.length - i}</span>
                          <span className={`text-sm font-semibold truncate ${i === 0 ? 'text-white' : 'text-white/60'}`}>{b.teamName}</span>
                        </div>
                        <span className={`text-sm font-black tabular-nums shrink-0 ml-2 ${
                          i === 0
                            ? (isFootball ? 'text-emerald-400' : 'text-[#c9a227]')
                            : 'text-white/50'
                        }`}>
                          {b.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* EMPTY / WAITING FOR AUCTION STATE */
              <div className={`flex-1 ${cardContainerBg} rounded-2xl flex flex-col items-center justify-center p-8 lg:p-14 text-center min-h-[420px] relative overflow-hidden`}>
                {isFootball ? (
                  /* Dedicated Football Stadium Center Spot Experience */
                  <div className="flex flex-col items-center max-w-lg relative z-10">
                    <div className="relative mb-6">
                      {/* Pulsing Stadium Radar Rings */}
                      <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
                      <div className="w-24 h-24 rounded-full border-2 border-emerald-400/40 flex items-center justify-center bg-gradient-to-b from-[#092b1d] to-[#04120a] shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        <FootballIcon className="w-12 h-12 text-emerald-400 animate-spin-slow drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                      </div>
                      <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#040e0a] animate-ping" />
                    </div>

                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-widest mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Pitch Ready · Live Broadcast
                    </div>

                    <h2 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tight mb-2">
                      Football Player Draft
                    </h2>
                    <p className="text-white/50 text-sm max-w-md leading-relaxed mb-6">
                      The auctioneer will call the next football player to the pitch shortly. All live bids and squad acquisitions will update in real time.
                    </p>

                    <div className="flex items-center gap-3 text-xs font-semibold text-emerald-300/80">
                      <span className="bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                        ⚽ {teams.length} Football Clubs
                      </span>
                      <span className="bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                        🛡️ Squad Cap: 7
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Classic Cricket Waiting State */
                  <div className="flex flex-col items-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-[#c9a227]/10 border border-[#c9a227]/25 flex items-center justify-center mb-4 shadow-lg shadow-[#c9a227]/10">
                      <CricketIcon className="w-9 h-9 text-[#c9a227]" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9a227]/15 border border-[#c9a227]/30 text-[#c9a227] text-xs font-bold uppercase tracking-wider mb-2">
                      Cricket Auction
                    </div>
                    <p className="text-white font-bold text-xl mb-1">Waiting for Next Player</p>
                    <p className="text-white/40 text-sm">The next cricket player will appear here shortly</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Teams Tab */}
        {tab === 'teams' && (
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 content-start items-start overflow-y-auto">
            {teams.length === 0 ? (
              <div className="col-span-full py-20 text-center text-white/30 text-sm">
                No {sportLabel.toLowerCase()} teams registered yet.
              </div>
            ) : (
              teams.map((team, idx) => (
                <TeamCard key={team._id} team={team} idx={idx} isFootball={isFootball} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Floating Home button */}
      <button
        onClick={() => router.push('/')}
        className={`fixed bottom-5 left-5 flex items-center gap-2 border rounded-full px-4 py-2 shadow-xl transition-all z-50 backdrop-blur-md ${
          isFootball
            ? 'bg-[#071d14]/90 border-emerald-500/40 text-emerald-300 hover:text-white hover:border-emerald-400'
            : 'bg-[#0d1e3a]/90 border-[#c9a227]/30 text-white/60 hover:text-white hover:border-[#c9a227]/60'
        }`}
        aria-label="Back to home"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        <span className="text-xs font-semibold">Home</span>
      </button>

      {/* Mystery reveal overlay */}
      {mysteryReveal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(10px)' }}>
          <div className="flex flex-col items-center gap-5 px-6 max-w-sm w-full text-center"
            style={{ animation: 'fadeInUp 0.5s ease forwards' }}>
            <div className={`flex items-center gap-2 border rounded-full px-4 py-1.5 ${
              isFootball ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300' : 'bg-purple-500/20 border-purple-500/40 text-purple-300'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider">Mystery Revealed!</span>
            </div>

            <div className={`relative w-40 h-40 rounded-2xl overflow-hidden border-2 shadow-2xl ${
              isFootball ? 'border-emerald-400 shadow-emerald-500/30' : 'border-[#c9a227]/60 shadow-[#c9a227]/20'
            }`}>
              {mysteryReveal.player.photo ? (
                <Image src={mysteryReveal.player.photo} alt={mysteryReveal.player.name} fill unoptimized
                  className="object-cover" style={{ objectPosition: '50% 20%' }} />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${isFootball ? 'bg-[#061811]' : 'bg-[#0d1e3a]'}`}>
                  <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            <div>
              <p className={`text-xs uppercase tracking-widest mb-1 ${isFootball ? 'text-emerald-400/70' : 'text-[#c9a227]/60'}`}>The mystery player was</p>
              <h2 className="text-3xl font-black text-white uppercase leading-tight">{mysteryReveal.player.name}</h2>
            </div>

            {mysteryReveal.player.skills?.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {displaySkills(mysteryReveal.player.skills).map(s => (
                  <PositionPill key={s} skill={s} isFootball={isFootball} />
                ))}
              </div>
            )}

            <div className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 ${
              isFootball ? 'bg-emerald-950/60 border-emerald-500/40' : 'bg-[#c9a227]/10 border-[#c9a227]/25'
            }`}>
              <span className="text-white/40 text-sm">Signed by</span>
              <span className={`font-black text-base ${isFootball ? 'text-emerald-400' : 'text-[#c9a227]'}`}>{mysteryReveal.teamName}</span>
              <span className="text-white/40 text-sm">for</span>
              <span className="text-white font-black text-base">{mysteryReveal.player.soldPrice} pts</span>
            </div>

            <button
              onClick={() => {
                setMysteryReveal(null);
                const confettiColors = isFootball
                  ? ['#10b981', '#00f59b', '#ffffff', '#34d399', '#06b6d4']
                  : ['#c9a227', '#f0c040', '#ffffff', '#ffd700'];
                import('canvas-confetti').then(({ default: confetti }) => {
                  confetti({ particleCount: 200, spread: 100, origin: { y: 0.55 }, colors: confettiColors });
                });
              }}
              className={`font-black px-8 py-3 rounded-xl text-sm transition-all shadow-lg ${
                isFootball ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-emerald-500/30' : 'bg-[#c9a227] text-[#0a1628] hover:bg-[#f0c040]'
              }`}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

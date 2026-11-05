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

// Football pitch line markings watermark (subtle on light background)
function FootballPitchLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-40 select-none">
      <svg
        className="w-full h-full max-w-6xl max-h-[85vh] text-[#0d3a24]/12"
        viewBox="0 0 1000 600"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="30" y="30" width="940" height="540" rx="6" />
        <line x1="500" y1="30" x2="500" y2="570" />
        <circle cx="500" cy="300" r="90" />
        <circle cx="500" cy="300" r="4" fill="currentColor" />
        <rect x="30" y="150" width="160" height="300" />
        <rect x="30" y="220" width="60" height="160" />
        <circle cx="150" cy="300" r="4" fill="currentColor" />
        <path d="M190 240 A90 90 0 0 1 190 360" />
        <rect x="810" y="150" width="160" height="300" />
        <rect x="910" y="220" width="60" height="160" />
        <circle cx="850" cy="300" r="4" fill="currentColor" />
        <path d="M810 240 A90 90 0 0 0 810 360" />
        <path d="M30 50 A20 20 0 0 0 50 30" />
        <path d="M950 30 A20 20 0 0 0 970 50" />
      </svg>
    </div>
  );
}

// Cricket pitch lines watermark
function CricketFieldLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-40 select-none">
      <svg
        className="w-full h-full max-w-5xl max-h-[85vh] text-[#c59b27]/15"
        viewBox="0 0 1000 700"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <ellipse cx="500" cy="350" rx="460" ry="310" strokeWidth="2.5" />
        <circle cx="500" cy="350" r="230" strokeWidth="2" strokeDasharray="8 8" />
        <rect x="460" y="180" width="80" height="340" rx="4" strokeWidth="2" />
        <line x1="440" y1="230" x2="560" y2="230" strokeWidth="2" />
        <line x1="440" y1="470" x2="560" y2="470" strokeWidth="2" />
        <line x1="465" y1="210" x2="535" y2="210" strokeWidth="3" strokeLinecap="round" />
        <line x1="465" y1="490" x2="535" y2="490" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function PositionPill({ skill, isFootball }) {
  if (!isFootball) return <SkillBadge skill={skill} />;
  return (
    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#f4efe6] text-[#0d3a24] border border-[#e8e2d5]">
      {skill}
    </span>
  );
}

function TeamCard({ team, idx }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round(((team.pointsSpent || 0) / 1000) * 100);

  return (
    <div className="border border-[#e8e2d5] hover:border-[#0d3a24]/30 rounded-2xl overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md bg-white">
      <button onClick={() => setExpanded(e => !e)} className="w-full p-4 sm:p-5 text-left">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <span className="text-xs w-5 shrink-0 text-center font-bold text-[#9ca3af]">{idx + 1}</span>
            {team.logo ? (
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#e8e2d5] bg-[#faf8f5] shrink-0">
                <Image src={team.logo} alt={team.name} fill unoptimized className="object-contain p-1" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl border border-[#e8e2d5] bg-[#faf8f5] flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-[#0d3a24]">{team.name[0]}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[#111827] font-bold text-sm truncate">{team.name}</p>
              <p className="text-[#6b7280] text-xs">{team.playerCount || team.players?.length || 0}/{team.teamSize || 7} players</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <p className="font-black text-base text-[#0d3a24] tabular-nums">{team.budget}</p>
            <p className="text-[#6b7280] text-[10px]">pts left</p>
          </div>
        </div>
        <div className="h-1.5 bg-[#f4efe6] rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all duration-500 bg-[#0d3a24]" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[#9ca3af] text-xs">{pct}% spent</p>
          <svg className={`w-3.5 h-3.5 text-[#6b7280] transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Players list — animated expand */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: expanded ? '320px' : '0px' }}
      >
        <div className="border-t border-[#e8e2d5] bg-[#faf8f5] p-3 space-y-1.5 max-h-52 overflow-y-auto">
          {!team.players?.length ? (
            <p className="text-[#9ca3af] text-xs text-center py-3">No players yet</p>
          ) : team.players.map(p => (
            <div key={p._id} className="flex items-center justify-between rounded-xl px-3 py-2 bg-white border border-[#e8e2d5] gap-2 shadow-sm">
              <div className="min-w-0">
                <p className="text-[#111827] text-xs font-semibold truncate">{p.name}</p>
                <p className="text-[#6b7280] text-[10px]">{p.isMysteryPlayer ? `Mystery · ${p.skills?.[0] || '—'}` : (p.skills?.[0] || '—')}</p>
              </div>
              <span className="text-[11px] font-black text-[#c59b27] tabular-nums shrink-0">{p.soldPrice} pts</span>
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
  const isFootball = sport === 'football';
  const sportLabel = isFootball ? 'Football' : 'Cricket';

  const [activeSession, setActiveSession] = useState(null);
  const [activePlayer, setActivePlayer] = useState(null);
  const [teams, setTeams] = useState([]);
  const [bidHistory, setBidHistory] = useState([]);
  const [connected, setConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [tab, setTab] = useState('auction');
  const [mysteryReveal, setMysteryReveal] = useState(null);
  const [timer, setTimer] = useState({ remaining: null, paused: false });
  const [finalizingState, setFinalizingState] = useState(null);
  const socketRef = useRef(null);

  const fetchTeams = useCallback(() => {
    fetch(`${BACKEND_URL}/api/teams?sport=${sport}`)
      .then(r => r.json())
      .then(d => { if (d.teams) setTeams(d.teams); })
      .catch(() => {});
  }, [sport]);

  const fetchActiveAuction = useCallback(() => {
    fetch(`${BACKEND_URL}/api/auction/active?sport=${sport}`)
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
        const confettiColors = ['#0d3a24', '#c59b27', '#ffffff', '#225c40'];
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

  return (
    <div className="h-screen max-h-screen bg-[#f8f6f0] text-[#111827] flex flex-col overflow-hidden relative font-sans transition-colors duration-300">
      {/* Background Stadium Glow & Watermark (Cricket & Football) */}
      {isFootball ? <FootballPitchLines /> : <CricketFieldLines />}

      {/* Header */}
      <header className="bg-white border-b border-[#e8e2d5] px-4 lg:px-8 h-14 lg:h-16 flex items-center justify-between shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" className="rounded-xl w-8 h-8" />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-sm tracking-wide text-[#0d3a24]">
                {isFootball ? 'APL Football' : 'APL Cricket'}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold">Live Broadcast</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#e8e2d5] bg-[#f4efe6] text-[#0d3a24] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#0d3a24] animate-pulse" />
            <span className="uppercase tracking-widest text-[10px]">{sportLabel} ARENA</span>
          </div>
        </div>

        {/* Center: Sport Switcher */}
        <div className="flex items-center bg-[#f4efe6] p-1 rounded-xl border border-[#e8e2d5] shadow-inner">
          <button
            type="button"
            onClick={() => handleSportSwitch('cricket')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !isFootball
                ? 'bg-[#0d3a24] text-white shadow-sm'
                : 'text-[#4b5563] hover:text-[#111827]'
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
                ? 'bg-[#0d3a24] text-white shadow-sm'
                : 'text-[#4b5563] hover:text-[#111827]'
            }`}
          >
            <FootballIcon className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Football</span>
          </button>
        </div>

        {/* Right: Live Connection & Viewers */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#faf8f5] border border-[#e8e2d5] rounded-full px-2.5 py-1">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-stone-300'}`} />
            <span className="text-[#6b7280] text-[11px] font-semibold hidden md:inline">{connected ? 'Live Feed' : 'Connecting'}</span>
          </div>
          {viewerCount > 0 && (
            <div className="flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-xs font-bold tabular-nums leading-none">{viewerCount} live</span>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-[#e8e2d5] bg-white shrink-0 z-10 px-4 lg:px-8">
        <button
          onClick={() => setTab('auction')}
          className={`px-5 py-3 text-xs lg:text-sm font-semibold transition-all ${
            tab === 'auction'
              ? 'text-[#0d3a24] border-b-2 border-[#0d3a24] font-bold'
              : 'text-[#6b7280] hover:text-[#111827]'
          }`}
        >
          Live {sportLabel} Auction
        </button>
        <button
          onClick={() => setTab('teams')}
          className={`px-5 py-3 text-xs lg:text-sm font-semibold transition-all ${
            tab === 'teams'
              ? 'text-[#0d3a24] border-b-2 border-[#0d3a24] font-bold'
              : 'text-[#6b7280] hover:text-[#111827]'
          }`}
        >
          {sportLabel} Clubs & Squads
        </button>
      </div>

      {/* Main View Area */}
      <div className="flex-1 min-h-0 flex flex-col p-4 lg:p-6 overflow-hidden z-10" style={{ height: 'calc(100vh - 110px)' }}>

        {/* Auction Tab */}
        {tab === 'auction' && (
          <>
            {activeSession && activePlayer ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden min-h-0 h-full">
                
                {/* LEFT: Current Bid */}
                <div className="lg:col-span-3 flex flex-col gap-3 min-h-0 overflow-hidden">
                  <div className="bg-white border border-[#e8e2d5] rounded-3xl p-6 shadow-sm shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[#6b7280] text-[10px] uppercase tracking-widest font-bold">Highest Bid</p>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Active
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-5xl font-black tabular-nums leading-none tracking-tight text-[#0d3a24]">
                        {activeSession.currentBid}
                      </span>
                      <span className="text-[#6b7280] text-base font-semibold">pts</span>
                    </div>

                    <div className="border-t border-gray-100 pt-3.5">
                      <p className="text-[#6b7280] text-[10px] uppercase tracking-wider mb-1 font-bold">Leading Bidder</p>
                      <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border ${
                        activeSession.currentHighestBidderName
                          ? 'bg-[#f4efe6] border-[#e8e2d5] text-[#0d3a24] font-bold shadow-sm'
                          : 'bg-[#faf8f5] border-[#e8e2d5] text-[#9ca3af]'
                      }`}>
                        {activeSession.currentHighestBidderName && (
                          <span className="w-2 h-2 rounded-full bg-[#0d3a24] animate-pulse shrink-0" />
                        )}
                        <span className="text-sm truncate font-semibold">{activeSession.currentHighestBidderName || 'No bids yet'}</span>
                      </div>
                    </div>

                    {finalizingState && (
                      <div className="mt-3.5 pt-3.5 border-t border-gray-100">
                        <div className="flex items-center gap-2 border border-amber-300 bg-amber-50 rounded-xl px-3 py-2 text-xs font-bold text-amber-900 shadow-sm animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping shrink-0" />
                          <span className="truncate">Finalizing Sale...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CENTER: Player Card */}
                <div className="lg:col-span-6 flex flex-col min-h-0 overflow-hidden h-full">
                  {activePlayer.isMysteryPlayer && activePlayer._isMasked ? (
                    <div className="flex-1 h-full min-h-0 overflow-hidden">
                      <MysteryPlayerCard player={activePlayer} revealTokens={null} />
                    </div>
                  ) : (
                    <div className="relative rounded-3xl overflow-hidden shadow-md w-full flex flex-col justify-end border border-[#e8e2d5] bg-white h-full">
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
                        <div className="absolute inset-0 flex items-center justify-center bg-[#faf8f5]">
                          {isFootball ? (
                            <FootballIcon className="w-24 h-24 text-[#0d3a24]/20" />
                          ) : (
                            <CricketIcon className="w-24 h-24 text-[#c59b27]/20" />
                          )}
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(13,58,36,0.2) 40%, rgba(13,58,36,0.85) 75%, rgba(13,58,36,0.98) 100%)'
                        }}
                      />

                      {/* Base Price Badge */}
                      <div className="absolute top-4 left-4 backdrop-blur border border-[#e8e2d5] bg-white/95 rounded-2xl px-3.5 py-2 text-center z-10 shadow-sm">
                        <p className="text-[#6b7280] text-[9px] uppercase tracking-wider font-bold">Base Price</p>
                        <p className="font-black text-lg text-[#0d3a24] tabular-nums leading-none">{activePlayer.basePrice} pts</p>
                      </div>

                      {/* Player Info Footer */}
                      <div className="relative z-10 px-6 pb-6 pt-10 text-white">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {displaySkills(activePlayer.skills).map(s => (
                            <PositionPill key={s} skill={s} isFootball={isFootball} />
                          ))}
                          {activePlayer.gender && (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-white/20 backdrop-blur text-white border border-white/30">
                              {activePlayer.gender}
                            </span>
                          )}
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black uppercase leading-none tracking-tight truncate drop-shadow-md">
                          {activePlayer.name}
                        </h1>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT: Bid History */}
                <div className="lg:col-span-3 bg-white border border-[#e8e2d5] rounded-3xl overflow-hidden flex flex-col min-h-0 h-full shadow-sm">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e2d5] bg-[#faf8f5] shrink-0">
                    <p className="text-[#111827] text-xs font-bold uppercase tracking-wider">
                      {isFootball ? 'Match Bid Feed' : 'Live Bid Feed'}
                    </p>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#0d3a24] text-white">
                      {bidHistory.length}
                    </span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden divide-y divide-gray-100 p-2">
                    {bidHistory.length === 0 && (
                      <p className="text-[#9ca3af] text-xs text-center py-12">No bids registered yet</p>
                    )}
                    {bidHistory.map((b, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                          i === 0
                            ? 'bg-amber-50 border-l-4 border-[#c59b27] text-[#111827]'
                            : 'hover:bg-[#faf8f5] text-[#4b5563]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[#9ca3af] text-xs font-mono w-6 text-right shrink-0">#{bidHistory.length - i}</span>
                          <span className={`text-sm font-semibold truncate ${i === 0 ? 'text-[#111827] font-bold' : 'text-[#4b5563]'}`}>
                            {b.teamName}
                          </span>
                        </div>
                        <span className={`text-sm font-black tabular-nums shrink-0 ml-2 ${i === 0 ? 'text-[#c59b27]' : 'text-[#0d3a24]'}`}>
                          {b.amount} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* EMPTY / WAITING STATE */
              <div className="flex-1 bg-white border border-[#e8e2d5] rounded-3xl flex flex-col items-center justify-center p-8 lg:p-14 text-center min-h-[420px] shadow-sm relative overflow-hidden">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full border-2 border-[#0d3a24]/20 flex items-center justify-center bg-[#f4efe6] shadow-sm">
                    {isFootball ? (
                      <FootballIcon className="w-12 h-12 text-[#0d3a24]" />
                    ) : (
                      <CricketIcon className="w-12 h-12 text-[#c59b27]" />
                    )}
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f4efe6] border border-[#e8e2d5] text-[#0d3a24] text-xs font-bold uppercase tracking-widest mb-3">
                  <span>{sportLabel} Arena Standby</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#111827] mb-2">
                  Waiting for Next Player
                </h2>
                <p className="text-[#6b7280] text-sm max-w-md">
                  The auctioneer will bring the next {sportLabel.toLowerCase()} star to the live stage shortly.
                </p>
              </div>
            )}
          </>
        )}

        {/* Teams Tab */}
        {tab === 'teams' && (
          <div className="flex-1 overflow-y-auto pr-1">
            {teams.length === 0 ? (
              <div className="text-center py-20 text-[#9ca3af] text-sm bg-white border border-[#e8e2d5] rounded-3xl p-8">
                No {sportLabel.toLowerCase()} clubs registered yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
                {teams.map((team, idx) => (
                  <TeamCard key={team._id} team={team} idx={idx} isFootball={isFootball} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Mystery Reveal Modal */}
      {mysteryReveal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold font-serif text-[#111827] mb-1">Mystery Player Revealed!</h3>
            <p className="text-[#0d3a24] text-xs font-semibold mb-4">Acquired by {mysteryReveal.teamName}</p>
            <div className="relative w-36 h-36 rounded-full overflow-hidden mx-auto mb-4 border-4 border-[#ece4d0] shadow-md">
              <Image src={mysteryReveal.player.photo} alt={mysteryReveal.player.name} fill unoptimized className="object-cover" />
            </div>
            <h4 className="text-lg font-bold text-[#111827]">{mysteryReveal.player.name}</h4>
            <p className="text-[#6b7280] text-xs mt-1 mb-6">{mysteryReveal.player.skills?.join(', ')}</p>
            <button
              onClick={() => setMysteryReveal(null)}
              className="w-full bg-[#0d3a24] hover:bg-[#154d32] text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-md"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

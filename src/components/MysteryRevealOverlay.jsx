'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import SkillBadge from './SkillBadge';
import { displaySkills } from '@/lib/skills';

/**
 * Full-screen reveal animation shown to the winning captain after buying a mystery player.
 * Props:
 *   player  — full player object (with real name, photo, skills)
 *   onClose — called after animation completes or user dismisses
 */
export default function MysteryRevealOverlay({ player, onClose }) {
  const [phase, setPhase] = useState('flash'); // flash → reveal → done

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 600);
    const t2 = setTimeout(() => setPhase('done'), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const cfg = player?.mysteryConfig || {};
  const isStar = cfg.isStar;
  const isBust = cfg.isBust;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}>

      {/* Flash phase */}
      {phase === 'flash' && (
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-24 h-24 rounded-full bg-purple-500/30 border-2 border-purple-400 flex items-center justify-center">
            <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-purple-300 text-xl font-black uppercase tracking-widest">Revealing...</p>
        </div>
      )}

      {/* Reveal phase */}
      {(phase === 'reveal' || phase === 'done') && (
        <div className="flex flex-col items-center gap-6 px-6 max-w-sm w-full"
          style={{ animation: 'fadeInUp 0.5s ease forwards' }}>

          {/* Star / Bust badge */}
          {isStar && (
            <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 rounded-full px-4 py-1.5">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-yellow-400 text-sm font-black uppercase tracking-wider">Star Player!</span>
            </div>
          )}
          {isBust && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-full px-4 py-1.5">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span className="text-red-400 text-sm font-black uppercase tracking-wider">Bust Player</span>
            </div>
          )}

          {/* Photo */}
          <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-2 border-[#c9a227]/60 shadow-2xl shadow-[#c9a227]/20">
            {player.photo ? (
              <Image src={player.photo} alt={player.name} fill unoptimized className="object-cover" style={{ objectPosition: '50% 20%' }} />
            ) : (
              <div className="w-full h-full bg-[#0d1e3a] flex items-center justify-center">
                <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="text-center">
            <p className="text-[#c9a227]/60 text-xs uppercase tracking-widest mb-1">Mystery Revealed</p>
            <h2 className="text-3xl font-black text-white uppercase leading-tight">{player.name}</h2>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {displaySkills(player.skills || []).map(s => <SkillBadge key={s} skill={s} />)}
          </div>

          {/* Close */}
          {phase === 'done' && (
            <button onClick={onClose}
              className="mt-2 bg-[#c9a227] text-[#0a1628] font-black px-8 py-3 rounded-xl text-sm hover:bg-[#f0c040] transition-colors">
              Continue
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

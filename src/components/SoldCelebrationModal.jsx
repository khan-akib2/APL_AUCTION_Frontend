'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import SkillBadge from './SkillBadge';
import { displaySkills } from '@/lib/skills';

export default function SoldCelebrationModal({ soldData, onClose }) {
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    // Confetti celebration
    try {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 160,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#0d3a24', '#c59b27', '#ffffff', '#225c40', '#f59e0b'],
        });
      }).catch(() => {});
    } catch {
      // ignore
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  if (!soldData) return null;

  const player = soldData.player;
  const teamName = soldData.teamName || soldData.team?.name || 'Winning Team';
  const teamLogo = soldData.team?.logo;
  const amount = soldData.amount ?? player?.soldPrice ?? 0;
  const skills = displaySkills(player?.skills || []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-[#c59b27] overflow-hidden text-center animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative corner accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0d3a24] via-[#c59b27] to-[#0d3a24]" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-[#4b5563] flex items-center justify-center font-bold text-sm transition-colors"
          aria-label="Close"
        >
          ×
        </button>

        {/* Sold Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#0d3a24] text-[#c59b27] font-black text-xs sm:text-sm uppercase tracking-widest mb-4 shadow-sm">
          <span>🔨 SOLD!</span>
        </div>

        {/* Player Photo */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-3xl overflow-hidden border-4 border-[#c59b27] bg-[#faf8f5] shadow-lg mb-3">
          {player?.photo ? (
            <Image
              src={player.photo}
              alt={player.name || ''}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#f4efe6] text-3xl font-black text-[#0d3a24]">
              {player?.name?.[0] || '★'}
            </div>
          )}
        </div>

        {/* Player Info */}
        <h3 className="text-2xl sm:text-3xl font-black font-serif text-[#111827] truncate mb-1">
          {player?.name || 'Player'}
        </h3>
        <div className="flex justify-center gap-1.5 flex-wrap mb-4">
          {skills.slice(0, 2).map(s => (
            <SkillBadge key={s} skill={s} />
          ))}
        </div>

        {/* Winning Team Banner */}
        <div className="bg-gradient-to-b from-[#faf8f5] to-[#f4efe6] border border-[#e8e2d5] rounded-2xl p-4 shadow-inner mb-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] mb-2">
            Acquired By
          </p>
          <div className="flex items-center justify-center gap-3">
            {teamLogo ? (
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#e8e2d5] bg-white shrink-0 shadow-xs">
                <Image src={teamLogo} alt={teamName} fill unoptimized className="object-contain p-1" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl border border-[#e8e2d5] bg-[#0d3a24] text-[#c59b27] flex items-center justify-center font-black text-base shrink-0">
                {teamName[0] || 'T'}
              </div>
            )}
            <div className="text-left min-w-0">
              <p className="text-lg sm:text-xl font-black text-[#0d3a24] truncate leading-tight">
                {teamName}
              </p>
              <p className="text-xs font-black text-[#c59b27] tabular-nums">
                Final Bid: {amount} pts
              </p>
            </div>
          </div>
        </div>

        {/* Auto dismiss countdown pill */}
        <div className="flex items-center justify-between text-xs text-[#9ca3af]">
          <span>Auto-closing in {countdown}s</span>
          <button
            onClick={onClose}
            className="text-[#0d3a24] font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

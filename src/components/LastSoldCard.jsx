'use client';
import Image from 'next/image';
import SkillBadge from './SkillBadge';
import { displaySkills } from '@/lib/skills';

export default function LastSoldCard({ lastSold, className = '' }) {
  if (!lastSold || !lastSold.player) return null;

  const player = lastSold.player;
  const teamName = lastSold.teamName || lastSold.team?.name || 'Winning Team';
  const teamLogo = lastSold.team?.logo;
  const amount = lastSold.amount ?? player?.soldPrice ?? 0;
  const skills = displaySkills(player?.skills || []);

  return (
    <div
      className={`bg-white border-2 border-[#c59b27]/40 rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden transition-all hover:shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#e8e2d5]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-[#0d3a24]">
            Latest Auction Result
          </span>
        </div>
        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-[#c59b27] border border-amber-200 tabular-nums">
          Sold for {amount} pts
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Player Photo */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-[#e8e2d5] bg-[#faf8f5] shrink-0 shadow-xs">
          {player.photo ? (
            <Image
              src={player.photo}
              alt={player.name || ''}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-black text-xl text-[#0d3a24] bg-[#f4efe6]">
              {player.name?.[0] || '★'}
            </div>
          )}
        </div>

        {/* Player & Winning Team Details */}
        <div className="flex-1 min-w-0">
          <h4 className="text-base sm:text-lg font-black text-[#111827] truncate leading-tight">
            {player.name}
          </h4>
          <div className="flex gap-1 my-1">
            {skills.slice(0, 2).map(s => (
              <SkillBadge key={s} skill={s} />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-[#f4efe6]">
            {teamLogo ? (
              <div className="relative w-5 h-5 rounded-md overflow-hidden border border-[#e8e2d5] bg-white shrink-0">
                <Image src={teamLogo} alt={teamName} fill unoptimized className="object-contain" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-md bg-[#0d3a24] text-[#c59b27] text-[10px] font-black flex items-center justify-center shrink-0">
                {teamName[0] || 'T'}
              </div>
            )}
            <p className="text-xs text-[#4b5563] truncate">
              Sold to <strong className="text-[#0d3a24] font-bold">{teamName}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

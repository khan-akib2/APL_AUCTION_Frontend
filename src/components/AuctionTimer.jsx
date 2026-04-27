'use client';

// remaining: seconds left, paused: bool, size: 'sm' | 'md' | 'lg'
export default function AuctionTimer({ remaining, paused, size = 'md' }) {
  if (remaining === null || remaining === undefined) return null;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${mins}:${String(secs).padStart(2, '0')}`;

  const urgent = remaining <= 10 && !paused;
  const critical = remaining <= 5 && !paused;

  const sizes = {
    sm: { wrap: 'px-3 py-1.5 rounded-xl gap-1.5', time: 'text-lg', label: 'text-[9px]', dot: 'w-1.5 h-1.5' },
    md: { wrap: 'px-4 py-2 rounded-xl gap-2', time: 'text-2xl', label: 'text-[10px]', dot: 'w-2 h-2' },
    lg: { wrap: 'px-5 py-3 rounded-2xl gap-2', time: 'text-4xl', label: 'text-xs', dot: 'w-2 h-2' },
  };
  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.wrap} border font-mono transition-all duration-300 ${
      paused
        ? 'bg-white/5 border-white/15'
        : critical
          ? 'bg-red-500/15 border-red-500/50 animate-pulse'
          : urgent
            ? 'bg-orange-500/10 border-orange-400/40'
            : 'bg-[#c9a227]/8 border-[#c9a227]/25'
    }`}>
      {/* Status dot */}
      <span className={`${s.dot} rounded-full shrink-0 ${
        paused ? 'bg-white/30' : critical ? 'bg-red-400 animate-ping' : urgent ? 'bg-orange-400' : 'bg-[#c9a227]'
      }`} />
      <div>
        <p className={`${s.label} uppercase tracking-wider leading-none mb-0.5 ${
          paused ? 'text-white/30' : critical ? 'text-red-400' : urgent ? 'text-orange-400' : 'text-[#c9a227]/60'
        }`}>
          {paused ? 'Paused' : 'Time Left'}
        </p>
        <p className={`${s.time} font-black leading-none tabular-nums ${
          paused ? 'text-white/40' : critical ? 'text-red-400' : urgent ? 'text-orange-400' : 'text-[#c9a227]'
        }`}>
          {display}
        </p>
      </div>
    </div>
  );
}

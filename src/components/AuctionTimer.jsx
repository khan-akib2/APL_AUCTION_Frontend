'use client';

// Props:
// - remaining: number of seconds left (6, 5, 4, 3, 2, 1, 0)
// - paused: boolean
// - size: 'sm' | 'md' | 'lg' | 'banner'
// - className: string
export default function AuctionTimer({ remaining, paused = false, size = 'md', className = '' }) {
  if (remaining === null || remaining === undefined) return null;

  const isCritical = remaining <= 3 && remaining > 0 && !paused;
  const isUrgent = remaining <= 5 && !paused;
  const isLocked = remaining === 0;

  // Banner variant: Full-width alert bar
  if (size === 'banner') {
    if (isCritical) {
      return (
        <div
          className={`w-full px-4 py-2.5 rounded-2xl border flex items-center justify-between transition-all duration-300 shadow-lg animate-pulse bg-gradient-to-r from-red-600 to-amber-600 border-red-500 text-white ${className}`}
        >
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-white animate-ping shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-200 leading-none mb-0.5">
                FINAL CALL
              </p>
              <p className="text-xs font-bold leading-none">
                Bidding closes in {remaining}s
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 font-mono">
            <span className="text-3xl font-black tabular-nums leading-none animate-bounce drop-shadow">
              {remaining}
            </span>
            <span className="text-xs font-bold uppercase opacity-90">sec</span>
          </div>
        </div>
      );
    }
    return (
      <div
        className={`w-full px-4 py-2 rounded-2xl border flex items-center justify-between bg-[#0d3a24] text-white border-[#1b5235] shadow-sm ${className}`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
            Bidding Timer
          </span>
        </div>
        <div className="flex items-baseline gap-1 font-mono">
          <span className="text-lg font-black tabular-nums text-white">
            {remaining}
          </span>
          <span className="text-xs text-emerald-300">s</span>
        </div>
      </div>
    );
  }

  // Small compact pill
  if (size === 'sm') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono border text-xs font-bold transition-all duration-300 shadow-sm ${
          isLocked
            ? 'bg-stone-200 text-stone-600 border-stone-300'
            : isCritical
              ? 'bg-red-600 text-white border-red-700 animate-pulse ring-2 ring-red-400'
              : isUrgent
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-emerald-50 text-[#0d3a24] border-emerald-200'
        } ${className}`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            isLocked ? 'bg-stone-400' : isCritical ? 'bg-white animate-ping' : 'bg-emerald-500'
          }`}
        />
        <span className="text-[10px] uppercase font-bold tracking-wider">
          {isLocked ? 'Locked' : isCritical ? 'Closing' : 'Timer'}
        </span>
        <span className="tabular-nums font-black text-sm">
          {remaining}s
        </span>
      </div>
    );
  }

  // Large overlay badge (e.g. over player card photo)
  if (size === 'lg') {
    return (
      <div
        className={`backdrop-blur-md border rounded-2xl px-4 py-2 text-center shadow-lg transition-all duration-300 ${
          isLocked
            ? 'bg-black/60 border-white/20 text-white'
            : isCritical
              ? 'bg-red-600/95 border-red-300 text-white animate-pulse ring-4 ring-red-500/40 shadow-red-500/50'
              : 'bg-black/45 border-white/30 text-white'
        } ${className}`}
      >
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isLocked ? 'bg-stone-400' : isCritical ? 'bg-white animate-ping' : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <p className="text-[9px] uppercase tracking-widest font-bold opacity-90">
            {isLocked ? 'Bidding Locked' : isCritical ? 'Closing in' : 'Time Left'}
          </p>
        </div>
        <div className="flex items-baseline justify-center gap-1 font-mono">
          <span
            className={`font-black tabular-nums leading-none tracking-tight ${
              isCritical ? 'text-4xl text-white drop-shadow-md animate-bounce' : 'text-2xl text-white'
            }`}
          >
            {remaining}
          </span>
          <span className="text-xs font-bold opacity-80">s</span>
        </div>
      </div>
    );
  }

  // Default 'md'
  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl font-mono border transition-all duration-300 shadow-sm ${
        isLocked
          ? 'bg-stone-100 text-stone-500 border-stone-200'
          : isCritical
            ? 'bg-red-600 text-white border-red-700 animate-pulse shadow-md ring-2 ring-red-400/60'
            : isUrgent
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-white/95 border-[#e8e2d5] text-[#0d3a24]'
      } ${className}`}
    >
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${
          isLocked ? 'bg-stone-400' : isCritical ? 'bg-white animate-ping' : 'bg-emerald-500 animate-pulse'
        }`}
      />
      <div className="leading-tight">
        <p className="text-[9px] uppercase tracking-wider font-bold opacity-75">
          {isLocked ? 'Locked' : isCritical ? 'HURRY!' : 'TIME LEFT'}
        </p>
        <p className="text-lg font-black tabular-nums leading-none">
          {remaining}s
        </p>
      </div>
    </div>
  );
}

'use client';

// Prominent circular countdown overlay (3, 2, 1) matching the broadcast live style
export default function BigCountdownOverlay({ remaining, paused = false }) {
  if (remaining === null || remaining === undefined || remaining > 3 || remaining <= 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 backdrop-blur-[2px] transition-all duration-300 pointer-events-none select-none">
      <div className="relative flex items-center justify-center">
        {/* Outer ambient glow pulse */}
        {!paused && (
          <div className="w-52 h-52 sm:w-64 sm:h-64 rounded-full border-4 border-white/20 absolute animate-ping opacity-30" />
        )}

        {/* Outer glowing ring */}
        <div
          className={`w-48 h-48 sm:w-60 sm:h-60 rounded-full border-[5px] flex items-center justify-center backdrop-blur-sm ${
            paused
              ? 'border-amber-400 bg-black/40 shadow-[0_0_40px_rgba(251,191,36,0.7)]'
              : 'border-white/90 bg-black/25 shadow-[0_0_40px_rgba(255,255,255,0.75)]'
          }`}
        >
          {/* Inner concentric ring */}
          <div
            className={`w-40 h-40 sm:w-50 sm:h-50 rounded-full border-2 flex flex-col items-center justify-center ${
              paused ? 'border-amber-300/60' : 'border-white/40'
            }`}
          >
            {/* Giant countdown number 3, 2, 1 */}
            <span
              key={remaining}
              className="text-7xl sm:text-8xl md:text-9xl font-black text-white font-sans tabular-nums leading-none drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)] animate-in zoom-in-75 duration-200"
            >
              {remaining}
            </span>
            {paused && (
              <span className="text-xs sm:text-sm font-black tracking-widest uppercase text-amber-300 bg-black/70 px-3 py-0.5 rounded-full mt-2 border border-amber-400/50">
                PAUSED
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

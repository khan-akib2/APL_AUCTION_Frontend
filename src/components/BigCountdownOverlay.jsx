'use client';

// Prominent circular countdown overlay (3, 2, 1) matching the broadcast live style
export default function BigCountdownOverlay({ remaining }) {
  if (remaining === null || remaining === undefined || remaining > 3 || remaining <= 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 backdrop-blur-[2px] transition-all duration-300 pointer-events-none select-none">
      <div className="relative flex items-center justify-center">
        {/* Outer ambient glow pulse */}
        <div className="w-52 h-52 sm:w-64 sm:h-64 rounded-full border-4 border-white/20 absolute animate-ping opacity-30" />

        {/* Outer glowing ring */}
        <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-full border-[5px] border-white/90 shadow-[0_0_40px_rgba(255,255,255,0.75)] flex items-center justify-center bg-black/25 backdrop-blur-sm">
          {/* Inner concentric ring */}
          <div className="w-40 h-40 sm:w-50 sm:h-50 rounded-full border-2 border-white/40 flex flex-col items-center justify-center">
            {/* Giant countdown number 3, 2, 1 */}
            <span
              key={remaining}
              className="text-7xl sm:text-8xl md:text-9xl font-black text-white font-sans tabular-nums leading-none drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)] animate-in zoom-in-75 duration-200"
            >
              {remaining}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

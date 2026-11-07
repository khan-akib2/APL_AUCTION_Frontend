'use client';
import Image from 'next/image';

export default function MysteryPlayerCard({ player }) {
  const cfg = player?.mysteryConfig || {};

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-lg border border-[#e8e2d5] bg-white" style={{ minHeight: '420px', height: '55vh', maxHeight: '600px' }}>
      {/* Background */}
      {cfg.blurredPhoto ? (
        <Image src={cfg.blurredPhoto} alt="mystery" fill unoptimized
          className="absolute inset-0 object-cover scale-110 blur-2xl opacity-20 pointer-events-none" />
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-br from-[#f8f6f0] via-[#faf8f5] to-[#f4efe6]" />

      {/* Silhouette */}
      <div className="absolute inset-0 flex items-center justify-center">
        {cfg.blurredPhoto ? (
          <div className="relative w-48 h-48 opacity-40">
            <Image src={cfg.blurredPhoto} alt="mystery" fill unoptimized className="object-contain blur-md" />
          </div>
        ) : (
          <div className="opacity-20 text-[#0d3a24]">
            <svg className="w-28 h-28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>

      {/* Mystery badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#0d3a24] text-white px-3.5 py-1.5 rounded-full shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-[#c59b27] animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Mystery Player</span>
      </div>

      {/* Base price */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur border border-[#e8e2d5] rounded-2xl px-3.5 py-2 text-center shadow-sm">
        <p className="text-[#6b7280] text-[9px] uppercase tracking-wider font-semibold">Base</p>
        <p className="text-[#0d3a24] font-black text-lg tabular-nums leading-none">{player?.basePrice}</p>
      </div>

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-10"
        style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.85) 60%, transparent 100%)' }}>

        <p className="text-[#c59b27] text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Unknown Player</p>
        <h1 className="text-3xl sm:text-4xl font-black text-[#111827]/30 uppercase leading-none tracking-widest mb-1">
          ? ? ? ? ?
        </h1>
        <p className="text-[#6b7280] text-xs font-medium">Identity revealed to the winning team upon sale</p>
      </div>
    </div>
  );
}

'use client';
import Image from 'next/image';
import Spinner from './Spinner';

export default function MysteryPlayerCard({ player, revealTokens = null, onReveal, revealing = false, revealed = false }) {
  const cfg = player?.mysteryConfig || {};
  const isAudience = revealTokens === null;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ minHeight: '420px', height: '55vh', maxHeight: '600px' }}>
      {/* Background */}
      {cfg.blurredPhoto ? (
        <Image src={cfg.blurredPhoto} alt="mystery" fill unoptimized
          className="absolute inset-0 object-cover scale-110 blur-2xl opacity-30 pointer-events-none" />
      ) : null}

      <div className="absolute inset-0 bg-linear-to-br from-[#0a1628] via-[#0d1e3a] to-[#1a0a3a]" />
      <div className="absolute inset-0 opacity-20"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.4) 0%, transparent 70%)' }} />

      {/* Silhouette */}
      <div className="absolute inset-0 flex items-center justify-center">
        {cfg.blurredPhoto ? (
          <div className="relative w-48 h-48 opacity-40">
            <Image src={cfg.blurredPhoto} alt="mystery" fill unoptimized className="object-contain blur-md" />
          </div>
        ) : (
          <div className="opacity-25">
            <svg className="w-28 h-28 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>

      {/* Mystery badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-purple-600/80 backdrop-blur px-3 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span className="text-white text-[10px] font-bold uppercase tracking-wider">Mystery</span>
      </div>

      {/* Base price */}
      <div className="absolute top-4 left-4 bg-[#0a1628]/80 backdrop-blur border border-[#c9a227]/30 rounded-xl px-3 py-2 text-center">
        <p className="text-white/40 text-[9px] uppercase tracking-wider">Base</p>
        <p className="text-[#c9a227] font-black text-lg tabular-nums leading-none">{player?.basePrice}</p>
      </div>

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8"
        style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.98) 0%, rgba(10,22,40,0.7) 60%, transparent 100%)' }}>

        <p className="text-purple-400/70 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Unknown Player</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white/20 uppercase leading-none tracking-tight mb-3">
          ? ? ? ? ?
        </h1>

        {/* Role hint — only after captain uses reveal token */}
        {!isAudience && revealed && cfg.roleHint && (
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {cfg.roleHint}
            </span>
          </div>
        )}

        {/* Reveal button */}
        {!isAudience && !revealed && (
          <button
            onClick={onReveal}
            disabled={revealing || revealTokens <= 0}
            className="flex items-center gap-2 bg-purple-600/80 hover:bg-purple-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors border border-purple-500/40">
            {revealing ? <Spinner size="sm" /> : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
            {revealing ? 'Revealing...' : revealTokens > 0 ? `Reveal Player (${revealTokens} token${revealTokens !== 1 ? 's' : ''} left)` : 'No tokens left'}
          </button>
        )}

        {!isAudience && revealed && (
          <div className="flex items-center gap-1.5 text-green-400 text-xs font-semibold mt-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Role revealed
          </div>
        )}
      </div>
    </div>
  );
}

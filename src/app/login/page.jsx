'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import Image from 'next/image';
import Spinner from '@/components/Spinner';

export default function LoginPage() {
  const [roleTab, setRoleTab] = useState('admin'); // 'admin' | 'captain'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('apl_saved_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // ignore in incognito
    }
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password) {
      toast('Please enter both email and password', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Invalid email or password', 'error');
        return;
      }

      if (rememberMe) {
        try { localStorage.setItem('apl_saved_email', email.trim()); } catch {}
      } else {
        try { localStorage.removeItem('apl_saved_email'); } catch {}
      }

      login(data.token, data.user);
      toast(`Signed in successfully as ${data.user.name || data.user.role}`, 'success');
      router.push(data.user.role === 'admin' ? '/admin' : '/captain');
    } catch {
      toast('Network error. Unable to reach server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast('Please contact the APL administrator to reset or retrieve your credentials.', 'info');
  };

  return (
    <div className="min-h-screen w-full bg-[#f4efe6] flex flex-col md:flex-row relative overflow-hidden select-none">
      
      {/* LEFT SECTION: Full-height Dark Forest Green Panel with Angled Edge */}
      <div className="relative w-full md:w-[42%] lg:w-[40%] bg-[#0d3a24] text-white flex flex-col items-center justify-between p-8 sm:p-12 md:py-16 md:px-10 shrink-0 min-h-[380px] md:min-h-screen z-10 overflow-hidden shadow-2xl">
        
        {/* Angled / Slanted Right Border Divider on Desktop */}
        <div 
          className="absolute inset-y-0 right-0 w-24 bg-[#f4efe6] hidden md:block pointer-events-none"
          style={{
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 75% 0)',
          }}
        />

        {/* Soft decorative background glow */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

        {/* Top: APL Season 8 Official Logo */}
        <div className="relative z-10 flex flex-col items-center text-center mt-2 md:mt-4">
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 drop-shadow-2xl">
            <Image
              src="/APL.png"
              alt="APL Season 8"
              fill
              priority
              sizes="(max-width: 768px) 144px, 160px"
              className="object-contain"
            />
          </div>
        </div>

        {/* Center: Welcome Heading & Subtitle */}
        <div className="relative z-10 text-center my-6 md:my-auto max-w-sm">
          <span className="text-[#ded8cb] text-xs sm:text-sm font-medium tracking-widest uppercase block mb-1.5">
            Welcome to
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-white tracking-tight leading-tight">
            APL Auction
          </h1>
          <div className="text-[#d8b04a] text-xl sm:text-2xl font-serif font-bold tracking-wide mt-1">
            Season 8
          </div>
          <p className="text-[#c5d5cb]/85 text-xs sm:text-sm leading-relaxed max-w-[260px] mx-auto mt-4 font-light">
            Sign in to manage or participate in the auction.
          </p>
        </div>

        {/* Bottom Left: Batsman Silhouette with Motion Lines */}
        <div className="relative w-full z-10 flex items-end justify-start pointer-events-none mt-auto">
          <svg
            className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 text-white/15 drop-shadow-md"
            viewBox="0 0 120 120"
            fill="currentColor"
          >
            {/* Batsman Head & Helmet */}
            <circle cx="48" cy="28" r="9" />
            <path d="M42 27 L56 25 L58 31 L44 33 Z" />
            {/* Body / Torso in batting stance */}
            <path d="M44 38 L57 41 L66 56 L61 58 L55 47 L48 60 L54 84 L48 86 L41 64 L36 82 L30 81 L36 54 L42 40 Z" />
            {/* Cricket Bat */}
            <path d="M66 56 L86 76 L81 80 L61 58 Z" />
            <path d="M86 76 L94 84 L91 87 L81 80 Z" />
            {/* Curved Motion Line */}
            <path d="M20 95 Q50 110 98 100" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 4" fill="none" opacity="0.35" />
          </svg>
        </div>
      </div>

      {/* RIGHT SECTION: Full-height Warm Cream Area with Floating White Card */}
      <div className="flex-1 bg-[#f4efe6] flex items-center justify-center p-6 sm:p-10 lg:p-16 relative min-h-screen">
        
        {/* Background ambient accents */}
        <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-[#ebe3d3] blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-[#e8ded0] blur-3xl pointer-events-none" />

        {/* Floating White Card */}
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl shadow-stone-900/10 border border-[#e8e2d5] relative z-10">
          
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              Sign In
            </h2>
            <p className="text-xs sm:text-sm text-[#6b7280] mt-1">
              Access your APL account
            </p>
          </div>

          {/* Segmented Role Tabs: Admin / Captain */}
          <div className="bg-[#f3f4f6] p-1 rounded-xl flex items-center gap-1 mb-6 border border-gray-200/80">
            <button
              type="button"
              onClick={() => setRoleTab('admin')}
              className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all text-center ${
                roleTab === 'admin'
                  ? 'bg-[#0d3a24] text-white shadow-sm'
                  : 'text-[#4b5563] hover:text-[#111827]'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setRoleTab('captain')}
              className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all text-center ${
                roleTab === 'captain'
                  ? 'bg-[#0d3a24] text-white shadow-sm'
                  : 'text-[#4b5563] hover:text-[#111827]'
              }`}
            >
              Captain
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[#4b5563] mb-1.5">
                Email
              </label>
              <div className="flex items-center bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3.5 py-2.5 focus-within:border-[#0d3a24] focus-within:ring-1 focus-within:ring-[#0d3a24] transition-colors">
                <svg className="w-4 h-4 text-[#9ca3af] shrink-0 mr-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <rect x="2.5" y="4.5" width="15" height="11" rx="2" strokeWidth="1.5" />
                  <path d="M3.5 6L10 11L16.5 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={roleTab === 'admin' ? 'admin@apl.com' : 'captain@apl.com'}
                  className="w-full bg-transparent border-none text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none"
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-[#4b5563] mb-1.5">
                Password
              </label>
              <div className="flex items-center bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3.5 py-2.5 focus-within:border-[#0d3a24] focus-within:ring-1 focus-within:ring-[#0d3a24] transition-colors">
                <svg className="w-4 h-4 text-[#9ca3af] shrink-0 mr-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <rect x="3.5" y="8.5" width="13" height="8.5" rx="2" strokeWidth="1.5" />
                  <path d="M6.5 8.5V5.5C6.5 3.567 8.067 2 10 2C11.933 2 13.5 3.567 13.5 5.5V8.5" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="10" cy="12.75" r="1.25" fill="currentColor" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-transparent border-none text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none"
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#9ca3af] hover:text-[#4b5563] p-1 transition-colors shrink-0"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path d="M3 3L17 17M8.5 8.5A3 3 0 0012.7 12.7M10 5C5 5 2 10 2 10C2.8 11.4 4.5 13.3 6.9 14.3M14.2 13.3C16.3 12.1 18 10 18 10C18 10 15 5 10 5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path d="M10 5C4.5 5 1.5 10 1.5 10C1.5 10 4.5 15 10 15C15.5 15 18.5 10 18.5 10C18.5 10 15.5 5 10 5Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="10" cy="10" r="2.5" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#4b5563]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#0d3a24] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-medium text-[#b38531] hover:text-[#916922] hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0d3a24] hover:bg-[#145334] active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-md shadow-[#0d3a24]/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Spinner size="sm" /> : 'Sign In'}
            </button>
          </form>

          {/* Bottom Live Links */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-[#6b7280]">
            <a
              href="/audience"
              className="text-[#b38531] hover:text-[#916922] font-medium transition-colors"
            >
              Watch Cricket Live →
            </a>
            <a
              href="/audience/football"
              className="text-[#0d3a24] hover:underline font-medium transition-colors"
            >
              Watch Football Live →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

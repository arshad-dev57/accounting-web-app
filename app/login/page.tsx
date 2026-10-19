'use client';

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn, CheckCircle2, Check, FileText, TrendingUp, Package } from 'lucide-react';

/* ---------------------------------------------------------------
   Animated art for the blue panel (rocket, coin, chart, invoice…)
   Pure CSS animation — koi extra library nahi chahiye.
---------------------------------------------------------------- */
const STARS = [
  { top: '6%', left: '8%', d: '0s' },
  { top: '12%', left: '46%', d: '0.8s' },
  { top: '20%', left: '70%', d: '1.6s' },
  { top: '28%', left: '90%', d: '0.4s' },
  { top: '74%', left: '6%', d: '1.2s' },
  { top: '84%', left: '30%', d: '2s' },
  { top: '90%', left: '62%', d: '0.6s' },
  { top: '66%', left: '94%', d: '1.4s' },
];

const BARS = [
  { h: 38, d: '0s' },
  { h: 55, d: '0.25s' },
  { h: 45, d: '0.5s' },
  { h: 72, d: '0.75s' },
  { h: 60, d: '1s' },
  { h: 92, d: '1.25s' },
];

const heroCss = `
@keyframes ah-fly {
  0%, 100% { transform: translate(0, 0) rotate(40deg); }
  50% { transform: translate(12px, -16px) rotate(40deg); }
}
@keyframes ah-flame {
  0%, 100% { transform: scaleY(1); opacity: 1; }
  50% { transform: scaleY(1.35); opacity: .85; }
}
@keyframes ah-trail { to { stroke-dashoffset: -28; } }
@keyframes ah-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
@keyframes ah-coin {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}
@keyframes ah-bar {
  0% { transform: scaleY(.35); }
  100% { transform: scaleY(1); }
}
@keyframes ah-twinkle {
  0%, 100% { opacity: .15; transform: scale(.7); }
  50% { opacity: .9; transform: scale(1.2); }
}
@keyframes ah-pop {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
@keyframes ah-draw {
  0% { stroke-dashoffset: 240; }
  60%, 100% { stroke-dashoffset: 0; }
}
@keyframes ah-spin {
  to { transform: rotate(360deg); }
}
.ah-rocket { animation: ah-fly 5s ease-in-out infinite; transform-origin: 50% 50%; }
.ah-flame { animation: ah-flame .35s ease-in-out infinite; transform-origin: 60px 113px; }
.ah-trail { animation: ah-trail 1.2s linear infinite; }
.ah-float-1 { animation: ah-float 6s ease-in-out infinite; }
.ah-float-2 { animation: ah-float 7s ease-in-out -2s infinite; }
.ah-float-3 { animation: ah-float 5s ease-in-out -1s infinite; }
.ah-coin { animation: ah-coin 3.2s linear infinite; }
.ah-bar { transform-origin: bottom; animation: ah-bar 1.6s ease-in-out infinite alternate; }
.ah-star { animation: ah-twinkle 3s ease-in-out infinite; }
.ah-pop { animation: ah-pop 2s ease-in-out infinite; }
.ah-draw { stroke-dasharray: 240; animation: ah-draw 4s ease-in-out infinite; }
.ah-spin { animation: ah-spin 14s linear infinite; transform-origin: 50% 50%; }
@media (prefers-reduced-motion: reduce) {
  .ah-rocket, .ah-flame, .ah-trail, .ah-float-1, .ah-float-2, .ah-float-3,
  .ah-coin, .ah-bar, .ah-star, .ah-pop, .ah-draw, .ah-spin { animation: none !important; }
}
`;

const glass = 'bg-white/10 backdrop-blur-sm border border-white/25 shadow-lg shadow-blue-950/20';

function HeroArt() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <style>{heroCss}</style>

      {/* Soft glows + rings (depth, khali jagah bharne ke liye) */}
      <div className="absolute -right-24 top-[34%] h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="absolute -left-28 bottom-[8%] h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="absolute -left-32 top-[30%] h-96 w-96 rounded-full border border-white/10" />
      <div className="absolute -left-52 top-[22%] h-[34rem] w-[34rem] rounded-full border border-white/[0.06]" />

      {/* Big watermarks — text ke peeche */}
      <span className="absolute left-[38%] top-[14%] select-none text-[18rem] font-black leading-none text-white/[0.06]">
        $
      </span>
      <span className="absolute -left-4 -bottom-8 select-none text-[13rem] font-black leading-none text-white/[0.06]">
        %
      </span>

      {/* Faint bar chart — text ke peeche */}
      <div className={`absolute left-[24%] top-[52%] hidden w-72 rounded-2xl p-5 opacity-[0.22] xl:block ${glass}`}>
        <div className="flex h-28 items-end gap-2">
          {BARS.map((b, i) => (
            <div
              key={i}
              className="ah-bar flex-1 rounded-t-md bg-white"
              style={{ height: `${b.h}%`, animationDelay: b.d }}
            />
          ))}
        </div>
      </div>

      {/* Stars */}
      {STARS.map((s, i) => (
        <span
          key={i}
          className="ah-star absolute h-1.5 w-1.5 rounded-full bg-white"
          style={{ top: s.top, left: s.left, animationDelay: s.d }}
        />
      ))}

      {/* Top: donut chart */}
      <div className={`ah-float-3 absolute right-[34%] top-[3%] hidden rounded-2xl p-3 xl:block ${glass}`}>
        <div className="relative h-24 w-24">
          <svg viewBox="0 0 100 100" className="ah-spin h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="12" />
            <circle cx="50" cy="50" r="36" fill="none" stroke="#ffffff" strokeWidth="12"
              strokeDasharray="102 226" strokeLinecap="butt" />
            <circle cx="50" cy="50" r="36" fill="none" stroke="#93c5fd" strokeWidth="12"
              strokeDasharray="68 226" strokeDashoffset="-102" />
            <circle cx="50" cy="50" r="36" fill="none" stroke="#fbbf24" strokeWidth="12"
              strokeDasharray="56 226" strokeDashoffset="-170" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-white">
            Q3
          </span>
        </div>
      </div>

      {/* Top: profit & loss report */}
      <div className={`ah-float-1 absolute right-[3%] top-[12%] hidden w-52 rounded-2xl p-4 xl:block ${glass}`}>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-white/90">Profit &amp; Loss</span>
          <span className="text-[11px] font-bold text-emerald-300">+18%</span>
        </div>
        <svg viewBox="0 0 150 56" className="h-20 w-full" fill="none">
          <defs>
            <linearGradient id="ah-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 46 L25 38 L50 42 L75 26 L100 30 L125 12 L150 6 L150 56 L0 56 Z" fill="url(#ah-area)" />
          <path className="ah-draw" d="M0 46 L25 38 L50 42 L75 26 L100 30 L125 12 L150 6"
            stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="mt-1 flex justify-between text-[10px] text-white/60">
          <span>Jul</span><span>Aug</span><span>Sep</span>
        </div>
      </div>

      {/* Calculator (tilted) */}
      <div className="absolute left-[6%] top-[5%] hidden -rotate-6 xl:block">
        <div className={`ah-float-3 w-28 rounded-2xl p-3 ${glass}`}>
          <div className="mb-2 rounded-md bg-white/20 px-2 py-1 text-right text-xs font-bold text-white">
            2,450.00
          </div>
          <div className="grid grid-cols-4 gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={`h-4 rounded ${i % 4 === 3 ? 'bg-amber-300/80' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Warehouse stock chip */}
      <div
        className={`ah-float-1 absolute bottom-[16%] left-[3%] hidden items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold text-white xl:flex ${glass}`}
      >
        <Package className="h-4 w-4 text-amber-300" />
        1,284 units in stock
      </div>

      {/* Ledger chip */}
      <div className={`ah-float-2 absolute bottom-[31%] right-[3%] hidden rounded-xl px-3 py-2 text-[11px] font-bold text-white xl:block ${glass}`}>
        <div className="flex justify-between gap-5">
          <span className="text-white/60">Debit</span>
          <span>12,500</span>
        </div>
        <div className="flex justify-between gap-5">
          <span className="text-white/60">Credit</span>
          <span>12,500</span>
        </div>
      </div>

      {/* Spinning coin */}
      <div className="ah-float-2 absolute right-[7%] top-[3%]">
        <div
          className="ah-coin flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-200 bg-gradient-to-br from-amber-300 to-amber-500 text-lg font-extrabold text-amber-800 shadow-lg"
          style={{ transformStyle: 'preserve-3d' }}
        >
          $
        </div>
      </div>

      {/* Revenue chart card */}
      <div className={`ah-float-1 absolute bottom-[6%] right-[4%] hidden w-60 rounded-2xl p-5 xl:block ${glass}`}>
        {/* Growth pill — chart ke corner par laga hua */}
        <div className="ah-pop absolute -left-8 -top-3 flex items-center gap-1.5 rounded-full border border-white/30 bg-blue-700/80 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
          +24.5%
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white/70">Revenue</span>
          <span className="text-xs font-bold text-emerald-300">+12.5%</span>
        </div>
        <p className="mb-3 text-2xl font-extrabold text-white">$128,450</p>
        <div className="flex h-24 items-end gap-1.5">
          {BARS.map((b, i) => (
            <div
              key={i}
              className="ah-bar flex-1 rounded-t-md bg-gradient-to-t from-white/50 to-white"
              style={{ height: `${b.h}%`, animationDelay: b.d }}
            />
          ))}
        </div>
      </div>

      {/* Invoice card */}
      <div className={`ah-float-2 absolute bottom-[2%] right-[calc(4%+16rem)] hidden w-44 rounded-2xl p-4 xl:block ${glass}`}>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20">
            <FileText className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="text-[11px] font-semibold text-white/90">Invoice #1024</span>
        </div>
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded bg-white/30" />
          <div className="h-1.5 w-4/5 rounded bg-white/30" />
          <div className="h-1.5 w-3/5 rounded bg-white/30" />
        </div>
        <div className="ah-pop mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-400 px-2.5 py-1 text-[10px] font-extrabold text-emerald-950">
          <Check className="h-3 w-3" />
          PAID
        </div>
      </div>
    </div>
  );
}

/* Rocket jo headline ke bilkul barabar (text ke saath) baithta hai */
function RocketBeside() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-full top-1/2 -ml-16 hidden h-[240px] w-[240px] -translate-y-[45%] min-[1400px]:block"
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 240 240" fill="none">
        <path
          className="ah-trail"
          d="M6 236 C 50 210, 100 170, 140 128"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="6 8"
        />
      </svg>

      <div className="ah-rocket absolute right-0 top-0 w-[130px]">
        <svg viewBox="0 0 120 170" className="h-auto w-full drop-shadow-xl">
          {/* flame */}
          <g className="ah-flame">
            <path d="M47 113 Q60 168 73 113 Z" fill="#fbbf24" />
            <path d="M53 113 Q60 143 67 113 Z" fill="#f97316" />
          </g>
          {/* fins */}
          <path d="M38 85 L16 120 L40 108 Z" fill="#f97316" />
          <path d="M82 85 L104 120 L80 108 Z" fill="#f97316" />
          {/* body */}
          <path d="M60 8 C 86 34 92 76 83 107 L37 107 C 28 76 34 34 60 8 Z" fill="#ffffff" />
          <path d="M60 8 C 71 19 75 28 77 38 L43 38 C 45 28 49 19 60 8 Z" fill="#ef4444" />
          {/* window */}
          <circle cx="60" cy="64" r="12" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="4" />
          <circle cx="56" cy="60" r="3" fill="#ffffff" opacity=".8" />
          {/* nozzle */}
          <rect x="44" y="105" width="32" height="9" rx="3" fill="#cbd5e1" />
        </svg>
      </div>
    </div>
  );
}

function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl flex items-center justify-center p-2 shadow-lg ${className}`}>
      <img src="/bisontechs.png" alt="Bisonstechs" width={150} height={50} className="object-contain" />
    </div>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get('reset') === 'success';
  const accessMessage = searchParams.get('msg');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const isValidEmail = (val: string) =>
    /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(val);

  const validateForm = () => {
    let valid = true;
    if (!email.trim()) {
      setEmailError('Please enter email');
      valid = false;
    } else if (!isValidEmail(email.trim())) {
      setEmailError('Please enter a valid email');
      valid = false;
    } else {
      setEmailError('');
    }
    if (!password) {
      setPasswordError('Please enter password');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else {
      setPasswordError('');
    }
    return valid;
  };

  const handleLogin = async (email: string, password: string) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Invalid email or password');
    }

    // Legacy fallback — should not happen for web direct login
    if (data.requiresOtp && !data.token) {
      window.location.replace(`/login-otp?email=${encodeURIComponent(email)}`);
      return;
    }

    if (!data.token || !data.user) {
      throw new Error(data.message || 'Login failed');
    }

    const { apiClient } = await import('../lib/api-client');
    apiClient.setTokens(data.token, data.refreshToken);

    const { setMarketingLoggedInFlag } = await import('../../lib/marketing-session');
    setMarketingLoggedInFlag();

    const { saveUserToLocal } = await import('../../lib/permission-service');
    saveUserToLocal(data.user);

    const { persistPdfReportSettingsFromLogin } = await import('../../lib/pdf-report-settings');
    persistPdfReportSettingsFromLogin(
      data.pdfReportSettings || data.user?.pdfReportSettings
    );

    try {
      const { hydrateCompanyPrefsFromApi } = await import('../../lib/company-prefs');
      await hydrateCompanyPrefsFromApi();
    } catch {
      /* dropdowns will fetch once if cache is empty */
    }

    const { resolvePostAuthDestination } = await import('../../lib/subscription-service');
    const destination = await resolvePostAuthDestination(data.token);
    window.location.replace(destination);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setPasswordError('');

    try {
      await handleLogin(email.trim(), password);
    } catch (error: any) {
      setPasswordError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filled = email.trim().length > 0 && password.length > 0;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* ───────── LEFT PANEL (grid + headline + animated art) ───────── */}
      <div
        className="relative hidden lg:flex lg:w-1/2 flex-col justify-center overflow-hidden px-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(to bottom right, #2563eb, #1e40af)',
          backgroundSize: '64px 64px, 64px 64px, 100% 100%',
        }}
      >
        <HeroArt />

        <div className="relative z-10">
          <p className="text-2xl font-semibold text-white mb-14">Welcome to Bisonstechs</p>

          <div className="relative mb-6 max-w-md">
            <h1 className="text-6xl font-bold text-white leading-[1.1]">
              Complete warehouse &amp; accounting management
            </h1>
            <RocketBeside />
          </div>

          <p className="text-base text-blue-100 max-w-md mb-12">
            Track inventory, manage ledgers, and generate financial reports — all in one platform.
          </p>

          <div>
            {/* Marketing site ka link — zaroorat ho to href change kar lo */}
            <Link
              href="/"
              className="inline-block px-5 py-3 rounded-lg border border-white/40 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Learn more about us
            </Link>
          </div>
        </div>
      </div>

      {/* ───────── RIGHT PANEL (form) ───────── */}
      <div className="flex-1 lg:w-1/2 flex flex-col items-center px-6 py-10 bg-gray-50">
        <div className="flex flex-col items-center">
          <BrandLogo className="w-40 h-20" />
          <p className="mt-3 text-xl font-extrabold text-gray-800">Bisonstechs</p>
          <p className="text-xs text-gray-500">Business Suite</p>
        </div>

        <div className="flex-1 w-full flex items-center justify-center py-10">
          <div className="w-full max-w-[480px] rounded-3xl border border-gray-200 bg-white p-10 shadow-xl shadow-gray-200/60">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Sign into your account:</h2>
            <p className="text-gray-500 text-sm mb-8">Sign in to continue to Bisonstechs</p>

            {resetSuccess && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Password reset successfully. Please sign in with your new password.
              </div>
            )}

            {accessMessage && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm font-medium">
                {decodeURIComponent(accessMessage)}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  placeholder="Email address"
                  aria-label="Email address"
                  autoComplete="email"
                  className={`w-full h-12 px-4 rounded-xl border text-sm text-gray-800 placeholder-gray-400 transition-all outline-none
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${emailError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                />
                {emailError && <p className="mt-1.5 text-xs text-red-500">{emailError}</p>}
              </div>

              <div className="mb-3">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Password"
                    aria-label="Password"
                    autoComplete="current-password"
                    className={`w-full h-12 pl-4 pr-12 rounded-xl border text-sm text-gray-800 placeholder-gray-400 transition-all outline-none
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      ${passwordError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordError && <p className="mt-1.5 text-xs text-red-500">{passwordError}</p>}
              </div>

              <div className="text-right mb-6">
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-12 rounded-xl font-bold text-sm transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                  ${
                    filled
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gray-200 text-gray-400'
                  }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 pb-4">
          <p className="text-sm text-gray-500">Don&apos;t have an account with us yet?</p>
          <Link
            href="/register"
            className="px-6 py-3 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-gray-100 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
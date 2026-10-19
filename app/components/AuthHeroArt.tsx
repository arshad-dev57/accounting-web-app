import { Check, FileText, TrendingUp } from 'lucide-react';

/**
 * Animated accounting-themed art for the blue auth panel:
 * rocket + dashed flight trail, spinning coin, rising bar chart,
 * invoice with PAID badge, growth pill and twinkling stars.
 * Pure CSS animation — koi extra library nahi chahiye.
 * Parent par `relative overflow-hidden` hona chahiye.
 */

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

const css = `
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
@media (prefers-reduced-motion: reduce) {
  .ah-rocket, .ah-flame, .ah-trail, .ah-float-1, .ah-float-2, .ah-float-3,
  .ah-coin, .ah-bar, .ah-star, .ah-pop { animation: none !important; }
}
`;

const glass = 'bg-white/10 backdrop-blur-sm border border-white/25 shadow-lg shadow-blue-950/20';

export default function AuthHeroArt() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <style>{css}</style>

      {/* Stars */}
      {STARS.map((s, i) => (
        <span
          key={i}
          className="ah-star absolute h-1.5 w-1.5 rounded-full bg-white"
          style={{ top: s.top, left: s.left, animationDelay: s.d }}
        />
      ))}

      {/* Rocket + flight trail */}
      <div className="absolute right-[3%] top-[3%] h-[220px] w-[260px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 260 220" fill="none">
          <path
            className="ah-trail"
            d="M8 212 C 50 190, 110 170, 172 108"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6 8"
          />
        </svg>

        <div className="ah-rocket absolute right-0 top-0 w-[90px]">
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

      {/* Spinning coin */}
      <div className="ah-float-2 absolute right-[38%] top-[9%]">
        <div
          className="ah-coin flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-200 bg-gradient-to-br from-amber-300 to-amber-500 text-lg font-extrabold text-amber-800 shadow-lg"
          style={{ transformStyle: 'preserve-3d' }}
        >
          $
        </div>
      </div>

      {/* Growth pill */}
      <div
        className={`ah-float-3 absolute bottom-[23%] right-[5%] hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white xl:flex ${glass}`}
      >
        <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
        +24.5%
      </div>

      {/* Revenue chart card */}
      <div className={`ah-float-1 absolute bottom-[5%] right-[5%] hidden w-52 rounded-2xl p-4 xl:block ${glass}`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-white/70">Revenue</span>
          <span className="text-[11px] font-bold text-emerald-300">+12.5%</span>
        </div>
        <p className="mb-3 text-xl font-extrabold text-white">$128,450</p>
        <div className="flex h-16 items-end gap-1.5">
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
      <div className={`ah-float-2 absolute bottom-[6%] right-[40%] hidden w-40 rounded-2xl p-3.5 xl:block ${glass}`}>
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
'use client';

type IconProps = { className?: string };

/** Odoo-style multi-color module icons — always animating. */

export function SalesAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect className="sales-bar sales-b1" x="10" y="34" width="10" height="20" rx="2.5" fill="#714B67" />
      <rect className="sales-bar sales-b2" x="27" y="22" width="10" height="32" rx="2.5" fill="#00A09D" />
      <rect className="sales-bar sales-b3" x="44" y="12" width="10" height="42" rx="2.5" fill="#F06050" />
      <circle className="sales-dot" cx="49" cy="8" r="3.5" fill="#F7CD1F" />
      <style>{`
        .sales-bar { transform-origin: bottom; transform-box: fill-box; }
        .sales-b1 { animation: salesBar 0.7s ease-in-out infinite alternate; }
        .sales-b2 { animation: salesBar 0.7s ease-in-out 0.1s infinite alternate; }
        .sales-b3 { animation: salesBar 0.7s ease-in-out 0.2s infinite alternate; }
        .sales-dot { animation: salesPulse 0.9s ease-in-out infinite; }
        @keyframes salesBar { from { transform: scaleY(0.85); } to { transform: scaleY(1.08); } }
        @keyframes salesPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.25); } }
      `}</style>
    </svg>
  );
}

export function PurchasesAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect className="purch-s1" x="8" y="14" width="48" height="10" rx="5" fill="#00A09D" />
      <rect className="purch-s2" x="8" y="28" width="48" height="10" rx="5" fill="#F06050" />
      <rect className="purch-s3" x="8" y="42" width="48" height="10" rx="5" fill="#714B67" />
      <circle className="purch-k" cx="46" cy="19" r="3.2" fill="#F7CD1F" />
      <circle className="purch-k" cx="18" cy="33" r="3.2" fill="#FFFFFF" />
      <circle className="purch-k" cx="38" cy="47" r="3.2" fill="#00A09D" />
      <style>{`
        .purch-s1 { animation: purchSlide 1s ease-in-out infinite alternate; }
        .purch-s2 { animation: purchSlide 1s ease-in-out 0.15s infinite alternate-reverse; }
        .purch-s3 { animation: purchSlide 1s ease-in-out 0.3s infinite alternate; }
        .purch-k { animation: purchPulse 1.1s ease-in-out infinite; }
        @keyframes purchSlide { from { transform: translateX(-2px); } to { transform: translateX(2px); } }
        @keyframes purchPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
      `}</style>
    </svg>
  );
}

export function InventoryAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g className="inv-box">
        <path d="M32 28 L52 38 L32 48 L12 38 Z" fill="#F06050" />
        <path d="M12 38 L32 48 L32 58 L12 48 Z" fill="#714B67" />
        <path d="M32 48 L52 38 L52 48 L32 58 Z" fill="#F7CD1F" />
        <path d="M32 20 L48 28 L32 36 L16 28 Z" fill="#00A09D" opacity="0.95" />
      </g>
      <path
        className="inv-drop"
        d="M32 6 C32 6 24 16 24 20 C24 24.4 27.6 28 32 28 C36.4 28 40 24.4 40 20 C40 16 32 6 32 6 Z"
        fill="#875A7B"
      />
      <style>{`
        .inv-drop, .inv-box { transform-box: fill-box; transform-origin: center; }
        .inv-drop { animation: invDrop 1.2s ease-in-out infinite; }
        .inv-box { animation: invFloat 1.4s ease-in-out infinite; }
        @keyframes invDrop {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(3px); }
        }
        @keyframes invFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `}</style>
    </svg>
  );
}

export function AccountingAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g className="acc-pct">
        <circle cx="22" cy="20" r="9" fill="#875A7B" />
        <circle cx="22" cy="20" r="4.5" fill="#1f2937" />
        <circle cx="42" cy="44" r="9" fill="#F7CD1F" />
        <circle cx="42" cy="44" r="4.5" fill="#1f2937" />
        <rect
          x="18"
          y="30"
          width="28"
          height="7"
          rx="3.5"
          fill="#F06050"
          transform="rotate(-48 32 33.5)"
        />
      </g>
      <style>{`
        .acc-pct { transform-box: fill-box; transform-origin: center; animation: accSpin 3.2s linear infinite; }
        @keyframes accSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </svg>
  );
}

export function PosAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="10" y="12" width="44" height="32" rx="6" fill="#714B67" />
      <rect className="pos-screen" x="16" y="18" width="32" height="16" rx="3" fill="#00A09D" />
      <rect x="22" y="44" width="20" height="6" rx="2" fill="#F7CD1F" />
      <rect x="18" y="50" width="28" height="5" rx="2.5" fill="#F06050" />
      <circle className="pos-blink" cx="48" cy="16" r="2.5" fill="#F7CD1F" />
      <style>{`
        .pos-screen { animation: posGlow 1s ease-in-out infinite alternate; }
        .pos-blink { animation: posPulse 0.8s ease-in-out infinite; }
        @keyframes posGlow { from { opacity: 0.75; } to { opacity: 1; } }
        @keyframes posPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
      `}</style>
    </svg>
  );
}

export function HrAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle className="hr-p1" cx="22" cy="20" r="9" fill="#00A09D" />
      <path className="hr-p1" d="M8 48 C8 38 14 34 22 34 C30 34 36 38 36 48 Z" fill="#714B67" />
      <circle className="hr-p2" cx="44" cy="22" r="8" fill="#F06050" />
      <path className="hr-p2" d="M32 50 C32 41 37 37 44 37 C51 37 56 41 56 50 Z" fill="#F7CD1F" />
      <style>{`
        .hr-p1, .hr-p2 { transform-box: fill-box; transform-origin: center; }
        .hr-p1 { animation: hrBob 1s ease-in-out infinite; }
        .hr-p2 { animation: hrBob 1s ease-in-out 0.2s infinite reverse; }
        @keyframes hrBob {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `}</style>
    </svg>
  );
}

export function TaxAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g className="tax-scale">
        <rect x="30" y="10" width="4" height="40" rx="2" fill="#875A7B" />
        <rect x="22" y="48" width="20" height="5" rx="2.5" fill="#714B67" />
        <rect x="12" y="18" width="40" height="4" rx="2" fill="#00A09D" />
        <path d="M14 22 L8 38 L26 38 Z" fill="#F7CD1F" />
        <path d="M50 22 L56 38 L38 38 Z" fill="#F06050" />
      </g>
      <style>{`
        .tax-scale { transform-box: fill-box; transform-origin: 32px 20px; animation: taxTilt 1.4s ease-in-out infinite alternate; }
        @keyframes taxTilt { from { transform: rotate(-6deg); } to { transform: rotate(6deg); } }
      `}</style>
    </svg>
  );
}

export function SearchAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle className="sch-ring" cx="28" cy="28" r="16" fill="none" stroke="#00A09D" strokeWidth="6" />
      <circle cx="28" cy="28" r="8" fill="#714B67" />
      <rect
        className="sch-handle"
        x="40"
        y="38"
        width="18"
        height="7"
        rx="3.5"
        fill="#F06050"
        transform="rotate(45 49 41.5)"
      />
      <circle className="sch-spark" cx="48" cy="14" r="3" fill="#F7CD1F" />
      <style>{`
        .sch-ring { transform-box: fill-box; transform-origin: center; animation: schPulse 1.4s ease-in-out infinite; }
        .sch-handle { transform-box: fill-box; transform-origin: left center; animation: schWiggle 1.2s ease-in-out infinite alternate; }
        .sch-spark { animation: schBlink 0.9s ease-in-out infinite; }
        @keyframes schPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.65; } }
        @keyframes schWiggle { from { transform: rotate(42deg); } to { transform: rotate(48deg); } }
        @keyframes schBlink { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.2); } }
      `}</style>
    </svg>
  );
}

export function SupportAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path
        className="sup-head"
        d="M18 30 C18 18 24 12 32 12 C40 12 46 18 46 30"
        fill="none"
        stroke="#714B67"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <rect className="sup-ear" x="10" y="26" width="10" height="16" rx="5" fill="#00A09D" />
      <rect className="sup-ear" x="44" y="26" width="10" height="16" rx="5" fill="#F06050" />
      <rect x="24" y="40" width="16" height="10" rx="4" fill="#F7CD1F" />
      <circle className="sup-dot" cx="32" cy="34" r="3" fill="#875A7B" />
      <style>{`
        .sup-ear { animation: supBob 1s ease-in-out infinite alternate; }
        .sup-head { animation: supGlow 1.5s ease-in-out infinite alternate; }
        .sup-dot { animation: supBlink 1.1s ease-in-out infinite; }
        @keyframes supBob { from { transform: translateY(0); } to { transform: translateY(2px); } }
        @keyframes supGlow { from { opacity: 0.75; } to { opacity: 1; } }
        @keyframes supBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </svg>
  );
}

export function ProfileAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle className="prf-head" cx="32" cy="22" r="12" fill="#00A09D" />
      <path
        className="prf-body"
        d="M12 54 C12 40 20 34 32 34 C44 34 52 40 52 54 Z"
        fill="#714B67"
      />
      <circle className="prf-badge" cx="46" cy="18" r="6" fill="#F06050" />
      <path d="M46 15 v6 M43 18 h6" stroke="#F7CD1F" strokeWidth="2" strokeLinecap="round" />
      <style>{`
        .prf-head, .prf-body { transform-box: fill-box; transform-origin: center; }
        .prf-head { animation: prfBob 1.2s ease-in-out infinite; }
        .prf-body { animation: prfBob 1.2s ease-in-out 0.15s infinite reverse; }
        .prf-badge { animation: prfPulse 1s ease-in-out infinite; }
        @keyframes prfBob {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes prfPulse {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
      `}</style>
    </svg>
  );
}

export function CompanyAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g className="co-bldg">
        <rect x="14" y="18" width="36" height="38" rx="3" fill="#714B67" />
        <rect x="22" y="8" width="20" height="12" rx="2" fill="#875A7B" />
        <rect className="co-win" x="20" y="24" width="8" height="8" rx="1.5" fill="#F7CD1F" />
        <rect className="co-win" x="36" y="24" width="8" height="8" rx="1.5" fill="#00A09D" />
        <rect className="co-win" x="20" y="38" width="8" height="8" rx="1.5" fill="#00A09D" />
        <rect className="co-win" x="36" y="38" width="8" height="8" rx="1.5" fill="#F06050" />
        <rect x="28" y="46" width="8" height="10" rx="1.5" fill="#F06050" />
      </g>
      <style>{`
        .co-bldg { transform-box: fill-box; transform-origin: center bottom; animation: coFloat 1.6s ease-in-out infinite; }
        .co-win { animation: coBlink 1.3s ease-in-out infinite alternate; }
        @keyframes coFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes coBlink { from { opacity: 0.7; } to { opacity: 1; } }
      `}</style>
    </svg>
  );
}

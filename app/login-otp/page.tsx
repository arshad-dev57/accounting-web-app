'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, RotateCcw } from 'lucide-react';
import { apiClient } from '../lib/api-client'; // ✅ Import apiClient

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function OtpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') handleVerify();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const newOtp = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length < OTP_LENGTH) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // ✅ Store tokens in apiClient (and localStorage)
        if (data.token) {
          apiClient.setTokens(data.token, data.refreshToken);
        }

        setSuccess('Verified! Redirecting...');
        setTimeout(() => {
          window.location.replace('/dashboard');
        }, 500);
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
        setOtp(Array(OTP_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resend: true }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTimer(RESEND_SECONDS);
        setOtp(Array(OTP_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
        setSuccess('OTP resent successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const pills = ['End-to-End Encrypted', 'Expires in 10 min', 'Bank-grade Security', 'Zero Data Sharing'];
  const otpFilled = otp.join('').length === OTP_LENGTH;

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=900&q=80&fit=crop"
            alt="Security"
            fill
            sizes="50vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-blue-600/20" />
        </div>

        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-widest">LedgerPro</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-3">
            Your Security<br />Comes First
          </h1>
          <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-sm">
            We verify every login with a one-time code to keep your financial data protected.
          </p>
          <div className="flex flex-wrap gap-2">
            {pills.map((p) => (
              <span key={p} className="px-4 py-2 bg-white/10 border border-white/25 rounded-full text-xs font-semibold backdrop-blur-sm">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-sm">

          {/* Back */}
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 font-medium mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>

          {/* Shield icon */}
          <div className="flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl border border-blue-100 mb-5 mx-auto">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Verify Your Identity</h2>
          <p className="text-gray-500 text-sm text-center mb-1">A 6-digit security code was sent to</p>
          <p className="text-blue-600 font-semibold text-sm text-center mb-7 break-all">{email}</p>

          {/* Success message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium text-center">
              {success}
            </div>
          )}

          {/* OTP inputs */}
          <div className="flex justify-center gap-3 mb-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200
                  ${digit ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-800'}
                  ${error ? '!border-red-400 !bg-red-50' : ''}
                  focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white`}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 text-center mb-4 flex items-center justify-center gap-1">
              <span>⚠️</span> {error}
            </p>
          )}

          <div className="h-4" />

          {/* VERIFY BUTTON */}
          <button
            onClick={handleVerify}
            disabled={isLoading || !otpFilled}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 mb-4"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Verify & Sign In
              </>
            )}
          </button>

          {/* Security note */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 mb-5">
            <p className="text-xs text-gray-400 leading-relaxed text-center">
              🔒 LedgerPro will never ask for your OTP via phone or chat. If you didn&apos;t attempt to login, please secure your account immediately.
            </p>
          </div>

          {/* Resend */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Didn&apos;t receive the code?</p>
            {timer > 0 ? (
              <p className="text-sm text-gray-400">
                Resend in <span className="font-semibold text-blue-600">{timer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="flex items-center gap-1.5 mx-auto text-sm text-blue-600 font-semibold hover:text-blue-700 disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {isResending ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Can&apos;t find the email? Check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OtpContent />
    </Suspense>
  );
}
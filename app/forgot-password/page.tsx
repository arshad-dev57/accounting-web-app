'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, RotateCcw, KeyRound } from 'lucide-react';
import AuthSplitLayout from '../../components/AuthSplitLayout';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isValidEmail = (val: string) =>
    /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(val);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (step === 'otp') {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Please enter email address');
      return;
    }
    if (!isValidEmail(trimmed)) {
      setEmailError('Please enter a valid email');
      return;
    }

    setEmailError('');
    setIsLoading(true);
    setSuccess('');

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setEmail(trimmed);
        setStep('otp');
        setTimer(RESEND_SECONDS);
        setSuccess(data.message || 'OTP sent to your email');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setEmailError(data.message || 'Failed to send OTP');
      }
    } catch {
      setEmailError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setOtpError('');
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') handleVerifyOtp();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((char, i) => {
      next[i] = char;
    });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length < OTP_LENGTH) {
      setOtpError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setOtpError('');

    try {
      const response = await fetch('/api/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue }),
      });
      const data = await response.json();

      if (response.ok && data.success && data.resetToken) {
        sessionStorage.setItem('reset_token', data.resetToken);
        sessionStorage.setItem('reset_email', email);
        router.push('/reset-password');
        return;
      }

      setOtpError(data.message || 'Invalid OTP');
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      setOtpError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setIsResending(true);
    setOtpError('');
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTimer(RESEND_SECONDS);
        setOtp(Array(OTP_LENGTH).fill(''));
        setSuccess('OTP resent successfully!');
        setTimeout(() => setSuccess(''), 3000);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } else {
        setOtpError(data.message || 'Failed to resend OTP');
      }
    } catch {
      setOtpError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const otpFilled = otp.join('').length === OTP_LENGTH;
  const emailFilled = email.trim().length > 0;

  const btnBase =
    'w-full h-12 rounded-xl font-bold text-sm transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2';
  const btnActive = 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30';
  const btnMuted = 'bg-gray-200 text-gray-400';

  return (
    <AuthSplitLayout
      title="Account recovery made simple"
      subtitle="Enter your email, verify the 6-digit code, and set a new password to get back into your account."
    >
      <div className="w-full max-w-[480px] rounded-3xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/60 sm:p-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <div className="flex items-center justify-center w-14 h-14 bg-blue-50 rounded-2xl border border-blue-100 mb-5">
          {step === 'email' ? (
            <KeyRound className="w-7 h-7 text-blue-600" />
          ) : (
            <ShieldCheck className="w-7 h-7 text-blue-600" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          {step === 'email' ? 'Forgot Password?' : 'Verify OTP'}
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          {step === 'email'
            ? 'Enter your registered email and we will send you a reset code.'
            : `Enter the 6-digit code sent to ${email}`}
        </p>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
            {success}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} noValidate>
            <div className="mb-6">
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

            <button
              type="submit"
              disabled={isLoading}
              className={`${btnBase} ${emailFilled ? btnActive : btnMuted} disabled:opacity-50`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Send Reset Code'
              )}
            </button>
          </form>
        ) : (
          <>
            <div className="flex justify-center gap-2 sm:gap-3 mb-2" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  aria-label={`OTP digit ${index + 1}`}
                  className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-bold rounded-xl border-2 transition-all
                    ${digit ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-800'}
                    ${otpError ? '!border-red-400 !bg-red-50' : ''}
                    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
                />
              ))}
            </div>

            {otpError && <p className="text-xs text-red-500 text-center mb-4">{otpError}</p>}

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isLoading || !otpFilled}
              className={`${btnBase} mt-4 ${otpFilled ? btnActive : btnMuted} ${isLoading ? 'disabled:opacity-50' : ''}`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Verify OTP
                </>
              )}
            </button>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-500 mb-1">Didn&apos;t receive the code?</p>
              {timer > 0 ? (
                <p className="text-sm text-gray-400">
                  Resend in <span className="font-semibold text-blue-600">{timer}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:text-blue-700 disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {isResending ? 'Sending...' : 'Resend OTP'}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setStep('email');
                setOtp(Array(OTP_LENGTH).fill(''));
                setOtpError('');
              }}
              className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Use a different email
            </button>
          </>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Can&apos;t find the email? Check your spam folder.
        </p>
      </div>
    </AuthSplitLayout>
  );
}
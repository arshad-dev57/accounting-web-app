'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, RotateCcw } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { saveUserToLocal } from '../../lib/permission-service'; 

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
    console.log('🔄 [OTP Page] Starting OTP verification');
    console.log('📧 [OTP Page] Email:', email);
    console.log('🔢 [OTP Page] OTP value:', otpValue);
    console.log('🔢 [OTP Page] OTP length:', otpValue.length);

    if (otpValue.length < OTP_LENGTH) {
      console.log('❌ [OTP Page] OTP incomplete');
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('📤 [OTP Page] Sending to API: /api/verify-otp');
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue }),
      });

      console.log('📥 [OTP Page] Response status:', response.status);
      const data = await response.json();
      console.log('📥 [OTP Page] Response data:', data);
      console.log('✅ [OTP Page] Verification success:', data.success);

      if (response.ok && data.success) {
        console.log('🔑 [OTP Page] Token received:', data.token ? 'Yes' : 'No');
        console.log('🔄 [OTP Page] Refresh token received:', data.refreshToken ? 'Yes' : 'No');
        console.log('👤 [OTP Page] User data:', data.user);

        // ✅ Store tokens in apiClient (and localStorage)
        if (data.token) {
          console.log('💾 [OTP Page] Storing tokens in apiClient');
          apiClient.setTokens(data.token, data.refreshToken);
        }

        // Marketing site (bisonstechs.com) session bridge
        const { setMarketingLoggedInFlag } = await import('../../lib/marketing-session');
        setMarketingLoggedInFlag();

        // ✅ Save complete user data with permissions to localStorage (Flutter PermissionService parity)
        if (data.user) {
          const saved = saveUserToLocal(data.user);
          console.log('✅ [OTP Page] User data saved:', {
            id: saved?.id,
            email: saved?.email,
            role: saved?.role,
            permissions: saved?.permissions?.length || 0,
          });
        }

        // ✅ Cache PDF report branding (same as Flutter persistFromLogin)
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

        setSuccess('Verified! Checking subscription...');
        const { resolvePostAuthDestination } = await import('../../lib/subscription-service');
        const destination = await resolvePostAuthDestination(data.token);
        console.log('✅ [OTP Page] Redirecting to', destination);
        setTimeout(() => {
          window.location.replace(destination);
        }, 400);
      } else {
        console.log('❌ [OTP Page] Verification failed:', data.message);
        setError(data.message || 'Invalid OTP. Please try again.');
        setOtp(Array(OTP_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch (error) {
      console.error('❌ [OTP Page] Network error:', error);
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

  const otpFilled = otp.join('').length === OTP_LENGTH;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-32 h-16 bg-white rounded-xl flex items-center justify-center p-2 border border-gray-200">
            <Image
              src="/bisontechs.png"
              alt="Bisonstechs"
              width={120}
              height={40}
              className="object-contain"
            />
          </div>
          <p className="mt-2 text-lg font-extrabold text-gray-800">Bisonstechs</p>
        </div>

        {/* Back */}
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 font-medium mb-6 transition-colors"
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
            🔒 BisonTechs will never ask for your OTP via phone or chat. If you didn&apos;t attempt to login, please secure your account immediately.
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
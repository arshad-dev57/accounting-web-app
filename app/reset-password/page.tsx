'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newError, setNewError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('reset_token');
    if (!token) {
      router.replace('/forgot-password');
      return;
    }
    setResetToken(token);
  }, [router]);

  const validate = () => {
    let valid = true;
    if (!newPassword) {
      setNewError('Please enter new password');
      valid = false;
    } else if (newPassword.length < 6) {
      setNewError('Password must be at least 6 characters');
      valid = false;
    } else {
      setNewError('');
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm new password');
      valid = false;
    } else if (confirmPassword !== newPassword) {
      setConfirmError('Passwords do not match');
      valid = false;
    } else {
      setConfirmError('');
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validate() || !resetToken) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resetToken}`,
        },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        sessionStorage.removeItem('reset_token');
        sessionStorage.removeItem('reset_email');
        router.replace('/login?reset=success');
        return;
      }

      setFormError(data.message || 'Failed to reset password');
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=900&q=80&fit=crop"
            alt="Warehouse"
            fill
            sizes="50vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-blue-600/20" />
        </div>
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <h1 className="text-4xl font-bold leading-tight mb-3">Create New Password</h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-sm">
            Choose a strong password you haven&apos;t used before on this account.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="flex items-center justify-center w-14 h-14 bg-blue-50 rounded-2xl border border-blue-100 mb-5">
            <Lock className="w-7 h-7 text-blue-600" />
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-1">Reset Password</h2>
          <p className="text-gray-500 text-sm mb-8">Enter and confirm your new password.</p>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setNewError('');
                  }}
                  placeholder="At least 6 characters"
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500
                    ${newError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {newError && <p className="mt-1.5 text-xs text-red-500">{newError}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmError('');
                  }}
                  placeholder="Re-enter new password"
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500
                    ${confirmError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmError && (
                <p className="mt-1.5 text-xs text-red-500">{confirmError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm
                disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Reset Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

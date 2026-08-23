'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, LogIn, CheckCircle2 } from 'lucide-react';
import AuthSplitLayout from '../../components/AuthSplitLayout';

function LoginForm() {
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get('reset') === 'success';
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

    if (response.ok && data.success) {
      window.location.replace(`/login-otp?email=${encodeURIComponent(email)}`);
      return;
    }

    throw new Error(data.message || 'Invalid email or password');
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

  return (
    <AuthSplitLayout
      title="Complete warehouse & accounting management"
      subtitle="Track inventory, manage ledgers, and generate financial reports — all in one platform."
    >
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-40 h-20 bg-white rounded-xl flex items-center justify-center mb-3 p-2 shadow-lg">
              <img src="/bisontechs.png" alt="Bisonstechs" width={150} height={50} className="object-contain" />
            </div>
            <p className="text-xl font-extrabold text-gray-800">Bisonstechs</p>
            <p className="text-xs text-gray-500">Business Suite</p>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-1">Welcome Back!</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to continue to Bisonstechs</p>

          {resetSuccess && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Password reset successfully. Please sign in with your new password.
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all outline-none
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${emailError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                />
              </div>
              {emailError && <p className="mt-1.5 text-xs text-red-500">{emailError}</p>}
            </div>

            {/* Password Field */}
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm transition-all outline-none
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${passwordError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordError && <p className="mt-1.5 text-xs text-red-500">{passwordError}</p>}
            </div>

            {/* Forgot Password */}
            <div className="text-right mb-6">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
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

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700">
              Sign Up
            </Link>
          </p>
        </div>
    </AuthSplitLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthSplitLayout
          title="Complete warehouse & accounting management"
          subtitle="Track inventory, manage ledgers, and generate financial reports — all in one platform."
        >
          <div className="w-full max-w-md flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </AuthSplitLayout>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
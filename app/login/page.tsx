'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
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
    try {
      console.log('� [Login Page] Starting login process');
      console.log('📧 [Login Page] Email:', email);
      console.log('🔑 [Login Page] Password length:', password.length);
      
      // ✅ Backend route k
      // e mutabiq sahi URL
      console.log('📤 [Login Page] Sending request to backend: http://localhost:5000/api/users/login');
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('📥 [Login Page] Response status:', response.status);
      const data = await response.json();
      console.log('� [Login Page] Response data:', data);
      console.log('✅ [Login Page] Login success:', data.success);
      console.log('🔐 [Login Page] Requires OTP:', data.requiresOtp);

      if (data.success === true) {
        console.log('✅ [Login Page] Redirecting to OTP page');
        // OTP page par redirect
        window.location.replace(`/login-otp?email=${encodeURIComponent(email)}`);
        return;
      }

      console.log('❌ [Login Page] Login failed:', data.message);
      throw new Error(data.message || 'Invalid email or password');
      
    } catch (error: any) {
      console.error('❌ [Login Page] Login Error:', error);
      console.error('❌ [Login Page] Error message:', error.message);
      throw new Error(error.message || 'Login failed. Please try again.');
    }
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

  const pills = ['Inventory Tracking', 'Invoicing', 'Financial Reports', 'Warehouse Ops'];

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image Section */}
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
            Complete Warehouse &<br />Accounting Management
          </h1>
          <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-sm">
            Track inventory, manage ledgers, and generate financial reports — all in one platform.
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

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <span className="text-lg font-extrabold text-blue-600 tracking-widest">LedgerPro</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-1">Welcome Back!</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to continue to your account</p>

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
              <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                Forgot Password?
              </button>
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
            <button className="text-blue-600 font-semibold hover:text-blue-700">Sign Up</button>
          </p>
        </div>
      </div>
    </div>
  );
}
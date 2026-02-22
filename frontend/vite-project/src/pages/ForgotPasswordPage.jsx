// src/pages/ForgotPasswordPage.jsx

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Mail, Lock, Eye, EyeOff, KeyRound, ShieldCheck, ArrowLeft, Loader2,
} from 'lucide-react';
import { forgotPassword, verifyOTP, resetPassword } from '../services/authApi';

const STEPS = {
  EMAIL: 'email',
  OTP: 'otp',
  RESET: 'reset',
};

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef([]);
  const navigate = useNavigate();

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // ── Step 1: Send OTP ──────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return toast.error('Please enter a valid email.');
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email);
      toast.success(res.message || 'OTP sent to your email.');
      setStep(STEPS.OTP);
      setResendTimer(60);
      // Focus first OTP input after step change
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Input Handlers ────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // only digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Backspace: clear current, move to previous
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;

    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);

    // Focus the next empty field or the last one
    const nextEmpty = newOtp.findIndex((v) => !v);
    otpRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  // ── Step 2: Verify OTP ────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      return toast.error('Please enter the complete 6-digit OTP.');
    }

    setLoading(true);
    try {
      const res = await verifyOTP(email, otpString);
      toast.success(res.message || 'OTP verified!');
      setResetToken(res.data.resetToken);
      setStep(STEPS.RESET);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      const res = await forgotPassword(email);
      toast.success(res.message || 'New OTP sent.');
      setOtp(['', '', '', '', '', '']);
      setResendTimer(60);
      otpRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset Password ────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (passwords.password.length < 8) {
      return toast.error('Password must be at least 8 characters.');
    }
    if (passwords.password !== passwords.confirmPassword) {
      return toast.error('Passwords do not match.');
    }

    setLoading(true);
    try {
      const res = await resetPassword(
        resetToken,
        passwords.password,
        passwords.confirmPassword
      );
      toast.success(res.message || 'Password reset successfully!');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

        {/* ── Step 1: Email ── */}
        {step === STEPS.EMAIL && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                <KeyRound className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
              <p className="text-gray-500 mt-1">
                Enter your email and we'll send you a verification code
              </p>
            </div>

            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
              <Link to="/login" className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </p>
          </>
        )}

        {/* ── Step 2: OTP Verification ── */}
        {step === STEPS.OTP && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Verify OTP</h1>
              <p className="text-gray-500 mt-1">
                Enter the 6-digit code sent to
              </p>
              <p className="text-blue-600 font-semibold text-sm mt-1">{email}</p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              {/* OTP Boxes */}
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            {/* Resend */}
            <div className="text-center mt-4">
              {resendTimer > 0 ? (
                <p className="text-gray-400 text-sm">
                  Resend OTP in <span className="font-semibold text-gray-600">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-blue-600 font-semibold text-sm hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <p className="text-center mt-4">
              <button
                onClick={() => { setStep(STEPS.EMAIL); setOtp(['', '', '', '', '', '']); }}
                className="text-gray-500 text-sm hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Change email
              </button>
            </p>
          </>
        )}

        {/* ── Step 3: Reset Password ── */}
        {step === STEPS.RESET && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Lock className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
              <p className="text-gray-500 mt-1">Enter your new password below</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.password}
                    onChange={(e) =>
                      setPasswords((prev) => ({ ...prev, password: e.target.value }))
                    }
                    required
                    placeholder="Min. 8 characters"
                    className="w-full pl-11 pr-11 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwords.confirmPassword}
                    onChange={(e) =>
                      setPasswords((prev) => ({ ...prev, confirmPassword: e.target.value }))
                    }
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
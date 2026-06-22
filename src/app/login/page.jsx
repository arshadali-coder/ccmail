"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

export default function LoginPage() {
  const router = useRouter();

  // Screen states: 'CHOOSE_ACCOUNT', 'ENTER_EMAIL', 'ENTER_PASSWORD', 'CREATE_ACCOUNT', 'FORGOT_PASSWORD'
  const [screen, setScreen] = useState('ENTER_EMAIL');
  const [accounts, setAccounts] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  
  // Form inputs
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Load saved logins from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ccmail_accounts_sessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      const accountsList = Object.values(parsed);
      setAccounts(accountsList);
      if (accountsList.length > 0) {
        setScreen('CHOOSE_ACCOUNT');
      }
    }
  }, []);

  // Helper to start the progressive linear loader
  const startLoading = () => {
    setIsLoading(true);
    setProgress(5);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + (90 - prev) * 0.15; // Slow down as it approaches 90%
      });
    }, 80);
    return interval;
  };

  const stopLoading = (interval) => {
    clearInterval(interval);
    setProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 300);
  };

  const handleNextEmail = async (e) => {
    e.preventDefault();
    let email = emailInput.trim();
    if (!email) {
      setErrorMsg("Enter an email address");
      return;
    }
    
    // Auto-append domain if missing '@'
    if (!email.includes('@')) {
      email = `${email}@codingcounciljmi.in`;
    }

    setErrorMsg("");
    const loader = startLoading();
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (error) {
        throw new Error("Could not connect to verify account. Please check database setup.");
      }

      if (!data) {
        setErrorMsg("Couldn't find your CCMail Account");
        stopLoading(loader);
        return;
      }

      stopLoading(loader);
      setSelectedEmail(email);
      setScreen('ENTER_PASSWORD');
    } catch (err) {
      stopLoading(loader);
      setErrorMsg(err.message || "An error occurred. Please try again.");
    }
  };

  const handleNextPassword = async (e) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMsg("Enter a password");
      return;
    }

    setErrorMsg("");
    const loader = startLoading();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: selectedEmail,
        password: passwordInput,
      });

      if (error) throw error;

      // Store session data in localStorage for multi-account support
      const savedStr = localStorage.getItem('ccmail_accounts_sessions') || '{}';
      const saved = JSON.parse(savedStr);

      const emailKey = selectedEmail.toLowerCase();
      saved[emailKey] = {
        name: data.user.user_metadata?.full_name || selectedEmail.split('@')[0],
        email: selectedEmail,
        session: data.session,
        avatarBg: getRandomBg(),
        status: "Active"
      };

      localStorage.setItem('ccmail_accounts_sessions', JSON.stringify(saved));
      localStorage.setItem('ccmail_active_session_email', selectedEmail);

      stopLoading(loader);
      router.push('/');
    } catch (err) {
      stopLoading(loader);
      setErrorMsg(err.message || "Wrong password. Try again or click 'Forgot password'");
    }
  };



  const handleSelectAccount = async (account) => {
    setSelectedEmail(account.email);
    const loader = startLoading();
    setErrorMsg("");

    try {
      // Restore this user's Supabase session client-side
      const { error } = await supabase.auth.setSession(account.session);
      if (error) {
        stopLoading(loader);
        setScreen('ENTER_PASSWORD');
      } else {
        localStorage.setItem('ccmail_active_session_email', account.email);
        stopLoading(loader);
        router.push('/');
      }
    } catch (err) {
      stopLoading(loader);
      setScreen('ENTER_PASSWORD');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedEmail) return;

    setErrorMsg("");
    const loader = startLoading();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(selectedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      stopLoading(loader);
      alert("Reset password email sent successfully!");
      setScreen('ENTER_PASSWORD');
    } catch (err) {
      stopLoading(loader);
      setErrorMsg(err.message || "Failed to send reset link.");
    }
  };

  const handleUseAnotherAccount = () => {
    setEmailInput('');
    setPasswordInput('');
    setErrorMsg('');
    setScreen('ENTER_EMAIL');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (screen === 'ENTER_EMAIL') {
      handleNextEmail(e);
    } else if (screen === 'ENTER_PASSWORD') {
      handleNextPassword(e);
    }
  };

  const getRandomBg = () => {
    const bgs = ['bg-[#C84B31]', 'bg-[#1D4ED8]', 'bg-[#047857]', 'bg-[#B45309]', 'bg-[#701A75]', 'bg-[#0369A1]'];
    return bgs[Math.floor(Math.random() * bgs.length)];
  };

  return (
    <div className="min-h-screen w-screen bg-[#0F0F0F] text-[#E3E3E3] font-sans flex flex-col justify-between p-6 select-none relative">
      
      {/* Toast popup */}
      {toastMessage && (
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-[#313033] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm z-50 animate-bounce duration-150">
          <Check size={18} className="text-green-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Centered card wrapper */}
      <div className="flex-1 flex items-center justify-center">
        
        {/* Google Premium Sign-in Card */}
        <div className={`w-full bg-[#1B1B1B] rounded-[28px] border border-neutral-800/60 p-10 flex flex-col md:flex-row gap-12 transition-all duration-300 relative overflow-hidden ${screen === 'CHOOSE_ACCOUNT' ? 'max-w-[640px]' : 'max-w-[1040px]'}`}>
          
          {/* Top Google-style Indeterminate/Progress line (goes from left to end smoothly while processing) */}
          {isLoading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-900 overflow-hidden z-50">
              <div 
                className="h-full bg-[#1A73E8] transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          {/* Left Panel: Branding / Title */}
          <div className="flex flex-col justify-between md:w-[45%]">
            <div>
              {/* Google SVG Logo */}
              <div className="mb-6">
                <svg className="w-10 h-10" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>

              {screen === 'CHOOSE_ACCOUNT' ? (
                <>
                  <h1 className="text-3xl font-normal text-white mb-3">Choose an account</h1>
                  <p className="text-sm text-neutral-400">to continue to Gmail</p>
                </>
              ) : screen === 'ENTER_EMAIL' ? (
                <>
                  <h1 className="text-4xl font-normal text-white mb-3">Sign in</h1>
                  <p className="text-sm text-neutral-400">to continue to Gmail</p>
                </>
              ) : screen === 'ENTER_PASSWORD' ? (
                <>
                  <h1 className="text-4xl font-normal text-white mb-3">Welcome</h1>
                  
                  {/* Dropdown email choice representation */}
                  <div 
                    className="inline-flex items-center gap-2 border border-neutral-700 bg-neutral-800/30 px-3 py-1 rounded-full text-sm text-neutral-300 mt-3 hover:bg-neutral-800 transition cursor-pointer" 
                    onClick={() => setScreen('CHOOSE_ACCOUNT')}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span>{selectedEmail}</span>
                    <ChevronDown size={14} className="text-neutral-500" />
                  </div>
                </>
              ) : screen === 'CREATE_ACCOUNT' ? (
                <>
                  <h1 className="text-4xl font-normal text-white mb-3">Create account</h1>
                  <p className="text-sm text-neutral-400">to continue to Gmail</p>
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-normal text-white mb-3">Reset password</h1>
                  <p className="text-sm text-neutral-400">Recover your account credentials</p>
                </>
              )}
            </div>
          </div>

          {/* Right Panel: Active Screen Contents */}
          <div className="flex-1 flex flex-col justify-center">

            {/* SCREEN: CHOOSE ACCOUNT */}
            {screen === 'CHOOSE_ACCOUNT' && (
              <div className="space-y-4">
                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin border-b border-neutral-800 pb-4">
                  {accounts.map((acc, i) => (
                    <div 
                      key={i}
                      onClick={() => handleSelectAccount(acc)}
                      className="flex items-center justify-between p-3.5 hover:bg-neutral-850 rounded-xl transition cursor-pointer border border-transparent hover:border-neutral-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${acc.avatarBg} text-white flex items-center justify-center font-bold text-sm uppercase`}>
                          {acc.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{acc.name}</p>
                          <p className="text-xs text-neutral-400">{acc.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-neutral-500 font-medium">
                        {acc.status}
                      </span>
                    </div>
                  ))}
                </div>

                <button 
                  type="button"
                  onClick={handleUseAnotherAccount}
                  className="w-full flex items-center gap-3.5 p-3.5 hover:bg-neutral-850 rounded-xl transition text-sm text-blue-400 hover:text-blue-300 font-medium cursor-pointer text-left animate-in fade-in"
                >
                  <div className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center">
                    <Plus size={16} />
                  </div>
                  <span>Use another account</span>
                </button>
              </div>
            )}

            {/* SCREEN: ENTER EMAIL OR ENTER PASSWORD (Unified Form) */}
            {(screen === 'ENTER_EMAIL' || screen === 'ENTER_PASSWORD') && (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                
                {/* EMAIL SCREEN */}
                <div style={{ display: screen === 'ENTER_EMAIL' ? 'block' : 'none' }} className="space-y-6 animate-in fade-in">
                  <div className="relative group">
                    <input 
                      type="text"
                      name="username"
                      autoComplete="username"
                      placeholder="Email address"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className={`w-full bg-transparent border ${errorMsg && screen === 'ENTER_EMAIL' ? 'border-red-500 focus:border-red-500' : 'border-neutral-700 group-hover:border-neutral-600 focus:border-blue-500'} rounded-lg px-4 py-4 text-white outline-none transition text-base`}
                    />
                    {errorMsg && screen === 'ENTER_EMAIL' && (
                      <div className="flex items-center gap-1.5 text-red-500 text-xs mt-2.5">
                        <AlertCircle size={14} />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-end pt-6">
                      <button 
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-neutral-900 font-semibold px-6 py-2.5 rounded-full text-sm shadow-md transition cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>

                {/* PASSWORD SCREEN */}
                <div style={{ display: screen === 'ENTER_PASSWORD' ? 'block' : 'none' }} className="space-y-6 animate-in fade-in">
                  <div className="relative group">
                    <input 
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className={`w-full bg-transparent border ${errorMsg && screen === 'ENTER_PASSWORD' ? 'border-red-500 focus:border-red-500' : 'border-neutral-700 group-hover:border-neutral-600 focus:border-blue-500'} rounded-lg px-4 py-4 text-white outline-none transition text-base`}
                    />
                    
                    <div className="flex items-center justify-between mt-3 px-1">
                      <label className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-300 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={showPassword}
                          onChange={() => setShowPassword(!showPassword)}
                          className="rounded border-neutral-700 bg-neutral-800 text-blue-500 cursor-pointer"
                        />
                        <span>Show password</span>
                      </label>
                    </div>

                    {errorMsg && screen === 'ENTER_PASSWORD' && (
                      <div className="flex items-center gap-1.5 text-red-500 text-xs mt-2.5">
                        <AlertCircle size={14} />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-6">
                    <button 
                      type="button" 
                      onClick={() => setScreen('FORGOT_PASSWORD')}
                      className="text-sm text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                    <button 
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-neutral-900 font-semibold px-6 py-2.5 rounded-full text-sm shadow-md transition cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>

              </form>
            )}

            {/* SCREEN: FORGOT PASSWORD */}
            {screen === 'FORGOT_PASSWORD' && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Enter your email address and we will dispatch a password recovery link to your inbox.
                </p>

                <div className="flex items-center justify-end gap-3 pt-6">
                  <button 
                    type="button"
                    onClick={() => setScreen('ENTER_PASSWORD')}
                    className="text-sm text-neutral-400 hover:text-neutral-200 font-semibold px-4 py-2 rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-neutral-900 font-semibold px-6 py-2.5 rounded-full text-sm transition cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

      </div>

      {/* Footer Branding Links */}
      <footer className="w-full max-w-[1040px] mx-auto flex flex-col sm:flex-row justify-between items-center text-xs text-neutral-500 border-t border-neutral-900/60 pt-4 mt-6 gap-3">
        <div className="flex items-center gap-2">
          <span>English (United Kingdom)</span>
          <ChevronDown size={12} className="text-neutral-600" />
        </div>
        <div className="flex items-center gap-6">
          <span className="hover:text-neutral-400 cursor-pointer">Help</span>
          <span className="hover:text-neutral-400 cursor-pointer">Privacy</span>
          <span className="hover:text-neutral-400 cursor-pointer">Terms</span>
        </div>
      </footer>

    </div>
  );
}

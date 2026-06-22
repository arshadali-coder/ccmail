import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

export default function ProfileMenu({ 
  isProfileOpen, 
  setIsProfileOpen, 
  showToast,
  userProfile,
  setUserProfile
}) {
  const [activeEmail, setActiveEmail] = useState('dev@codingcounciljmi.in');
  const [userId, setUserId] = useState('');
  
  // Recovery states
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile Edit states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editSignature, setEditSignature] = useState('');

  // Load session & active user
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ccmail_active_session_email');
      if (saved) {
        setActiveEmail(saved);
      }
    }

    async function getActiveUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchRecoveryStatus(user.id);
      }
    }

    if (isProfileOpen) {
      getActiveUser();
      setIsEditMode(false); // Reset edit mode on open
    }
  }, [isProfileOpen]);

  const fetchRecoveryStatus = async (uid) => {
    try {
      const res = await fetch(`/api/recovery?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setRecoveryEmail(data.recovery_email);
          setIsVerified(data.is_verified);
        } else {
          setRecoveryEmail('');
          setIsVerified(false);
        }
      }
    } catch (err) {
      console.error("Error fetching recovery email status:", err);
    }
  };

  const handleSendOtp = async () => {
    if (!emailInput.trim()) {
      showToast("Please enter a valid email address.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/recovery/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim(), userId })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("OTP sent to your recovery email.");
        setIsVerificationPending(true);
      } else {
        showToast(data.error || "Failed to send code.");
      }
    } catch (err) {
      showToast("Failed to connect to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput.trim()) {
      showToast("Please enter the 6-digit code.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/recovery/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim(), otp: otpInput.trim(), userId })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Recovery email verified successfully!");
        setRecoveryEmail(emailInput.trim());
        setIsVerified(true);
        setIsVerificationPending(false);
        setEmailInput('');
        setOtpInput('');
      } else {
        showToast(data.error || "Incorrect OTP. Try again.");
      }
    } catch (err) {
      showToast("Failed to verify code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = () => {
    setEditName(userProfile?.full_name || '');
    setEditPosition(userProfile?.position || '');
    setEditDob(userProfile?.dob || '');
    setEditSignature(userProfile?.signature || '');
    setIsEditMode(true);
  };

  const saveProfile = async () => {
    if (!editName.trim()) {
      showToast("Full Name is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fullName: editName.trim(),
          position: editPosition,
          dob: editDob || null,
          signature: editSignature.trim(),
          recoveryEmail: recoveryEmail
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Profile updated successfully!");
        setUserProfile({
          ...userProfile,
          full_name: editName.trim(),
          position: editPosition,
          dob: editDob || null,
          signature: editSignature.trim()
        });
        setIsEditMode(false);
      } else {
        showToast(data.error || "Failed to update profile.");
      }
    } catch (err) {
      showToast("Network error saving profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isProfileOpen) return null;

  const displayName = userProfile?.full_name || activeEmail.split('@')[0];
  const avatarChar = displayName.charAt(0).toUpperCase();

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
      <div className="absolute right-0 mt-2.5 w-76 bg-white rounded-2xl shadow-xl border border-gray-200/80 p-4 z-50 text-sm animate-in fade-in slide-in-from-top-2 duration-150 text-neutral-800">
        
        {/* VIEW MODE */}
        {!isEditMode ? (
          <>
            {/* Profile Card Header */}
            <div className="flex flex-col items-center border-b border-gray-100 pb-3 mb-3">
              <div className="w-16 h-16 rounded-full bg-orange-700 text-white flex items-center justify-center text-3xl font-medium mb-2 shadow-inner uppercase select-none">
                {avatarChar}
              </div>
              <h4 className="font-semibold text-gray-800 text-base">{displayName}</h4>
              <p className="text-xs text-gray-500">{activeEmail}</p>
              
              {userProfile?.position && (
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1.5 inline-block uppercase select-none">
                  {userProfile.position}
                </span>
              )}
            </div>

            {/* Profile Settings Options */}
            <div className="space-y-3 pb-3 border-b border-gray-100">
              <div className="flex flex-col gap-1 text-xs text-gray-600 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/60 select-none">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-400">Position:</span>
                  <span className="font-semibold text-gray-700">{userProfile?.position || "Not configured"}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-medium text-gray-400">Birth Date:</span>
                  <span className="font-semibold text-gray-700">
                    {userProfile?.dob ? new Date(userProfile.dob).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : "Not configured"}
                  </span>
                </div>
                {userProfile?.signature && (
                  <div className="mt-1 border-t border-gray-150/45 pt-1.5">
                    <span className="font-medium text-gray-400 block mb-0.5">Signature:</span>
                    <p className="font-mono text-[9px] text-gray-500 whitespace-pre truncate max-w-full">
                      {userProfile.signature}
                    </p>
                  </div>
                )}
              </div>

              <button 
                type="button"
                onClick={startEdit}
                className="w-full text-center py-1.5 border border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 text-blue-600 rounded-lg text-xs font-semibold transition cursor-pointer select-none"
              >
                Edit Profile
              </button>
            </div>
          </>
        ) : (
          /* EDIT MODE FORM */
          <div className="border-b border-gray-100 pb-3 mb-3 animate-in fade-in duration-150">
            <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 select-none">Edit Profile</h5>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-0.5 select-none">Full Name</label>
                <input 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 text-gray-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-0.5 select-none">Position</label>
                <select
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 text-gray-850 cursor-pointer"
                >
                  <option value="">Select Position...</option>
                  <option value="President">President</option>
                  <option value="Vice President">Vice President</option>
                  <option value="General Secretary">General Secretary</option>
                  <option value="Joint Secretary">Joint Secretary</option>
                  <option value="Treasurer">Treasurer</option>
                  <option value="Executive Member">Executive Member</option>
                  <option value="Developer">Developer</option>
                  <option value="Guest">Guest</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-0.5 select-none">Date of Birth</label>
                <input 
                  type="date"
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 text-gray-800 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-0.5 select-none">Email Signature</label>
                <textarea 
                  rows={3}
                  value={editSignature}
                  onChange={(e) => setEditSignature(e.target.value)}
                  placeholder="Regards,&#10;Your Name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 text-gray-800 font-mono resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button 
                  type="button" 
                  onClick={() => setIsEditMode(false)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold transition cursor-pointer select-none"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={saveProfile}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 select-none"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Recovery Email Panel */}
        <div className="py-3 border-b border-gray-100">
          <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 select-none">Account Security</h5>
          
          {isVerified ? (
            <div className="p-2.5 border border-green-100 bg-green-50/20 rounded-xl flex flex-col gap-1 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-semibold text-green-700">
                <span>Recovery Email</span>
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-[9px] font-bold">Verified</span>
              </div>
              <span className="text-xs text-gray-600 truncate">{recoveryEmail}</span>
            </div>
          ) : isVerificationPending ? (
            <div className="p-2.5 border border-blue-100 bg-blue-50/10 rounded-xl space-y-2.5 animate-in fade-in duration-200">
              <span className="text-xs font-semibold text-blue-700 block">Verify Recovery Email</span>
              <p className="text-[10px] text-gray-500 leading-tight">Sent 6-digit OTP code to <strong className="text-gray-700 font-semibold">{emailInput}</strong></p>
              
              <div className="flex items-center gap-1.5">
                <input 
                  type="text"
                  placeholder="Enter OTP"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-500 text-gray-800 text-center tracking-widest font-bold"
                />
                <button 
                  onClick={handleVerifyOtp}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-2.5 py-1.5 rounded transition cursor-pointer disabled:opacity-50 font-semibold"
                >
                  Verify
                </button>
              </div>
              
              <button 
                onClick={() => {
                  setIsVerificationPending(false);
                  setOtpInput('');
                }}
                className="text-[10px] text-red-500 hover:underline cursor-pointer block text-left"
              >
                Cancel verification
              </button>
            </div>
          ) : (
            <div className="p-2.5 border border-neutral-100 bg-neutral-50/20 rounded-xl space-y-2 animate-in fade-in duration-200">
              <span className="text-xs font-semibold text-gray-500 block">Configure Recovery Email</span>
              <div className="flex items-center gap-1.5">
                <input 
                  type="email"
                  placeholder="recovery@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-1 bg-white border border-gray-200 rounded px-2.5 py-1 text-xs outline-none focus:border-blue-500 text-gray-800"
                />
                <button 
                  onClick={handleSendOtp}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2.5 py-1.5 rounded transition cursor-pointer disabled:opacity-50 font-semibold"
                >
                  Link
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <div className="pt-3">
          <button 
            onClick={() => {
              setIsProfileOpen(false);
              const savedStr = localStorage.getItem('ccmail_accounts_sessions');
              if (savedStr) {
                const saved = JSON.parse(savedStr);
                delete saved[activeEmail.toLowerCase()];
                localStorage.setItem('ccmail_accounts_sessions', JSON.stringify(saved));
                
                const remaining = Object.keys(saved);
                if (remaining.length > 0) {
                  localStorage.setItem('ccmail_active_session_email', remaining[0]);
                  showToast(`Signed out of ${activeEmail}. Switched to another account.`);
                  setTimeout(() => {
                    window.location.reload();
                  }, 800);
                } else {
                  localStorage.removeItem('ccmail_active_session_email');
                  showToast("Signed out of all accounts.");
                  setTimeout(() => {
                    window.location.href = '/login';
                  }, 800);
                }
              } else {
                localStorage.removeItem('ccmail_active_session_email');
                window.location.href = '/login';
              }
            }}
            className="w-full text-left p-2 hover:bg-red-50 text-red-600 rounded-lg font-medium transition cursor-pointer select-none"
          >
            Sign Out
          </button>
        </div>

      </div>
    </>
  );
}

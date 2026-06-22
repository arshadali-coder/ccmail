import React, { useState } from 'react';

export default function OnboardingWizard({ userId, userEmail, onComplete, showToast }) {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [dob, setDob] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [signature, setSignature] = useState(`Regards,\n`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleNext = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!fullName.trim()) {
        setErrorMsg("Full Name is required.");
        return;
      }
      if (!position) {
        setErrorMsg("Please select your position.");
        return;
      }
      if (!dob) {
        setErrorMsg("Date of Birth is required.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!recoveryEmail.trim()) {
        setErrorMsg("Recovery Email is required.");
        return;
      }
      if (!recoveryEmail.includes('@')) {
        setErrorMsg("Please enter a valid email address.");
        return;
      }
      // Auto-populate signature if it's still default or empty
      if (signature === "Regards,\n" || !signature.trim()) {
        setSignature(`Regards,\n${fullName.trim()}\n${position}\nCoding Council`);
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fullName: fullName.trim(),
          position,
          dob,
          signature: signature.trim(),
          recoveryEmail: recoveryEmail.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Onboarding completed successfully!");
        onComplete({ fullName, position, dob, signature });
      } else {
        setErrorMsg(data.error || "Failed to complete onboarding.");
      }
    } catch (err) {
      setErrorMsg("Network error saving details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      
      {/* Onboarding Dialog Card */}
      <div className="w-full max-w-[560px] bg-white rounded-3xl shadow-2xl border border-gray-150 p-8 sm:p-10 flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200 text-neutral-800">
        
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-1.5 select-none">
            {/* Google colors SVG */}
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">CCMail Onboarding</span>
          </div>
          <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
            Step {step} of 3
          </span>
        </div>

        {/* STEP 1: Basic Profile Details */}
        {step === 1 && (
          <div className="flex-1 space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Create your profile</h2>
              <p className="text-xs text-gray-500 mt-1">Let others in your organization identify you.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Full Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Arshad Ali"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:bg-white outline-none transition text-gray-850"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Position / Role</label>
                <select 
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:bg-white outline-none transition text-gray-850 cursor-pointer"
                >
                  <option value="">Select your position...</option>
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
                <label className="text-xs font-bold text-gray-500 block mb-1">Date of Birth</label>
                <input 
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:bg-white outline-none transition text-gray-850 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Recovery Details */}
        {step === 2 && (
          <div className="flex-1 space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Security & Recovery</h2>
              <p className="text-xs text-gray-500 mt-1">Specify a personal email address to secure your account.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Recovery Email Address</label>
                <input 
                  type="email"
                  placeholder="recovery@gmail.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:bg-white outline-none transition text-gray-850"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Personalization & Signature */}
        {step === 3 && (
          <div className="flex-1 space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Personalize CCMail</h2>
              <p className="text-xs text-gray-500 mt-1">Configure your default email signature signature.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Email Signature <span className="text-gray-400 font-normal">(Optional)</span></label>
                <textarea 
                  rows={4}
                  placeholder="Regards,&#10;Your Name"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:bg-white outline-none transition text-gray-850 font-mono resize-none"
                />
                <p className="text-[10px] text-gray-400 mt-1.5 leading-tight">This signature will be pre-filled at the bottom of the editor whenever you compose a new email.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message Box */}
        {errorMsg && (
          <div className="mt-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-1.5 animate-pulse">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between mt-10 border-t border-gray-100 pt-6">
          <div>
            {step > 1 && (
              <button 
                type="button"
                onClick={handleBack}
                className="text-gray-500 hover:text-gray-800 text-sm font-semibold px-4 py-2 rounded-xl transition cursor-pointer select-none"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < 3 ? (
              <button 
                type="button"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow transition cursor-pointer select-none"
              >
                Continue
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow transition cursor-pointer disabled:opacity-50 select-none"
              >
                {isSubmitting ? "Saving..." : "Get Started"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

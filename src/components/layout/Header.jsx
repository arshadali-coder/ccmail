import React from 'react';
import { Menu, Search, X, HelpCircle, Settings, Grid } from 'lucide-react';
import ProfileMenu from './ProfileMenu';

export default function Header({ 
  searchQuery, 
  setSearchQuery, 
  setMobileSidebarOpen, 
  isProfileOpen, 
  setIsProfileOpen, 
  showToast,
  userProfile,
  setUserProfile
}) {
  const [activeEmail, setActiveEmail] = React.useState('D');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ccmail_active_session_email');
      if (saved) {
        setActiveEmail(saved);
      }
    }
  }, [isProfileOpen]);

  const avatarChar = userProfile?.full_name 
    ? userProfile.full_name.charAt(0).toUpperCase() 
    : activeEmail.charAt(0).toUpperCase();

  return (
    <header className="flex items-center justify-between h-14 mb-2">
      {/* Leftside Burger (Mobile toggle) */}
      <div className="flex items-center gap-2 flex-1 max-w-3xl">
        <button 
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 hover:bg-gray-200 text-gray-700 rounded-full lg:hidden block cursor-pointer"
        >
          <Menu size={20} />
        </button>

        {/* Premium Gmail Search Interface */}
        <div className="flex-1 bg-[#EAF1FB] hover:bg-white focus-within:bg-white rounded-full flex items-center px-4 py-2.5 transition-all shadow-sm focus-within:shadow-md border border-transparent focus-within:border-gray-200">
          <Search size={18} className="text-gray-500 mr-3" />
          <input 
            type="text" 
            placeholder="Search mail by sender, subject, content..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm text-[#1F1F1F] placeholder-gray-500"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="p-1 hover:bg-gray-200 rounded-full cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* User & Options Toolbar */}
      <div className="flex items-center gap-2 ml-4">
        <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-full hidden sm:block cursor-pointer">
          <HelpCircle size={20} />
        </button>
        <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-full hidden sm:block cursor-pointer">
          <Settings size={20} />
        </button>
        <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-full hidden sm:block cursor-pointer">
          <Grid size={20} />
        </button>

        {/* Profile Avatar Trigger */}
        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-9 h-9 rounded-full bg-orange-700 flex items-center justify-center text-white font-semibold text-sm shadow hover:opacity-90 active:scale-95 transition cursor-pointer uppercase"
          >
            {avatarChar}
          </button>
          
          <ProfileMenu 
            isProfileOpen={isProfileOpen} 
            setIsProfileOpen={setIsProfileOpen} 
            showToast={showToast}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
          />
        </div>
      </div>
    </header>
  );
}

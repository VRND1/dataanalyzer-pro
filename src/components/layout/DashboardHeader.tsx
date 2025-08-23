import React, { useState } from 'react';
import { Bell, Search, X } from 'lucide-react';
import { Hexagon } from 'lucide-react';
import { AlertSystem } from '../monitoring/AlertSystem';
import { useAuth } from '@/hooks/useAuth';
import Profile from '@/pages/Profile';
import { useNavigate } from 'react-router-dom';

const DashboardHeader: React.FC = () => {
  const [showAlerts, setShowAlerts] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  // Mock data for demonstration - replace with your actual data
  const mockData = {
    fields: [
      {
        name: 'CPU Usage',
        type: 'number' as const,
        value: [75, 80, 85]
      }
    ]
  };

  // Get user initials or first letter of name
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!showDropdown) return;
    function handleClick(e: MouseEvent) {
      const dropdown = document.getElementById('profile-dropdown');
      if (dropdown && !dropdown.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  return (
    <>
      <header className="bg-gradient-to-r from-[#16222A] to-[#3A6073] shadow flex items-center px-6 py-2 h-14 w-full">
        {/* Logo and App Name */}
        <div className="flex items-center min-w-[220px]">
          <div className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse-glow bg-gradient-to-r from-teal-500/50 to-indigo-500/50 rounded-full blur-xl group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative transform transition-all duration-500 hover:scale-110 hover:rotate-180">
                <Hexagon className="w-8 h-8 text-teal-400" strokeWidth={1.5} />
                <Hexagon className="w-6 h-6 text-teal-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90" strokeWidth={1.5} />
              </div>
            </div>
            <span className="text-white font-semibold text-lg">DataAnalyzer Pro</span>
          </div>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-md bg-[#232B38] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
            />
          </div>
        </div>

        {/* Right Side: Notification and Avatar */}
        <div className="flex items-center gap-6 min-w-[120px] justify-end">
          {/* Notification Bell */}
          <div className="relative">
            <button 
              className="relative group"
              onClick={() => setShowAlerts(!showAlerts)}
            >
              <Bell className="text-white w-6 h-6" />
              {/* Notification dot */}
              <span className="absolute top-0 right-0 block w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#232B38]" />
            </button>
            <AlertSystem 
              data={mockData}
              isVisible={showAlerts}
              onClose={() => setShowAlerts(false)}
            />
          </div>
          {/* User Avatar */}
          <div className="relative group">
            <button 
              onClick={() => setShowDropdown((v) => !v)}
              className="focus:outline-none"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-cyan-400 transition-all"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-base select-none cursor-pointer hover:ring-2 hover:ring-cyan-400 transition-all">
                  {userInitial}
                </div>
              )}
            </button>
            {/* Dropdown Menu */}
            {showDropdown && (
              <div
                id="profile-dropdown"
                className="absolute right-0 mt-2 w-48 bg-[#232B38] rounded-xl shadow-lg z-50 border border-[#2d3748] animate-fade-in"
              >
                <div className="py-2">
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-[#2d3748] transition-colors gap-2"
                    onClick={() => {
                      setShowProfile(true);
                      setShowDropdown(false);
                    }}
                  >
                    <span className="inline-block"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/><path d="M12 14c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4Z"/></svg></span>
                    Profile
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-[#2d3748] transition-colors gap-2"
                    onClick={() => {
                      navigate('/settings');
                      setShowDropdown(false);
                    }}
                  >
                    <span className="inline-block"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .66.38 1.26 1 1.51a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.66 0 1.26.38 1.51 1H21a2 2 0 1 1 0 4h-.09c-.25 0-.49.09-.68.26-.19.17-.32.41-.33.68Z"/></svg></span>
                    Settings
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-[#2d3748] transition-colors gap-2"
                    onClick={async () => {
                      setShowDropdown(false);
                      await signOut();
                    }}
                  >
                    <span className="inline-block"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7"/><path d="M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0Z"/></svg></span>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="relative w-full max-w-4xl mx-4">
            <button
              onClick={() => setShowProfile(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <Profile
              initialName={user?.name || ""}
              initialBio={user?.bio || ""}
              initialAvatarUrl={user?.avatarUrl || ""}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardHeader; 
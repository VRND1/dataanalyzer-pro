import { useState, useEffect } from 'react';
import { X, Moon, Sun, Bell, Lock, Globe, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SettingsPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface SettingsButtonProps {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
}

// Reusable ToggleSwitch component
function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
    </label>
  );
}

// Reusable SettingsButton component
function SettingsButton({ icon, text, onClick }: SettingsButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left text-gray-900 dark:text-white"
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}

export function SettingsPanel({ isVisible, onClose }: SettingsPanelProps) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Main Panel Container */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden transform transition-all duration-200 ease-in-out flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Appearance Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Appearance</h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsDarkMode(false)}
                  className={`flex items-center justify-center gap-3 p-4 rounded-lg transition-all ${
                    !isDarkMode 
                      ? 'bg-blue-500 text-white ring-2 ring-blue-500' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  <span>Light Mode</span>
                </button>
                <button 
                  onClick={() => setIsDarkMode(true)}
                  className={`flex items-center justify-center gap-3 p-4 rounded-lg transition-all ${
                    isDarkMode 
                      ? 'bg-gray-800 text-white ring-2 ring-gray-700' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  <span>Dark Mode</span>
                </button>
              </div>
            </section>

            {/* Notifications Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-900 dark:text-white">Email Notifications</span>
                  </div>
                  <ToggleSwitch 
                    checked={emailNotifications}
                    onChange={setEmailNotifications}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-900 dark:text-white">Push Notifications</span>
                  </div>
                  <ToggleSwitch 
                    checked={pushNotifications}
                    onChange={setPushNotifications}
                  />
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Security</h3>
              <div className="space-y-3">
                <SettingsButton 
                  icon={<Lock className="w-5 h-5 text-blue-500" />}
                  text="Change Password"
                  onClick={() => navigate('/change-password')}
                />
                <SettingsButton 
                  icon={<Shield className="w-5 h-5 text-blue-500" />}
                  text="Two-Factor Authentication"
                  onClick={() => navigate('/two-factor-auth')}
                />
              </div>
            </section>

            {/* Data & Privacy Section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Data & Privacy</h3>
              <SettingsButton 
                icon={<Globe className="w-5 h-5 text-blue-500" />}
                text="Privacy Settings"
                onClick={() => console.log("Privacy Settings")}
              />
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
} 
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight, Menu, X } from 'lucide-react';
import { navigation, secondaryNavigation } from './NavigationItems';

interface FloatingNavProps {
  onMobileItemClick?: () => void;
}

export function FloatingNav({ onMobileItemClick }: FloatingNavProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const handleNavClick = () => {
    if (onMobileItemClick) {
      onMobileItemClick();
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-40 md:hidden p-2 rounded-lg bg-[#1e1e2d]/80 backdrop-blur-lg text-white hover:bg-white/10 transition-colors"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Navigation */}
      <nav className={`
        fixed md:relative 
        w-[280px] md:w-64 lg:w-72
        h-[calc(100vh-3rem)] sm:h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]
        bg-[#1e1e2d]/95 backdrop-blur-lg 
        border-r border-white/10 
        md:rounded-r-xl 
        overflow-y-auto 
        transition-all duration-300 
        z-30
        ${isMobileMenuOpen ? 'left-0' : '-left-[280px] md:left-0'}
      `}>
        <div className="flex flex-col h-full p-2 sm:p-3 md:p-4">
          {/* Main Navigation */}
          <div className="flex-1 space-y-1.5">
            {navigation.map((item) => (
              <div key={item.name} className="relative">
                <NavLink
                  to={item.href}
                  onClick={() => {
                    if (item.subItems) {
                      toggleExpand(item.name);
                    } else {
                      handleNavClick();
                    }
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 sm:py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-teal-500/20 text-teal-400'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white active:bg-white/20'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium">{item.name}</span>
                  {item.subItems && (
                    <ChevronRight
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${
                        expandedItems.includes(item.name) ? 'rotate-90' : ''
                      }`}
                    />
                  )}
                </NavLink>

                {/* SubItems */}
                {item.subItems && expandedItems.includes(item.name) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems.map((subItem) => (
                      <NavLink
                        key={subItem.name}
                        to={subItem.href}
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                          `block px-3 py-2.5 sm:py-2 text-sm rounded-lg transition-colors ${
                            isActive
                              ? 'bg-teal-500/20 text-teal-400'
                              : 'text-gray-400 hover:bg-white/10 hover:text-white active:bg-white/20'
                          }`
                        }
                      >
                        {subItem.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Secondary Navigation */}
          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="space-y-1.5">
              {secondaryNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 sm:py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-teal-500/20 text-teal-400'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white active:bg-white/20'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
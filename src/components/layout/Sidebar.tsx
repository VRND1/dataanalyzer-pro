import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, LineChart, FileText,
  Brain, Settings, Bell, HelpCircle, ChevronDown
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard
  },
  {
    name: 'Analysis',
    icon: LineChart,
    subItems: [
      { name: 'New Analysis', href: '/analysis/new' },
      { name: 'Results', href: '/analysis/results' },
      { name: 'Reports', href: '/analysis/reports' },
      { name: 'Simulations', href: '/analysis/simulations' }
    ]
  },
  {
    name: 'Workspaces',
    icon: FileText,
    subItems: [
      { name: 'My Workspaces', href: '/workspaces' },
      { name: 'Shared', href: '/workspaces/shared' },
      { name: 'Templates', href: '/workspaces/templates' }
    ]
  },
  {
    name: 'Tools',
    icon: Brain,
    subItems: [
      { name: 'Custom Models', href: '/tools/models' },
      { name: 'Integrations', href: '/tools/integrations' },
      { name: 'Settings', href: '/tools/settings' }
    ]
  }
];

const secondaryNavigation = [
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help & Documentation', href: '/help', icon: HelpCircle }
];

export function Sidebar() {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  // Debug: Log initial state
  React.useEffect(() => {
    console.log('Sidebar mounted, expandedItems:', expandedItems);
  }, [expandedItems]);

  const toggleExpanded = (name: string) => {
    console.log('Toggling expanded for:', name);
    setExpandedItems(prev => {
      const newState = prev.includes(name) 
        ? prev.filter(item => item !== name)
        : [...prev, name];
      console.log('New expanded state:', newState);
      return newState;
    });
  };

  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div 
      className={`fixed left-0 top-16 bottom-0 glass-effect border-r border-white/10 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } z-40`}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center transform hover:scale-110 transition-transform"
      >
        <ChevronDown className={`w-4 h-4 text-white transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-90'}`} />
      </button>

      <nav className={`h-full py-6 ${isCollapsed ? 'px-2' : 'px-4'} space-y-6`}>
        {/* Primary Navigation */}
        <div className="space-y-2">
          {navigation.map((item) => {
            // For items with subItems, only check subItems for active state
            const isActive = item.subItems
              ? item.subItems.some(subItem => location.pathname === subItem.href)
              : location.pathname === item.href || (item.href && item.href !== '/' && location.pathname.startsWith(item.href));
            const isExpanded = !isCollapsed && expandedItems.includes(item.name);
            console.log('Item:', item.name, 'isExpanded:', isExpanded, 'expandedItems:', expandedItems);

            return (
              <div key={item.name} className="relative group">
                {item.subItems ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      console.log('Button clicked for:', item.name, 'isCollapsed:', isCollapsed);
                      if (!isCollapsed) {
                        toggleExpanded(item.name);
                      }
                      return false;
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!isCollapsed) {
                          toggleExpanded(item.name);
                        }
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-teal-500/20 text-teal-400 neon-glow'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-r from-teal-500/50 to-indigo-500/50 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-75' : ''}`}></div>
                      <item.icon className="w-5 h-5 relative" />
                    </div>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.href}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-teal-500/20 text-teal-400 neon-glow'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-r from-teal-500/50 to-indigo-500/50 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-75' : ''}`}></div>
                      <item.icon className="w-5 h-5 relative" />
                    </div>
                    {!isCollapsed && <span className="flex-1">{item.name}</span>}
                  </NavLink>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full top-0 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {item.name}
                  </div>
                )}

                {/* Sub Items */}
                {!isCollapsed && item.subItems && isExpanded && (
                  <div className="mt-1 ml-8 space-y-1">
                    {item.subItems.map(subItem => {
                      console.log('Rendering subItem:', subItem.name, 'isExpanded:', isExpanded);
                      return (
                        <NavLink
                          key={subItem.name}
                          to={subItem.href}
                          className={({ isActive }) => 
                            `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive
                                ? 'bg-teal-500/10 text-teal-400'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`
                          }
                        >
                          {subItem.name}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Secondary Navigation */}
        <div className={`pt-6 ${!isCollapsed && 'border-t border-white/10'}`}>
          {secondaryNavigation.map((item) => {
            const isActive = location.pathname === item.href;

            return (
              <div key={item.name} className="relative group">
                <NavLink
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-white/20 text-white neon-glow'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="relative">
                    <div className={`absolute inset-0 bg-gradient-to-r from-teal-500/50 to-indigo-500/50 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-75' : ''}`}></div>
                    <item.icon className="w-5 h-5 relative" />
                  </div>
                  {!isCollapsed && <span>{item.name}</span>}
                </NavLink>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full top-0 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
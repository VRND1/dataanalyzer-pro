import {
  LayoutDashboard, LineChart, FileText, Brain,
  Settings, Bell, HelpCircle
} from 'lucide-react';

export const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { 
    name: 'Analysis', 
    icon: LineChart,
    href: '/analysis',
    subItems: [
      { name: 'New Analysis', href: '/analysis/new' },
      { name: 'Results', href: '/analysis/results' },
      { name: 'Reports', href: '/analysis/reports' },
      { name: 'Insights', href: '/analysis/insights' },
      { name: 'Simulations', href: '/analysis/simulations' },
      { name: 'Predictions', href: '/analysis/predictions' }
    ]
  },
  { 
    name: 'Workspaces', 
    icon: FileText,
    href: '/workspaces',
    subItems: [
      { name: 'My Workspaces', href: '/workspaces' },
      { name: 'Shared', href: '/workspaces/shared' },
      { name: 'Templates', href: '/workspaces/templates' }
    ]
  },
  { 
    name: 'Tools', 
    icon: Brain,
    href: '/tools',
    subItems: [
      { name: 'Custom Models', href: '/tools/models' },
      { name: 'Integrations', href: '/tools/integrations' },
      { name: 'Settings', href: '/tools/settings' }
    ]
  }
];

export const secondaryNavigation = [
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle }
]; 
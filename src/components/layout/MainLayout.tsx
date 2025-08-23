import React from 'react';
import { MainContent } from './MainContent'; // Adjust path as needed
import Header from '../../pages/Header';
import { useLocation } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

const HIDE_HEADER_PATHS = [
  '/analysis',
  '/dashboard',
  '/workspaces',
  '/analysis/new',
  '/analysis/visualizations',
  '/analysis/reports',
  '/analysis/simulations',
  '/analysis/trends',
  '/team',
  '/settings',
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const hideHeader = HIDE_HEADER_PATHS.includes(location.pathname);
  return (
    <div className="min-h-screen bg-white">
      {!hideHeader && <Header />}
      <MainContent>
        {children}
      </MainContent>
    </div>
  );
};

export default MainLayout; 
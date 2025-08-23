import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import Header from '../../pages/Header';
import { MainContent } from './MainContent';
import { FloatingNav } from './FloatingNav';
import { Menu, X } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const showNav = location.pathname !== '/login';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Animated Blobs - Responsive sizes */}
        <div className="absolute w-[300px] sm:w-[600px] md:w-[900px] lg:w-[1200px] h-[300px] sm:h-[600px] md:h-[900px] lg:h-[1200px] -top-[150px] sm:-top-[300px] md:-top-[450px] lg:-top-[600px] -left-[150px] sm:-left-[300px] md:-left-[450px] lg:-left-[600px] bg-gradient-to-r from-teal-500/20 to-indigo-500/20 rounded-full mix-blend-overlay animate-blob filter blur-3xl"></div>
        <div className="absolute w-[250px] sm:w-[500px] md:w-[750px] lg:w-[1000px] h-[250px] sm:h-[500px] md:h-[750px] lg:h-[1000px] top-[50px] sm:top-[100px] right-[0px] bg-gradient-to-l from-purple-500/20 to-pink-500/20 rounded-full mix-blend-overlay animate-blob animation-delay-2000 filter blur-3xl"></div>
        <div className="absolute w-[200px] sm:w-[400px] md:w-[600px] lg:w-[800px] h-[200px] sm:h-[400px] md:h-[600px] lg:h-[800px] bottom-[-150px] sm:bottom-[-300px] left-[20%] bg-gradient-to-t from-blue-500/20 to-green-500/20 rounded-full mix-blend-overlay animate-blob animation-delay-4000 filter blur-3xl"></div>
        
        {/* Grid Background */}
        <div className="absolute inset-0 data-grid opacity-5"></div>

        {/* Animated Data Points */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 sm:w-2 h-1 sm:h-2 bg-teal-400 rounded-full animate-data-flow"
              style={{
                left: `${Math.random() * 100}%`,
                top: '100%',
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-col md:flex-row flex-1">
          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden fixed bottom-4 right-4 z-50 p-3 bg-teal-500 rounded-full shadow-lg hover:bg-teal-600 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Sidebar Navigation */}
          <div className={`
            fixed md:static
            inset-0 md:inset-auto
            transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
            transition-transform duration-300 ease-in-out
            z-40
          `}>
            {showNav && <FloatingNav onMobileItemClick={() => setIsMobileMenuOpen(false)} />}
          </div>

          {/* Overlay for mobile menu */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          <MainContent>{children}</MainContent>
        </div>
      </div>
    </div>
  );
}
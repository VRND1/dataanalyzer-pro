import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../providers/auth/AuthContext';

const Header: React.FC = () => {
  const location = useLocation();
  const auth = React.useContext(AuthContext);
  const user = auth?.user;
  const signOut = auth?.signOut;

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-gray-800">
              DataAnalyzer
            </Link>
            {user && (
              <>
                <Link
                  to="/dashboard"
                  className={`text-gray-600 hover:text-gray-900 ${
                    isActive('/dashboard') ? 'text-blue-600 font-medium' : ''
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/analysis"
                  className={`text-gray-600 hover:text-gray-900 ${
                    isActive('/analysis') ? 'text-blue-600 font-medium' : ''
                  }`}
                >
                  Analysis
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 text-sm ${
                    isActive('/login')
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
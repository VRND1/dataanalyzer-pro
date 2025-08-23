import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import Header from './Header';
import {
  MDBContainer,
  MDBCol,
  MDBBtn,
  MDBIcon,
  MDBInput,
  MDBCheckbox
} from 'mdb-react-ui-kit';
import { supabase } from '../utils/supabase/client';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const navigate = useNavigate();

  // Demo credentials
  const DEMO_CREDENTIALS = [
    {
      email: 'demo@gmail.com',
      password: 'Demo@1234'
    },
    {
      email: 'user@example.com',
      password: 'password123'
    }
  ];

  const togglePassword = (): void => {
    setShowPassword(!showPassword);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check against all demo credentials
      const isValidCredential = DEMO_CREDENTIALS.some(
        cred => cred.email === formData.email && cred.password === formData.password
      );
      
      if (isValidCredential) {
        // Store login state
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({ 
          email: formData.email,
          rememberMe: formData.rememberMe 
        }));
        
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Try demo@gmail.com/Demo@1234 or user@example.com/password123');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || 
          import.meta.env.VITE_SUPABASE_URL === 'https://nexxulmmmcmekbzftvvq.supabase.co' ||
          !import.meta.env.VITE_SUPABASE_ANON_KEY ||
          import.meta.env.VITE_SUPABASE_ANON_KEY === 'your-anon-key') {
        setError('Supabase configuration is missing. Please check your environment variables.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        console.error('Google OAuth error:', error);
        setError(`Google login failed: ${error.message}`);
      } else if (data) {
        console.log('Google OAuth initiated successfully');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('Google login failed. Please try again.');
    }
  };

  return (
    <>
      <Header />
      <MDBContainer fluid className="login-container">
        <div className="gradient-blobs">
          <div className="gradient-blob blob-1 animate-blob"></div>
          <div className="gradient-blob blob-2 animate-blob animation-delay-2000"></div>
          <div className="gradient-blob blob-3 animate-blob animation-delay-4000"></div>
        </div>
        <div className="login-card">
          <MDBCol md="6" className="login-form-col">
            {/* BETA NOTE HERE */}
            <div className="beta-note" style={{
              backgroundColor: '#ffe5e5',
              color: 'black',
              border: '1px solidrgb(219, 18, 18)',
              padding: '12px 16px',
              borderRadius: '6px',
              marginBottom: '16px',
              textAlign: 'center',
              fontSize: '14px'
            }}>
              <strong>Beta Version</strong> – Try with:
              <br />
              📧 <strong>demo@gmail.com</strong> / 🔐 <strong>Demo@1234</strong><br />
              📧 <strong>user@example.com</strong> / 🔐 <strong>password123</strong>
            </div>

            <img
              src="/images/logo_data.png"
              alt="Data Analyzer Pro"
              className="w-48 h-auto mx-auto mb-4"
            />
            {error && (
              <div className="login-error">
                {error}
              </div>
            )}




            <form onSubmit={handleLogin} className="login-form" style={{ color: 'black' }}>
              <label htmlFor="login-email" className="block mb-1 text-sm font-medium text-gray-700">
                Email address
              </label>
              <MDBInput
                wrapperClass="login-input-wrapper"
                id="login-email"
                type="email"
                size="lg"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
                contrast
                className="login-input"
              />

              <div className="login-password-wrapper mt-4">
                <label htmlFor="login-password" className="block mb-1 text-sm font-medium text-gray-700">
                  Password
                </label>
                <MDBInput
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  size="lg"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  autoComplete="current-password"
                  contrast
                  className="login-input"
                />
                <MDBIcon
                  icon={showPassword ? 'eye-slash' : 'eye'}
                  className="login-password-toggle"
                  onClick={togglePassword}
                />
              </div>

              <div className="login-options">
                <MDBCheckbox
                  name="rememberMe"
                  id="login-remember"
                  label="Remember me"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="login-remember"
                />
                <a href="#!" className="login-forgot">Forgot password?</a>
              </div>

              <MDBBtn 
                type="submit" 
                className="login-submit" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Signing in...
                  </>
                ) : (
                  'Log in'
                )}
              </MDBBtn>

              {/* <MDBBtn 
                type="button" 
                className="login-submit" 
                size="lg"
                onClick={fillDemoCredentials}
                style={{ backgroundColor: '#6c757d' }}
              >
                Use Demo Account
              </MDBBtn> */}
            </form>

            <div className="login-divider">
              <span>OR</span>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-xs mx-auto mt-6">
              {/* Google Button */}
              <button
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-white text-gray-800 rounded-lg border border-gray-300 hover:shadow-md transition-all duration-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.784-1.664-4.152-2.675-6.735-2.675-5.522 0-10 4.477-10 10s4.478 10 10 10c8.396 0 10-7.496 10-10 0-0.67-0.069-1.325-0.189-1.961h-9.811z"/>
                </svg>
                <span className="text-sm font-medium">Continue with Google</span>
              </button>

              {/* GitHub Button */}
              <button
                className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="text-sm font-medium">Continue with GitHub</span>
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-white text-sm text-gray-500">OR</span>
                </div>
              </div>
            </div>
          </MDBCol>

          <MDBCol md="6" className="login-image-col" >
            <img
              src="/images/image.png"
              alt="Data Analysis Illustration"
              className="login-image"
            />
          </MDBCol>
        </div>
      </MDBContainer>

      {/* Footer with Contact */}
      <footer className="footer" id="contact" style={{ padding: '8px 0' }}>
        <h2>Contact Us</h2>
        <p>Email: support@dataanalyzerpro.com</p>
        <p>Email: Info@dataanalyzerpro.com</p>
        <p>© {new Date().getFullYear()} Data Analyzer Pro. All rights reserved.</p>
      </footer>
    </>
  );
};

export default Login; 
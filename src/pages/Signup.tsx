import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from './Header';
import {
  MDBCard,
  MDBCardBody,
  MDBInput,
  MDBCheckbox,
  MDBBtn,
  MDBIcon,
  MDBValidation,
  MDBValidationItem
} from 'mdb-react-ui-kit';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  newsletter: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

const Signup: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    newsletter: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const togglePassword = () => setShowPassword(!showPassword);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name as keyof typeof errors]) {
      const newErrors = { ...errors };
      delete newErrors[name as keyof typeof errors];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords must match';
    }
    if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemoAccount = () => {
    setFormData({
      firstName: 'Demo',
      lastName: 'User',
      email: 'user@example.com',
      phone: '+1234567890',
      password: 'password123',
      confirmPassword: 'password123',
      acceptTerms: true,
      newsletter: true
    });
    setErrors({});
  };

  return (
    <div className="background-radial-gradient" style={{ color: 'black' }}>
      <Header />
      <div className="login-container">
        <MDBCard className="login-card bg-glass">
          <MDBCardBody className="login-form-col">
            <div className="logo-container">
              <img
                src="public\images\logo-dataa.png"
                alt="DataAnalyzer Logo"
                className="logo-image"
              />
            </div>
            <p className="text-center mb-4 text-muted"> Create your account</p>

            <MDBValidation onSubmit={handleSignUp} noValidate className="w-100">
              <div className="login-input-wrapper">
                <MDBValidationItem feedback={errors.firstName} invalid={!!errors.firstName}>
                  <MDBInput
                    label="First name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="login-input"
                  />
                </MDBValidationItem>
              </div>

              <div className="login-input-wrapper">
                <MDBValidationItem feedback={errors.lastName} invalid={!!errors.lastName}>
                  <MDBInput
                    label="Last name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="login-input"
                  />
                </MDBValidationItem>
              </div>

              <div className="login-input-wrapper">
                <MDBValidationItem feedback={errors.email} invalid={!!errors.email}>
                  <MDBInput
                    type="email"
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="login-input"
                  />
                </MDBValidationItem>
              </div>

              <div className="login-input-wrapper">
                <MDBValidationItem feedback={errors.phone} invalid={!!errors.phone}>
                  <MDBInput
                    label="Phone number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="login-input"
                  />
                </MDBValidationItem>
              </div>

              <div className="login-password-wrapper">
                <MDBValidationItem feedback={errors.password} invalid={!!errors.password}>
                  <MDBInput
                    type={showPassword ? "text" : "password"}
                    label="Password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="login-input"
                  />
                  <MDBIcon
                    icon={showPassword ? "eye-slash" : "eye"}
                    className="login-password-toggle"
                    onClick={togglePassword}
                  />
                </MDBValidationItem>
              </div>

              <div className="login-input-wrapper">
                <MDBValidationItem feedback={errors.confirmPassword} invalid={!!errors.confirmPassword}>
                  <MDBInput
                    type={showPassword ? "text" : "password"}
                    label="Confirm Password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="login-input"
                  />
                </MDBValidationItem>
              </div>

              <div className="login-options">
                <MDBCheckbox
                  name="newsletter"
                  label="Subscribe to newsletter"
                  checked={formData.newsletter}
                  onChange={handleInputChange}
                  className="login-remember"
                />
                <Link to="/forgot-password" className="login-forgot">Forgot password?</Link>
              </div>

              <div className="mb-4">
                <MDBCheckbox
                  name="acceptTerms"
                  label={
                    <>
                      I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a> and{' '}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                    </>
                  }
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <MDBBtn type="submit" className="login-submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Creating Account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </MDBBtn>
            </MDBValidation>

            <div className="text-center mb-4">
              <MDBBtn color="light" className="w-100" onClick={loadDemoAccount}>
                Use Demo Account
              </MDBBtn>
            </div>

            <div className="login-divider">
              <span>OR</span>
            </div>

            <div className="login-social-buttons">
              <MDBBtn className="login-twitter">
                <MDBIcon fab icon="twitter" className="login-social-icon" />
                Continue with Twitter
              </MDBBtn>
            </div>

            <div className="text-center mt-4">
              <p className="login-link">
                Already have an account? <Link to="/login" className="text-primary">Login</Link>
              </p>
            </div>
          </MDBCardBody>
        </MDBCard>
      </div>

      {/* Footer with Contact */}
      <footer className="footer" id="contact" style={{ padding: '8px 0' }}>
        <h2>Contact Us</h2>
        <p>Email: support@dataanalyzerpro.com</p>
        <p>Email: Info@dataanalyzerpro.com</p>
        <p>© {new Date().getFullYear()} Data Analyzer Pro. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Signup; 
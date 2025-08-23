import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface TwoFactorAuthProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TwoFactorAuth({ isOpen, onClose }: TwoFactorAuthProps) {
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Simulated QR code secret
  const secretKey = 'ABCD-EFGH-IJKL-MNOP';

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    try {
      // Here you would typically verify the code with your backend
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setStep(1);
      }, 2000);
    } catch (err) {
      setError('Failed to verify code. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md glass-effect rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Two-Factor Authentication</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {step === 1 ? (
            <>
              <div className="text-gray-300 space-y-4">
                <p>Enhance your account security by enabling two-factor authentication.</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Download an authenticator app like Google Authenticator or Authy</li>
                  <li>Scan the QR code or enter the secret key manually</li>
                  <li>Enter the verification code to complete setup</li>
                </ol>
              </div>

              <div className="mt-6 p-4 bg-black/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-mono">{secretKey}</span>
                  <button
                    onClick={handleCopySecret}
                    className="text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-green-500 text-sm text-center">
                  Two-factor authentication enabled successfully!
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                >
                  Enable 2FA
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 
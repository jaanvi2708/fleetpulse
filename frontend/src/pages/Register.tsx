import React, { useState } from 'react';
import { Radio, Mail, Lock, User, CheckCircle } from 'lucide-react';

interface RegisterProps {
  onLoginRedirect: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onLoginRedirect }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => {
        onLoginRedirect();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fp-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">

      <div className="w-full max-w-md bg-fp-card/80 backdrop-blur-sm border border-fp-border p-8 rounded-xl shadow-card relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-3">
            <Radio className="w-9 h-9 text-fp-accent" />
          </div>
          <h2 className="text-xl font-semibold tracking-wide text-stone-200">
            Create Account
          </h2>
          <span className="text-xs text-stone-500 mt-1">
            Register for fleet access
          </span>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-fp-danger/8 border border-fp-danger/20 text-fp-danger text-xs font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 p-3 rounded-lg bg-fp-success/8 border border-fp-success/20 text-fp-success text-xs font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Account created! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-stone-500 font-medium block">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-fp-bg border border-fp-border rounded-lg py-2.5 pl-11 pr-4 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-fp-accent/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-stone-500 font-medium block">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-fp-bg border border-fp-border rounded-lg py-2.5 pl-11 pr-4 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-fp-accent/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-stone-500 font-medium block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-fp-bg border border-fp-border rounded-lg py-2.5 pl-11 pr-4 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-fp-accent/50 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-6 py-2.5 bg-fp-accent hover:bg-fp-accent-light text-stone-950 rounded-lg font-semibold transition-all select-none flex items-center justify-center text-sm disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-stone-500">
            Already have an account?{' '}
            <button
              onClick={onLoginRedirect}
              className="text-fp-accent hover:underline font-medium"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Register;

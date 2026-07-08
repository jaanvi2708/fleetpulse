import React, { useState } from 'react';
import { Radio, Mail, Lock, ShieldAlert } from 'lucide-react';
import { useFleetStore } from '../store/fleetStore';

interface LoginProps {
  onRegisterRedirect: () => void;
}

export const Login: React.FC<LoginProps> = ({ onRegisterRedirect }) => {
  const login = useFleetStore((state) => state.login);
  const [email, setEmail] = useState('admin@fleetpulse.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: "" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Authentication failed');
      }

      const data = await response.json();
      
      const userResponse = await fetch('http://localhost:8000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to retrieve user profile information.');
      }
      
      const userData = await userResponse.json();
      login(data.access_token, userData.email, userData.full_name || 'Administrator');
    } catch (err: any) {
      setError(err.message || 'Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fp-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">

      <div className="w-full max-w-md bg-fp-card/80 backdrop-blur-sm border border-fp-border p-8 rounded-xl shadow-card relative z-10">
        
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-3">
            <Radio className="w-9 h-9 text-fp-accent" />
          </div>
          <h2 className="text-xl font-semibold tracking-wide text-stone-200">
            FleetPulse
          </h2>
          <span className="text-xs text-stone-500 mt-1">
            Fleet Operations Portal
          </span>
        </div>

        {/* Demo Credentials */}
        <div className="mb-6 p-3 rounded-lg bg-fp-accent/5 border border-fp-accent/15 flex gap-3 text-xs text-stone-400">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-fp-accent" />
          <div>
            <p className="font-medium text-stone-300">Demo Credentials</p>
            <p>Email: <span className="text-stone-200">admin@fleetpulse.com</span></p>
            <p>Password: <span className="text-stone-200">admin123</span></p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-fp-danger/8 border border-fp-danger/20 text-fp-danger text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={loading}
            className="w-full mt-6 py-2.5 bg-fp-accent hover:bg-fp-accent-light text-stone-950 rounded-lg font-semibold transition-all select-none flex items-center justify-center text-sm disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-stone-500">
            Don't have an account?{' '}
            <button
              onClick={onRegisterRedirect}
              className="text-fp-accent hover:underline font-medium"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Login;

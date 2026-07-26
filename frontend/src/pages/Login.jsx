import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/supervisor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@ppe.com');
      setPassword('Admin@123');
    } else {
      setEmail('supervisor@ppe.com');
      setPassword('Supervisor@123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-md">
       
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="font-display text-xl font-semibold text-ink">Sign in</h1>
          <p className="text-sm text-muted mt-1 mb-6">PPE compliance monitoring for admins and site supervisors.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                placeholder="you@site.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-accent text-white font-medium text-sm py-2.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-muted mb-2">Demo credentials (seeded data):</p>
            <div className="flex gap-2">
              <button onClick={() => fillDemo('admin')} className="flex-1 text-xs font-mono border border-slate-200 rounded-lg py-2 hover:bg-slate-50">
                Admin demo
              </button>
              <button onClick={() => fillDemo('supervisor')} className="flex-1 text-xs font-mono border border-slate-200 rounded-lg py-2 hover:bg-slate-50">
                Supervisor demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

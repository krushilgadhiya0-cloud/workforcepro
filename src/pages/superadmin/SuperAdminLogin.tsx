import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, Mail, Lock, Sun, Moon, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useEmailValidation } from '../../hooks/useEmailValidation';

export function SuperAdminLogin() {
  const navigate = useNavigate();
  const { login, logout } = useData();
  const { theme, toggleTheme } = useTheme();
  const { emailError, checking, validateEmail, clearEmailError } = useEmailValidation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const formatCheck = await validateEmail(email);
    if (!formatCheck.valid) {
      setError(formatCheck.message);
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (!user) {
        setError('Invalid Super Admin credentials.');
        return;
      }
      if (user.role !== 'superadmin') {
        await logout();
        setError('This account is not authorized for Super Admin access.');
        return;
      }

      navigate('/superadmin', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
      <div className="absolute top-6 right-6">
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[var(--border)]/50 transition-colors cursor-pointer">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors mb-6">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="glass-card rounded-2xl p-8 border border-amber-500/20">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 mb-4">
              <Crown size={28} />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Super Admin Sign In</h1>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              Authorized platform administrators only. Enter your configured email and password.
            </p>
          </div>

          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
            <Shield size={14} className="mt-0.5 shrink-0" />
            <span>This portal is separate from business owner login. Access is granted only with valid Super Admin credentials.</span>
          </div>

          {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">{error}</div>}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-[38px] text-[var(--text-muted)]" />
              <Input
                label="Super Admin Email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearEmailError(); setError(''); }}
                onBlur={() => { if (email.trim()) void validateEmail(email); }}
                error={emailError}
                className="pl-10"
                placeholder="admin@yourcompany.com"
                autoComplete="username"
                required
              />
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-[38px] text-[var(--text-muted)]" />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="pl-10"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" disabled={checking || submitting} className="w-full bg-amber-500 hover:bg-amber-600">
              {submitting ? 'Syncing…' : checking ? 'Verifying…' : 'Sign In as Super Admin'}
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--text-muted)] mt-6">
            Business owner or worker?{' '}
            <Link to="/login" className="text-[var(--primary)] font-medium">Go to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

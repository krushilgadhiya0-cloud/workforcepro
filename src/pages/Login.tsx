import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { FormEvent } from 'react';
import { Sparkles, Mail, Lock, User, Building2, Sun, Moon, ArrowLeft, Crown } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useEmailValidation } from '../hooks/useEmailValidation';

export function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, logout, register, refresh, syncState, syncError } = useData();
  const [submitting, setSubmitting] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { emailError, checking, validateEmail, clearEmailError } = useEmailValidation();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [companyName, setCompanyName] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');

  const emptyForm = { name: '', email: '', password: '', confirmPassword: '' };

  const setAuthMode = (next: 'login' | 'register') => {
    setMode(next);
    setError('');
    setSuccess('');
    setStep('form');
    setForm(emptyForm);
    if (next === 'register') {
      setSearchParams({ mode: 'register' });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'superadmin') {
      navigate('/superadmin/login', { replace: true });
      return;
    }
    setMode(m === 'register' ? 'register' : 'login');
  }, [searchParams, navigate]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const formatCheck = await validateEmail(form.email);
      if (!formatCheck.valid) {
        setError(formatCheck.message);
        return;
      }
      const user = await login(form.email, form.password);
      if (!user) {
        setError('Invalid email or password. Please check your credentials.');
        return;
      }
      if (user.role === 'superadmin') {
        await logout();
        setError('Super Admin must use the secure admin sign-in page.');
        return;
      }
      if (user.role === 'worker') navigate('/worker');
      else navigate('/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const emailCheck = await validateEmail(form.email, { checkDeliverability: true });
    if (!emailCheck.valid) {
      setError(emailCheck.message);
      return;
    }
    const latest = await refresh();
    if (latest.users.some((u) => u.email.toLowerCase() === form.email.toLowerCase())) {
      setError('Email already registered. Please login instead.');
      return;
    }
    setStep('verify');
    setSuccess(`Verification email sent to ${form.email}. For demo, click "Complete Registration" below.`);
  };

  const completeRegistration = async () => {
    setSubmitting(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        name: form.name,
        role: 'owner',
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 animate-gradient" style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4, #7c3aed)' }} />
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <span className="text-2xl font-bold">WorkForce Pro</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
          <p className="text-white/80 text-lg max-w-md">
            Manage your workforce smarter with our premium business management platform.
          </p>
          <div className="mt-12 space-y-4">
            {['Task & Worker Management', 'Payment Tracking', 'Leave & Reports'].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white/60" />
                <span className="text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[var(--border)]/50 transition-colors cursor-pointer">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="glass-card rounded-2xl p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium mb-4">
                  <Building2 size={16} />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company / Store Name"
                    className="bg-transparent outline-none text-center w-48 placeholder:text-[var(--primary)]/60"
                  />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text)]">
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  {mode === 'login' ? 'Sign in with credentials from your business owner or admin' : 'Business owners only — create your company account'}
                </p>
              </div>

              <div className="flex rounded-xl bg-[var(--border)]/30 p-1 mb-6">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${mode === 'login' ? 'bg-[var(--card)] shadow-sm text-[var(--text)]' : 'text-[var(--text-muted)]'}`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${mode === 'register' ? 'bg-[var(--card)] shadow-sm text-[var(--text)]' : 'text-[var(--text-muted)]'}`}
                >
                  Register
                </button>
              </div>

              {syncState === 'offline' && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
                  <strong>Cloud sync offline.</strong> Accounts only work on this device until Redis is connected in Vercel.
                  {syncError && <span className="block mt-1 text-xs opacity-90">{syncError}</span>}
                </div>
              )}

              {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">{error}</div>}
              {success && <div className="mb-4 p-3 rounded-xl bg-green-500/10 text-green-600 text-sm">{success}</div>}

              {mode === 'login' && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--primary)]/10 text-xs text-[var(--text-muted)]">
                  <strong className="text-[var(--text)]">Workers & admins:</strong> Use the email and password provided when your account was created. Self-registration is not available for workers.
                </div>
              )}

              {mode === 'register' && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--primary)]/10 text-xs text-[var(--text-muted)]">
                  <strong className="text-[var(--text)]">Owners only.</strong> Workers and admins are added by the business owner and receive login credentials automatically.
                </div>
              )}

              {step === 'form' ? (
                <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-4">
                  {mode === 'register' && (
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-[38px] text-[var(--text-muted)]" />
                      <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="pl-10" placeholder="John Doe" required />
                    </div>
                  )}
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-[38px] text-[var(--text-muted)]" />
                    <Input
                      label="Email Address"
                      type="email"
                      value={form.email}
                      onChange={(e) => { setForm({ ...form, email: e.target.value }); clearEmailError(); setError(''); }}
                      onBlur={() => { if (form.email.trim()) void validateEmail(form.email, { checkDeliverability: mode === 'register' }); }}
                      error={emailError}
                      className="pl-10"
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-[38px] text-[var(--text-muted)]" />
                    <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pl-10" placeholder="••••••••" required />
                  </div>
                  {mode === 'register' && (
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-[38px] text-[var(--text-muted)]" />
                      <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="pl-10" placeholder="••••••••" required />
                    </div>
                  )}
                  <Button type="submit" disabled={checking || submitting} className="w-full">
                    {submitting ? 'Syncing…' : checking ? 'Checking email…' : mode === 'login' ? 'Sign In' : 'Register & Verify Email'}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="text-center p-6">
                    <Mail size={48} className="mx-auto text-[var(--primary)] mb-3" />
                    <p className="text-sm text-[var(--text-muted)]">Check your inbox at <strong>{form.email}</strong></p>
                  </div>
                  <Button className="w-full" disabled={submitting} onClick={() => void completeRegistration()}>
                    {submitting ? 'Saving…' : 'Complete Registration (Demo)'}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setStep('form')}>Back</Button>
                </div>
              )}

              {mode === 'login' && (
                <p className="text-center text-sm text-[var(--text-muted)] mt-4">
                  Business owner?{' '}
                  <button type="button" onClick={() => setAuthMode('register')} className="text-[var(--primary)] font-medium cursor-pointer">Register</button>
                </p>
              )}

              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <Link
                  to="/superadmin/login"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 transition-colors"
                >
                  <Crown size={16} />
                  Super Admin Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

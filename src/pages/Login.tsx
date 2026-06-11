import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { FormEvent } from 'react';
import { Sparkles, Mail, Lock, User, Building2, Sun, Moon, ArrowLeft, Crown } from 'lucide-react';
import { SUPER_ADMIN_EMAIL } from '../utils/storage';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';

export function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, users } = useData();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'login' | 'register' | 'superadmin'>('login');
  const [companyName, setCompanyName] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');

  const emptyForm = { name: '', email: '', password: '', confirmPassword: '' };

  const setAuthMode = (next: 'login' | 'register' | 'superadmin') => {
    setMode(next);
    setError('');
    setSuccess('');
    setStep('form');
    if (next === 'login') {
      setForm(emptyForm);
      setSearchParams({});
    } else if (next === 'register') {
      setForm(emptyForm);
      setSearchParams({ mode: 'register' });
    } else {
      setForm({ ...emptyForm, email: SUPER_ADMIN_EMAIL });
      setSearchParams({ mode: 'superadmin' });
    }
  };

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'register') {
      setMode('register');
      return;
    }
    if (m === 'superadmin') {
      setMode('superadmin');
      setForm((prev) => ({ ...prev, email: SUPER_ADMIN_EMAIL, password: '' }));
      return;
    }
    setMode('login');
  }, [searchParams]);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const user = login(form.email, form.password);
    if (user) {
      if (user.role === 'superadmin') navigate('/superadmin');
      else if (user.role === 'worker') navigate('/worker');
      else navigate('/dashboard');
    } else {
      setError('Invalid email or password. Please check your credentials.');
    }
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === form.email.toLowerCase())) {
      setError('Email already registered. Please login instead.');
      return;
    }
    setStep('verify');
    setSuccess(`Verification email sent to ${form.email}. For demo, click "Complete Registration" below.`);
  };

  const completeRegistration = () => {
    try {
      register({
        email: form.email,
        password: form.password,
        name: form.name,
        role: 'owner',
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setStep('form');
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
                  {mode === 'superadmin' ? 'Super Admin' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  {mode === 'superadmin' ? 'Platform administrator access — view all companies & payments' : mode === 'login' ? 'Sign in with credentials from your business owner or admin' : 'Business owners only — create your company account'}
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
                <button
                  type="button"
                  onClick={() => setAuthMode('superadmin')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${mode === 'superadmin' ? 'bg-amber-500/20 shadow-sm text-amber-600 dark:text-amber-400' : 'text-[var(--text-muted)]'}`}
                >
                  <Crown size={14} /> Super Admin
                </button>
              </div>

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

              {mode === 'superadmin' && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
                  <strong>Super Admin access.</strong> Use the credentials configured for this deployment.
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
                    <Input label="Email Address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-10" placeholder="you@company.com" required />
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
                  <Button type="submit" className={`w-full ${mode === 'superadmin' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}>
                    {mode === 'superadmin' ? 'Sign In as Super Admin' : mode === 'login' ? 'Sign In' : 'Register & Verify Email'}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="text-center p-6">
                    <Mail size={48} className="mx-auto text-[var(--primary)] mb-3" />
                    <p className="text-sm text-[var(--text-muted)]">Check your inbox at <strong>{form.email}</strong></p>
                  </div>
                  <Button className="w-full" onClick={completeRegistration}>Complete Registration (Demo)</Button>
                  <Button variant="outline" className="w-full" onClick={() => setStep('form')}>Back</Button>
                </div>
              )}

              {mode === 'login' && (
                <p className="text-center text-sm text-[var(--text-muted)] mt-4">
                  Business owner?{' '}
                  <button type="button" onClick={() => setAuthMode('register')} className="text-[var(--primary)] font-medium cursor-pointer">Register</button>
                  {' · '}
                  <button type="button" onClick={() => setAuthMode('superadmin')} className="text-amber-600 font-medium cursor-pointer">Super Admin</button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

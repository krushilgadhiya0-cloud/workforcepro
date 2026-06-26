import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { FormEvent } from 'react';
import { Sparkles, Mail, Lock, Building2, Sun, Moon, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PasswordStrengthMeter } from '../components/ui/PasswordStrengthMeter';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useEmailValidation } from '../hooks/useEmailValidation';
import { validatePasswordStrength, type PasswordStrength } from '../utils/password';

import { fireCelebration } from '../utils/confetti';

export function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, logout, register, refresh, syncState, forgotPasswordReset, isEmailTaken } = useData();

  const [submitting, setSubmitting] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { emailError, checking, validateEmail, clearEmailError } = useEmailValidation();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [companyName, setCompanyName] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'password'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const [regStrength, setRegStrength] = useState<PasswordStrength>(validatePasswordStrength(''));
  const [forgotStrength, setForgotStrength] = useState<PasswordStrength>(validatePasswordStrength(''));

  const updateField = (field: string, value: string) => {
    const d = { ...form, [field]: value };
    setForm(d);
    if (field === 'password' && mode === 'register') {
      setRegStrength(validatePasswordStrength(value));
    }
  };

  const handleForgotPassChange = (field: 'new' | 'confirm', value: string) => {
    const d = { ...passwords, [field]: value };
    setPasswords(d);
    if (field === 'new') {
      setForgotStrength(validatePasswordStrength(value));
    }
  };

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
        if (!isEmailTaken(form.email)) {
          alert("Account not found. Please register first or check your email address.");
          setError('Account not found.');
        } else {
          setError('Invalid email or password. Please check your credentials.');
        }
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

  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
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

      // Send Real OTP
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to send verification code');
      }

      setStep('verify');
      setSuccess(`A 6-digit verification code has been sent to ${form.email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setSubmitting(false);
    }
  };

  const completeRegistration = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setSubmitting(true);
    setVerifying(true);
    setError('');
    try {
      // Verify OTP and Send Welcome Email
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp, name: form.name }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Invalid verification code');

      await register({
        email: form.email,
        password: form.password,
        name: form.name,
        role: 'owner',
      });
      
      fireCelebration();
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setSubmitting(false);
      setVerifying(false);
    }
  };

  const handleForgotEmail = async (e: FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    try {
      const emailCheck = await validateEmail(forgotEmail);
      if (!emailCheck.valid) throw new Error(emailCheck.message);
      
      if (!isEmailTaken(forgotEmail)) {
        alert("Account not found with this email. Please check and try again.");
        throw new Error('Account not found.');
      }

      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.toLowerCase().trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to send OTP');
      }
      setForgotStep('otp');
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Error sending OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (forgotOtp.length !== 6) {
      setForgotError('Enter 6-digit code');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.toLowerCase().trim(), otp: forgotOtp }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Invalid OTP');
      }
      setForgotStep('password');
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Login check failed');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async (e: FormEvent) => {
    e.preventDefault();
    if (passwords.new.length < 6) {
      setForgotError('Password must be at least 6 characters');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setForgotError('Passwords do not match');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const ok = await forgotPasswordReset(forgotEmail, passwords.new);
      if (!ok) throw new Error('Could not update password');
      
      setForgotSuccess('Password changed successfully! You can now login.');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep('email');
        setForgotEmail('');
        setForgotOtp('');
        setPasswords({ new: '', confirm: '' });
        setForgotSuccess('');
      }, 2500);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex overflow-hidden font-sans">
      {/* Decorative Blur Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--primary)]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent)]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 animate-gradient opacity-90" style={{ background: 'linear-gradient(135deg, #1e40af, #0369a1, #6d28d9, #312e81)' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        
        <div className="relative z-10 flex flex-col justify-center p-16 text-white w-full">
          <div className="flex items-center gap-4 mb-20 animate-fade-in-down">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl">
              <Sparkles size={28} className="text-blue-200" />
            </div>
            <div>
              <span className="text-3xl font-black tracking-tight block">WorkForce</span>
              <span className="text-sm font-medium tracking-widest uppercase opacity-60 text-blue-200">Management Suite</span>
            </div>
          </div>

          <div className="space-y-12 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-6xl font-bold leading-tight tracking-tight">
                Streamline <br />
                <span className="text-blue-200">Everything.</span>
              </h1>
              <p className="text-white/70 text-xl max-w-md leading-relaxed">
                Empower your business with the ultimate workspace coordination platform. Efficient, secure, and ready for scale.
              </p>
            </div>

            <div className="grid gap-6">
              {[
                { icon: <Building2 className="text-blue-200" />, title: 'Smart Coordination', desc: 'Auto-sync business data across all devices.' },
                { icon: <Sparkles className="text-blue-200" />, title: 'AI-Powered Chat', desc: 'Real-time insights directly in your messages.' },
                { icon: <Shield className="text-blue-200" />, title: 'Enterprise Security', desc: 'Role-based access & automated bank-grade safety.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all cursor-default group">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">{item.icon}</div>
                  <div>
                    <h4 className="font-semibold text-lg">{item.title}</h4>
                    <p className="text-sm text-white/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-auto pt-12 flex items-center gap-6 text-white/40 text-sm">
            <span>Powered by NextGen Cloud</span>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span>© 2026 WorkForce Pro</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="flex items-center justify-between p-6 z-10">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-all bg-[var(--card)]/50 backdrop-blur px-4 py-2 rounded-full border border-[var(--border)]">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <button onClick={toggleTheme} className="p-3 rounded-full bg-[var(--card)]/50 backdrop-blur border border-[var(--border)] hover:bg-[var(--primary)]/5 transition-all cursor-pointer shadow-sm">
            {theme === 'light' ? <Moon size={20} className="text-slate-600" /> : <Sun size={20} className="text-amber-400" />}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="glass-card rounded-[2.5rem] p-10 border border-[var(--border)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 blur-3xl rounded-full" />
              
              <div className="text-center mb-10 relative">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[var(--primary)]/5 border border-[var(--primary)]/10 text-[var(--primary)] text-sm font-semibold mb-6 shadow-sm">
                  <Building2 size={18} />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter Business Name"
                    className="bg-transparent outline-none text-center w-full placeholder:text-[var(--primary)]/40 tracking-wide"
                  />
                </div>
                <h2 className="text-3xl font-black text-[var(--text)] tracking-tight mb-2">
                  {mode === 'login' ? 'Great to see you again' : 'Join the Revolution'}
                </h2>
                <p className="text-[var(--text-muted)] text-sm px-4">
                  {mode === 'login' ? 'Enter your credentials to manage your business.' : 'Get started with a business owner account today.'}
                </p>
              </div>

              <div className="flex p-1.5 rounded-[1.25rem] bg-[var(--border)]/10 border border-[var(--border)]/20 mb-8">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-3 rounded-[1rem] text-sm font-bold tracking-wide transition-all cursor-pointer ${mode === 'login' ? 'bg-[var(--card)] shadow-lg text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                >
                  SIGN IN
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-3 rounded-[1rem] text-sm font-bold tracking-wide transition-all cursor-pointer ${mode === 'register' ? 'bg-[var(--card)] shadow-lg text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                >
                  SIGN UP
                </button>
              </div>

              {syncState === 'offline' && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-sm flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">!</div>
                  <div>
                    <span className="font-bold block">Standalone Mode</span>
                    <p className="text-xs opacity-70 mt-0.5">Records are local. Connect Supabase to sync across devices.</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-rose-500 text-sm font-medium animate-shake">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 text-sm font-medium">
                  {success}
                </div>
              )}

              {step === 'form' ? (
                <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-5">
                  {mode === 'register' && (
                    <div className="space-y-1.5">
                      <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Johnathan Smith" required />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Input
                      label="Email Address"
                      type="email"
                      value={form.email}
                      onChange={(e) => { setForm({ ...form, email: e.target.value }); clearEmailError(); setError(''); }}
                      onBlur={() => { if (form.email.trim()) void validateEmail(form.email, { checkDeliverability: mode === 'register' }); }}
                      error={emailError}
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input label="Password" type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="••••••••" required />
                      {mode === 'login' && (
                        <div className="flex justify-end mt-1.5">
                          <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs text-[var(--primary)] hover:text-[var(--primary)]/80 font-bold tracking-tight cursor-pointer">
                            Forgot your password?
                          </button>
                        </div>
                      )}
                    </div>
                    {mode === 'register' && form.password && (
                      <div className="pt-2">
                        <PasswordStrengthMeter strength={regStrength} />
                      </div>
                    )}
                  </div>
                  {mode === 'register' && (
                    <div className="space-y-1.5">
                      <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="••••••••" required />
                    </div>
                  )}
                  <div className="pt-4">
                    <Button type="submit" disabled={checking || submitting || (mode === 'register' && !regStrength.isValid)} className="w-full py-4 rounded-2xl font-black tracking-widest uppercase text-xs shadow-xl shadow-[var(--primary)]/20 active:scale-[0.98] transition-transform">
                      {submitting ? 'Authenticating…' : checking ? 'Verifying…' : mode === 'login' ? 'Secure Sign In' : 'Create My Account'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 pt-2">
                  <div className="text-center p-8 bg-[var(--primary)]/5 rounded-[2rem] border border-[var(--primary)]/10 animate-fade-in">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
                      <Mail size={32} className="text-[var(--primary)]" />
                    </div>
                    <h3 className="font-bold text-xl mb-2 text-[var(--text)]">Check your inbox</h3>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                      We sent a security code to:<br/>
                      <span className="font-bold text-[var(--primary)]">{form.email}</span>
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <Input
                      label="6-Digit Verification Code"
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="text-center text-3xl tracking-[0.5em] font-black h-16"
                      placeholder="000000"
                      required
                    />
                    <Button className="w-full py-4 rounded-2xl font-black tracking-widest uppercase text-xs shadow-xl" disabled={submitting || verifying} onClick={() => void completeRegistration()}>
                      {verifying ? 'Verifying Code…' : 'Confirm Registration'}
                    </Button>
                    <button onClick={() => setStep('form')} disabled={submitting} className="w-full py-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                      Back to details
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-10 pt-8 border-t border-[var(--border)]">
                <Link
                  to="/superadmin/login"
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-xs font-black tracking-[0.1em] uppercase text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 transition-all hover:shadow-lg hover:shadow-amber-500/5"
                >
                  <Shield size={16} />
                  Super Admin Secure Access
                </Link>
                
                <p className="text-center text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-widest mt-6 opacity-40">
                  Protected by Enterprise SSL Encryption
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={showForgotModal} onClose={() => { if (!forgotLoading) setShowForgotModal(false); }} title="Reset Password">

        <div className="p-1">
          {forgotError && <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium">{forgotError}</div>}
          {forgotSuccess && <div className="mb-4 p-3 rounded-xl bg-green-500/10 text-green-600 text-sm font-medium">{forgotSuccess}</div>}

          {forgotStep === 'email' && (
            <form onSubmit={handleForgotEmail} className="space-y-4">
              <p className="text-sm text-[var(--text-muted)]">Enter your email and we'll send you an OTP to reset your password.</p>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-[38px] text-[var(--text-muted)]" />
                <Input label="Email Address" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="pl-10" placeholder="you@company.com" required />
              </div>
              <Button type="submit" className="w-full" disabled={forgotLoading}>
                {forgotLoading ? 'Sending...' : 'Send Reset Code'}
              </Button>
            </form>
          )}

          {forgotStep === 'otp' && (
            <form onSubmit={handleForgotOtp} className="space-y-4 text-center">
              <div className="p-4 bg-[var(--primary)]/5 rounded-2xl mb-2">
                <Mail size={32} className="mx-auto text-[var(--primary)] mb-2" />
                <p className="text-sm text-[var(--text-muted)]">Verify code sent to<br/><strong className="text-[var(--text)]">{forgotEmail}</strong></p>
              </div>
              <Input
                label="6-Digit OTP"
                type="text"
                maxLength={6}
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-[0.5em] font-bold"
                placeholder="000000"
                required
              />
              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={forgotLoading}>
                  {forgotLoading ? 'Verifying...' : 'Next'}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setForgotStep('email')} disabled={forgotLoading}>Back</Button>
              </div>
            </form>
          )}

          {forgotStep === 'password' && (
            <form onSubmit={handleForgotReset} className="space-y-4">
              <p className="text-sm text-[var(--text-muted)]">Strong passwords include numbers and symbols.</p>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-[38px] text-[var(--text-muted)]" />
                <Input label="New Password" type="password" value={passwords.new} onChange={(e) => handleForgotPassChange('new', e.target.value)} className="pl-10" placeholder="••••••••" required />
              </div>
              {passwords.new && <PasswordStrengthMeter strength={forgotStrength} />}
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-[38px] text-[var(--text-muted)]" />
                <Input label="Confirm New Password" type="password" value={passwords.confirm} onChange={(e) => handleForgotPassChange('confirm', e.target.value)} className="pl-10" placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full" disabled={forgotLoading || !forgotStrength.isValid}>
                {forgotLoading ? 'Updating Password...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}

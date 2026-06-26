import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ListTodo, Users, CreditCard, CalendarOff, BarChart3, Shield,
  ArrowRight, Sparkles, Sun, Moon, Crown,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscriptionPayment } from '../hooks/useSubscriptionPayment';
import { useEmailValidation } from '../hooks/useEmailValidation';
import { RazorpayStatus } from '../components/payments/RazorpayStatus';

const features = [
  { icon: ListTodo, title: 'Task Management', desc: 'Assign, track, and complete tasks efficiently' },
  { icon: Users, title: 'Worker Management', desc: 'Manage your entire workforce in one place' },
  { icon: CreditCard, title: 'Payment Tracking', desc: 'Track salaries and generate receipts' },
  { icon: CalendarOff, title: 'Leave Management', desc: 'Handle leave requests seamlessly' },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'Insights to grow your business' },
  { icon: Shield, title: 'Multi-Admin Support', desc: 'Delegate with role-based access' },
];

const industries = [
  'Technology', 'Retail', 'Manufacturing', 'Healthcare', 'Education', 'Finance', 'Hospitality', 'Other',
].map((i) => ({ value: i, label: i }));

export function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { register, createCompany, subscribe, currentUserId, users } = useData();
  const currentUser = users.find(u => u.id === currentUserId);

  const [showBusiness, setShowBusiness] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'trial' | 'monthly' | 'yearly'>('trial');
  const [createdCompany, setCreatedCompany] = useState<{ id: string; name: string; email: string; ownerName: string; phone: string } | null>(null);
  const [businessForm, setBusinessForm] = useState({
    name: '', ownerName: '', email: '', phone: '', address: '', industry: 'Technology', ownerPassword: '',
  });
  const [businessError, setBusinessError] = useState('');

  const { emailError, checking, validateEmail, clearEmailError } = useEmailValidation();
  const { pay, loading: paying, error: paymentError } = useSubscriptionPayment((plan, companyId) => {
    subscribe(companyId, plan);
    setShowSubscription(false);
    setCreatedCompany(null);
    navigate('/dashboard');
  });

  const handleStartBusiness = () => {
    navigate('/login?mode=register');
  };

  const handleCreateBusiness = async () => {
    setBusinessError('');
    if (!businessForm.name || !businessForm.ownerName || !businessForm.email || !businessForm.ownerPassword) {
      setBusinessError('Please fill in all required fields');
      return;
    }
    const emailCheck = await validateEmail(businessForm.email, { checkDeliverability: true });
    if (!emailCheck.valid) {
      setBusinessError(emailCheck.message);
      return;
    }
    const user = await register({
      email: businessForm.email,
      password: businessForm.ownerPassword,
      name: businessForm.ownerName,
      role: 'owner',
      phone: businessForm.phone,
    });
    const userId = user.id;
    const company = createCompany({
      name: businessForm.name,
      ownerName: businessForm.ownerName,
      email: businessForm.email,
      phone: businessForm.phone,
      address: businessForm.address,
      industry: businessForm.industry,
      ownerId: userId,
      ownerPassword: businessForm.ownerPassword,
    });
    setCreatedCompany({
      id: company.id,
      name: company.name,
      email: company.email,
      ownerName: company.ownerName,
      phone: company.phone,
    });
    setShowBusiness(false);
    setShowSubscription(true);
  };

  const handleSubscribe = async () => {
    if (!createdCompany) return;
    await pay(selectedPlan, {
      companyId: createdCompany.id,
      companyName: createdCompany.name,
      email: createdCompany.email,
      ownerName: createdCompany.ownerName,
      phone: createdCompany.phone,
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm border border-[var(--border)]">
              <img src="/logo.png" alt="WorkForce Pro Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold gradient-text">WorkForce Pro</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/contact" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">Contact Us</Link>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[var(--border)]/50 transition-colors cursor-pointer">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <Link
              to="/superadmin/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              <Crown size={14} />
              Super Admin
            </Link>
            {currentUser ? (
              <Button onClick={() => navigate(currentUser.role === 'worker' ? '/worker' : '/dashboard')}>
                Dashboard ({currentUser.name})
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate('/login', { replace: true })}>Login</Button>
                <Button size="sm" onClick={() => navigate('/login?mode=register')}>Register</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 animate-gradient opacity-10" style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4, #7c3aed, #a855f7)' }} />
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-[var(--primary)]/10 blur-3xl animate-float" />
        <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-[var(--accent)]/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-sm text-[var(--primary)] mb-6">
              <Sparkles size={14} /> Premium Workforce Management
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-[var(--text)] leading-tight mb-6">
              <span className="animate-text-reveal">Manage Your Workforce</span> <br/>
              <span className="animate-text-reveal" style={{ animationDelay: '0.2s' }}><span className="gradient-text">Smarter</span></span>
            </h1>
            <p className="text-lg text-[var(--text-muted)] mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Assign tasks, track payments, manage workers, and grow your business efficiently.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={handleStartBusiness}>
                Start Business <ArrowRight size={18} />
              </Button>
              <Button variant="outline" size="lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Learn More
              </Button>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: 'Businesses', value: '500+' },
              { label: 'Workers Managed', value: '10K+' },
              { label: 'Tasks Completed', value: '50K+' },
              { label: 'Payments Processed', value: '₹2Cr+' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--text)] mb-3">Everything You Need</h2>
            <p className="text-[var(--text-muted)]">Powerful features to streamline your business operations</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-4 group-hover:gradient-bg transition-all">
                  <f.icon size={24} className="text-[var(--primary)] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text)] mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--text-muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-8 px-6 text-center text-sm text-[var(--text-muted)]">
        <p className="mb-2">© 2026 WorkForce Pro. All rights reserved.</p>
        <Link to="/contact" className="hover:text-[var(--primary)] transition-colors">Contact Support</Link>
      </footer>

      <Modal isOpen={showBusiness} onClose={() => { setShowBusiness(false); setBusinessError(''); }} title="Create Business">
        <div className="space-y-4">
          {businessError && <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">{businessError}</div>}
          <Input label="Business Name" value={businessForm.name} onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })} placeholder="Your business name" />
          <Input label="Owner Name" value={businessForm.ownerName} onChange={(e) => setBusinessForm({ ...businessForm, ownerName: e.target.value })} placeholder="Full name" />
          <Input
            label="Business Email"
            type="email"
            value={businessForm.email}
            onChange={(e) => { setBusinessForm({ ...businessForm, email: e.target.value }); clearEmailError(); setBusinessError(''); }}
            onBlur={() => { if (businessForm.email.trim()) void validateEmail(businessForm.email, { checkDeliverability: true }); }}
            error={emailError}
            placeholder="business@email.com"
          />
          <Input label="Phone Number" value={businessForm.phone} onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })} placeholder="+91 98765 43210" />
          <Input label="Business Address" value={businessForm.address} onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })} placeholder="Full address" />
          <Select label="Industry Type" options={industries} value={businessForm.industry} onChange={(e) => setBusinessForm({ ...businessForm, industry: e.target.value })} />
          <Input label="Owner Password" type="password" value={businessForm.ownerPassword} onChange={(e) => setBusinessForm({ ...businessForm, ownerPassword: e.target.value })} placeholder="Set a secure password" />
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={() => void handleCreateBusiness()} disabled={checking}>
              {checking ? 'Checking email…' : 'Continue'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowBusiness(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showSubscription} onClose={() => setShowSubscription(false)} title="Choose Your Plan" size="lg">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[
            { plan: 'trial' as const, price: '₹1', period: '/first mo', features: ['Full Access', 'OTP Verification', '30 Day Trial'], trial: true },
            { plan: 'monthly' as const, price: '₹799', period: '/month', features: ['Unlimited Tasks', 'Worker Management', 'Payment Tracking'] },
            { plan: 'yearly' as const, price: '₹4,999', period: '/year', features: ['Save More', 'Priority Support', 'Premium Features'], popular: true },
          ].map((p) => (
            <button
              key={p.plan}
              onClick={() => setSelectedPlan(p.plan)}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                selectedPlan === p.plan ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-[var(--primary)]/50'
              }`}
            >
              {p.popular && <span className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full gradient-bg text-white text-xs font-medium">Best Value</span>}
              <p className="text-sm text-[var(--text-muted)] capitalize">{p.plan} Plan</p>
              <p className="text-3xl font-bold text-[var(--text)] mt-1">{p.price}<span className="text-sm font-normal text-[var(--text-muted)]">{p.period}</span></p>
              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" /> {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
        <RazorpayStatus />
        {paymentError && (
          <p className="text-sm text-red-500 text-center mb-4">{paymentError}</p>
        )}
        <p className="text-xs text-[var(--text-muted)] text-center mb-4">
          Secure payment via Razorpay (UPI, cards, netbanking)
        </p>
        <div className="flex gap-3">
          <Button className="flex-1" onClick={handleSubscribe} disabled={paying || !createdCompany}>
            {paying ? 'Processing…' : 'Pay & Subscribe'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setShowSubscription(false)} disabled={paying}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}

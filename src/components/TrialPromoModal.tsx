import { useState, useEffect } from 'react';
import { Gift, Zap, CheckCircle, ShieldCheck } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useData, useCurrentUser, useCurrentCompany } from '../contexts/DataContext';
import { useSubscriptionPayment } from '../hooks/useSubscriptionPayment';
import { fireCelebration } from '../utils/confetti';

export function TrialPromoModal() {
  const { startTrial } = useData();
  const user = useCurrentUser();
  const company = useCurrentCompany();
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { pay, loading, error } = useSubscriptionPayment(async (_, companyId) => {
    startTrial(companyId);
    setIsSuccess(true);
    fireCelebration();
    setTimeout(() => {
      setIsOpen(false);
      setIsSuccess(false);
    }, 3000);
  });

  useEffect(() => {
    // Show trial promo if user is owner and company has no subscription
    if (user?.role === 'owner' && company && !company.subscription) {
      const shown = localStorage.getItem(`trial_promo_shown_${company.id}`);
      if (!shown) {
        const timer = setTimeout(() => setIsOpen(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [user, company]);

  const handleClose = () => {
    if (company) localStorage.setItem(`trial_promo_shown_${company.id}`, 'true');
    setIsOpen(false);
  };

  const handleActivate = async () => {
    if (!company) return;
    // We treat trial as a 'monthly' trigger but with ₹1 special handling in the backend API
    await pay('trial', {
      companyId: company.id,
      companyName: company.name,
      email: company.email,
      ownerName: company.ownerName,
      phone: company.phone,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" size="lg" hideClose={loading || isSuccess}>
      <div className="relative -mt-8 -mx-6 overflow-hidden pt-12 pb-8 px-6">
        <div className="absolute top-0 left-0 w-full h-full gradient-bg opacity-10 -z-10" />
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Zap size={120} className="text-[var(--primary)] rotate-12" />
        </div>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold uppercase tracking-wider">
            <Gift size={14} /> Special Welcome Offer
          </div>
          
          <h2 className="text-3xl font-bold text-[var(--text)] leading-tight">
            Get 1 Month Premium <br /> for just <span className="text-[var(--primary)]">₹1</span>
          </h2>
          
          <p className="text-[var(--text-muted)] max-w-sm mx-auto">
            Experience the full power of WorkForce Pro with all features unlocked. No commitments, cancel anytime.
          </p>

          <div className="grid grid-cols-2 gap-3 text-left my-8">
            {[
              'Unlimited Workers',
              'Advanced Reports',
              'Business Communication',
              'Priority Support',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-[var(--text)]">
                <CheckCircle size={16} className="text-green-500 shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-left space-y-2 mb-6">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
              <ShieldCheck size={18} /> Autopay Policy
            </div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/70 leading-relaxed">
              By activating the trial for ₹1, you agree to enable <strong>Autopay</strong>. After 30 days, your subscription will automatically renew at the regular monthly rate (₹799) to keep your features active.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
               onClick={handleActivate} 
               disabled={loading || isSuccess}
               className={`w-full py-4 text-lg font-bold transition-all ${!loading && !isSuccess ? 'glow-primary' : ''}`}
            >
              {isSuccess ? 'Trial Activated! ✓' : loading ? 'Redirecting to Gateway...' : 'Activate Trial for ₹1'}
            </Button>
            <button 
              onClick={handleClose}
              disabled={loading || isSuccess}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors underline decoration-dotted"
            >
              Maybe later, I'll explore first
            </button>
          </div>
          
          {error && <p className="text-xs text-red-500 mt-2 font-medium bg-red-500/5 py-2 rounded-lg">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}

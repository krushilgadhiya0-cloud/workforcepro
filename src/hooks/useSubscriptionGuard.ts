import { useNavigate } from 'react-router-dom';
import { useData, useCurrentCompany } from '../contexts/DataContext';

export function useSubscriptionGuard() {
  const navigate = useNavigate();
  const company = useCurrentCompany();
  const { currentUserId, users } = useData();
  const user = users.find(u => u.id === currentUserId);

  const checkSubscription = () => {
    // Super admins don't need subscriptions
    if (user?.role === 'superadmin') return true;

    // Workers don't need subscriptions (owners do)
    if (user?.role === 'worker') return true;

    // If it's an owner or admin, they need a company subscription
    if (!company?.subscription) {
      alert('Subscription Required! Please subscribe to a plan to unlock this feature.');
      navigate('/dashboard/owner-payments'); // Redirect to pricing page
      return false;
    }

    return true;
  };

  return { checkSubscription, isSubscribed: !!company?.subscription };
}

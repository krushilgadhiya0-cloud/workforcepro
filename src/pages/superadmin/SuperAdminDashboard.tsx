import { Link } from 'react-router-dom';
import { Building2, Users, CreditCard, IndianRupee, ListTodo, Shield, Activity, LogIn, UserPlus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '../../components/ui/Card';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { useData } from '../../contexts/DataContext';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function SuperAdminDashboard() {
  const { companies, workers, payments, tasks, users, admins, activities } = useData();

  const owners = users.filter((u) => u.role === 'owner');
  const subscriptionRevenue = companies.reduce((sum, c) => {
    if (!c.subscription) return sum;
    let price = c.subscriptionPrice;
    if (price === undefined || price === null) {
      if (c.subscription === 'trial') price = 1;
      else if (c.subscription === 'monthly') price = 799;
      else if (c.subscription === 'yearly') price = 4999;
      else price = 0;
    }
    return sum + price;
  }, 0);
  const duePayments = payments.filter((p) => p.status === 'due').length;

  const chartData = months.map((month, i) => ({
    month,
    companies: companies.filter((c) => new Date(c.createdAt).getMonth() === i).length,
    payments: payments.filter((p) => p.paidDate && new Date(p.paidDate).getMonth() === i).reduce((s, p) => s + p.amount, 0) / 1000,
  }));

  return (
    <div>
      <PageHeader title="Super Admin Dashboard" subtitle="Platform-wide overview of all companies and payments" showBack={false} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Companies" value={companies.length} icon={<Building2 size={22} className="text-[var(--primary)]" />} />
        <StatCard title="Total Owners" value={owners.length} icon={<Shield size={22} className="text-[var(--accent)]" />} />
        <StatCard title="Total Workers" value={workers.length} icon={<Users size={22} className="text-green-500" />} color="bg-green-500/10" />
        <StatCard title="Total Admins" value={admins.length} icon={<Shield size={22} className="text-purple-500" />} color="bg-purple-500/10" />
        <StatCard title="Total Tasks" value={tasks.length} icon={<ListTodo size={22} className="text-yellow-500" />} color="bg-yellow-500/10" />
        <StatCard title="Payments Due" value={duePayments} icon={<CreditCard size={22} className="text-red-500" />} color="bg-red-500/10" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard title="Subscription Revenue" value={`₹${subscriptionRevenue.toLocaleString('en-IN')}`} icon={<IndianRupee size={22} className="text-[var(--primary)]" />} trend="From all company plans" />
      </div>

      <div className="glass-card rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Platform Growth</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="saCompanies" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="saPayments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
            <YAxis stroke="var(--text-muted)" fontSize={12} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }} />
            <Area type="monotone" dataKey="companies" stroke="var(--primary)" fill="url(#saCompanies)" name="New Companies" />
            <Area type="monotone" dataKey="payments" stroke="var(--accent)" fill="url(#saPayments)" name="Payments (₹K)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text)]">Recent Activity</h3>
        <Link to="/superadmin/activity" className="text-sm text-[var(--primary)] font-medium hover:underline">
          View all
        </Link>
      </div>
      <div className="glass-card rounded-2xl divide-y divide-[var(--border)] mb-8">
        {activities.slice(0, 8).map((activity) => (
          <div key={activity.id} className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
              {activity.type === 'user_login' ? <LogIn size={16} className="text-[var(--primary)]" /> :
               activity.type === 'user_registered' ? <UserPlus size={16} className="text-[var(--primary)]" /> :
               <Activity size={16} className="text-[var(--primary)]" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text)] truncate">{activity.message}</p>
              <p className="text-xs text-[var(--text-muted)]">{new Date(activity.createdAt).toLocaleString()}</p>
            </div>
            <Badge status="in_progress" label={activity.userRole} />
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-center py-8 text-[var(--text-muted)] text-sm">No user activity yet</p>
        )}
      </div>

      <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Recent Companies</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.slice(-6).reverse().map((company) => (
          <div key={company.id} className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-[var(--text)]">{company.name}</h4>
              {company.subscription ? <Badge status="paid" label={company.subscription} /> : <Badge status="due" label="No plan" />}
            </div>
            <p className="text-sm text-[var(--text-muted)]">{company.ownerName} · {company.industry}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{company.email}</p>
          </div>
        ))}
        {companies.length === 0 && <p className="text-[var(--text-muted)] col-span-3 text-center py-8">No companies registered yet</p>}
      </div>
    </div>
  );
}

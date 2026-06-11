import { Building2, Users, CreditCard, IndianRupee, ListTodo, Shield } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '../../components/ui/Card';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { useData } from '../../contexts/DataContext';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function SuperAdminDashboard() {
  const { companies, workers, payments, tasks, users, admins } = useData();

  const owners = users.filter((u) => u.role === 'owner');
  const subscriptionRevenue = companies.reduce((sum, c) => {
    if (!c.subscription) return sum;
    return sum + (c.subscription === 'monthly' ? 799 : 4999);
  }, 0);
  const workerPaymentsTotal = payments.reduce((sum, p) => sum + (p.status === 'paid' ? p.amount : 0), 0);
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
        <StatCard title="Worker Payments (Paid)" value={`₹${workerPaymentsTotal.toLocaleString('en-IN')}`} icon={<IndianRupee size={22} className="text-[var(--accent)]" />} trend="Across all companies" />
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

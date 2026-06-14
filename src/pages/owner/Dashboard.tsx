import { Users, ListTodo, CheckCircle, AlertCircle, IndianRupee, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '../../components/ui/Card';
import { PageHeader } from '../../components/layout/PageHeader';
import { useData, useCurrentCompany } from '../../contexts/DataContext';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function OwnerDashboard() {
  const { workers, tasks, payments } = useData();
  const company = useCurrentCompany();

  const companyWorkers = workers.filter((w) => w.companyId === company?.id);
  const companyTasks = tasks.filter((t) => t.companyId === company?.id);
  const companyPayments = payments.filter((p) => p.companyId === company?.id);

  const pendingTasks = companyTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  const completedTasks = companyTasks.filter((t) => t.status === 'completed').length;
  const paymentsDue = companyPayments.filter((p) => p.status === 'due').length;
  const totalPaid = companyPayments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const monthlyRevenue = company?.monthlyRevenue ?? 0;

  const chartData = months.map((month, i) => {
    const monthTasks = companyTasks.filter((t) => new Date(t.createdAt).getMonth() === i);
    const monthPayments = companyPayments.filter((p) => p.paidDate && new Date(p.paidDate).getMonth() === i);
    return {
      month,
      tasks: monthTasks.length,
      revenue: monthPayments.reduce((s, p) => s + p.amount, 0) / 1000,
    };
  });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={company ? `${company.name} — Overview` : 'Select a company to view dashboard'}
        showBack={false}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Workers" value={<AnimatedCounter value={companyWorkers.length} />} icon={<Users size={22} className="text-[var(--primary)]" />} />
        <StatCard title="Pending Tasks" value={<AnimatedCounter value={pendingTasks} />} icon={<ListTodo size={22} className="text-yellow-500" />} color="bg-yellow-500/10" />
        <StatCard title="Completed Tasks" value={<AnimatedCounter value={completedTasks} />} icon={<CheckCircle size={22} className="text-green-500" />} color="bg-green-500/10" />
      </div>
-
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Payments Due" value={<AnimatedCounter value={paymentsDue} />} icon={<AlertCircle size={22} className="text-red-500" />} color="bg-red-500/10" />
        <StatCard title="Total Payments Made" value={<AnimatedCounter value={totalPaid} prefix="₹" />} icon={<IndianRupee size={22} className="text-[var(--primary)]" />} />
        <StatCard title="Monthly Revenue" value={<AnimatedCounter value={monthlyRevenue} prefix="₹" />} icon={<TrendingUp size={22} className="text-[var(--accent)]" />} trend={company?.monthlyRevenueUpdatedAt ? `Updated ${new Date(company.monthlyRevenueUpdatedAt).toLocaleDateString()}` : 'Set in Admin section'} />
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Monthly Progress</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
            <YAxis stroke="var(--text-muted)" fontSize={12} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }} />
            <Area type="monotone" dataKey="tasks" stroke="var(--primary)" fill="url(#colorTasks)" name="Tasks" />
            <Area type="monotone" dataKey="revenue" stroke="var(--accent)" fill="url(#colorRevenue)" name="Revenue (₹K)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

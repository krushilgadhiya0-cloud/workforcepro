import { ListTodo, CheckCircle, Clock, IndianRupee } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useData, useCurrentUser } from '../../contexts/DataContext';

export function WorkerDashboard() {
  const { tasks, workers, payments, updateTask } = useData();
  const user = useCurrentUser();

  const worker = workers.find((w) => w.userId === user?.id);
  const myTasks = tasks.filter((t) => t.workerId === worker?.id);
  const pending = myTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const completed = myTasks.filter((t) => t.status === 'completed');
  const myPayments = payments.filter((p) => p.workerId === worker?.id);
  const salaryStatus = myPayments.some((p) => p.status === 'due') ? 'Due' : myPayments.some((p) => p.status === 'paid') ? 'Paid' : 'No payments';

  const handleComplete = (taskId: string) => {
    updateTask(taskId, { status: 'completed' });
  };

  return (
    <div>
      <PageHeader title="My Dashboard" subtitle={`Welcome, ${user?.name || 'Worker'}`} showBack={false} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="My Tasks" value={myTasks.length} icon={<ListTodo size={22} className="text-[var(--primary)]" />} />
        <StatCard title="Completed Tasks" value={completed.length} icon={<CheckCircle size={22} className="text-green-500" />} color="bg-green-500/10" />
        <StatCard title="Pending Tasks" value={pending.length} icon={<Clock size={22} className="text-yellow-500" />} color="bg-yellow-500/10" />
        <StatCard title="Salary Status" value={salaryStatus} icon={<IndianRupee size={22} className="text-[var(--accent)]" />} />
      </div>

      <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Recent Tasks</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {pending.slice(0, 6).map((task) => (
          <div key={task.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-[var(--text)]">{task.title}</h4>
              <Badge status={task.priority} />
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-3">{task.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">Due: {task.deadline}</span>
              <Button size="sm" onClick={() => handleComplete(task.id)}>Mark As Done</Button>
            </div>
          </div>
        ))}
      </div>
      {pending.length === 0 && <p className="text-center py-8 text-[var(--text-muted)]">No pending tasks</p>}
    </div>
  );
}

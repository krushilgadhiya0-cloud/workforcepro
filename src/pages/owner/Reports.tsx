import { FileDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useData, useCurrentCompany } from '../../contexts/DataContext';
import { downloadReport } from '../../utils/pdf';

const COLORS = ['#2563eb', '#06b6d4', '#7c3aed', '#a855f7', '#f59e0b'];

export function Reports() {
  const { workers, tasks, payments } = useData();
  const company = useCurrentCompany();

  const companyWorkers = workers.filter((w) => w.companyId === company?.id);
  const companyTasks = tasks.filter((t) => t.companyId === company?.id);
  const companyPayments = payments.filter((p) => p.companyId === company?.id);
  const paymentData = companyPayments.map((p) => {
    const worker = companyWorkers.find((w) => w.id === p.workerId);
    return { name: worker?.name || 'Unknown', amount: p.amount };
  });

  const taskStatusData = [
    { name: 'Pending', value: companyTasks.filter((t) => t.status === 'pending').length },
    { name: 'In Progress', value: companyTasks.filter((t) => t.status === 'in_progress').length },
    { name: 'Completed', value: companyTasks.filter((t) => t.status === 'completed').length },
  ];

  const exportPaymentReport = (format: 'pdf' | 'excel') => {
    downloadReport('Monthly Payment Report',
      ['Worker', 'Amount', 'Status', 'Due Date'],
      companyPayments.map((p) => {
        const w = companyWorkers.find((w) => w.id === p.workerId);
        return [w?.name || '', `₹${p.amount}`, p.status, p.dueDate];
      }),
      format,
    );
  };

  const exportTaskReport = (format: 'pdf' | 'excel') => {
    downloadReport('Task Completion Report',
      ['Task', 'Worker', 'Status', 'Deadline'],
      companyTasks.map((t) => {
        const w = companyWorkers.find((w) => w.id === t.workerId);
        return [t.title, w?.name || '', t.status, t.deadline];
      }),
      format,
    );
  };

  const exportAttendanceReport = (format: 'pdf' | 'excel') => {
    downloadReport('Attendance Report',
      ['Worker', 'Department', 'Status'],
      companyWorkers.map((w) => [w.name, w.department, w.attendanceStatus]),
      format,
    );
  };

  const exportPerformanceReport = (format: 'pdf' | 'excel') => {
    downloadReport('Worker Performance Report',
      ['Worker', 'Tasks Assigned', 'Tasks Completed'],
      companyWorkers.map((w) => {
        const assigned = companyTasks.filter((t) => t.workerId === w.id).length;
        const completed = companyTasks.filter((t) => t.workerId === w.id && t.status === 'completed').length;
        return [w.name, String(assigned), String(completed)];
      }),
      format,
    );
  };

  const reports = [
    { title: 'Monthly Payment Report', export: exportPaymentReport },
    { title: 'Worker Performance Report', export: exportPerformanceReport },
    { title: 'Attendance Report', export: exportAttendanceReport },
    { title: 'Task Completion Report', export: exportTaskReport },
  ];

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Business insights and exports" showBack={false} />

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Payment Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={paymentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }} />
              <Bar dataKey="amount" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {taskStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {reports.map((report) => (
          <Card key={report.title} hover>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[var(--text)]">{report.title}</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  {report.title.includes('Payment') ? `${companyPayments.length} records` :
                   report.title.includes('Performance') ? `${companyWorkers.length} workers` :
                   report.title.includes('Attendance') ? `${companyWorkers.length} workers` :
                   `${companyTasks.length} tasks`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => report.export('pdf')}><FileDown size={14} /> PDF</Button>
                <Button size="sm" variant="outline" onClick={() => report.export('excel')}><FileDown size={14} /> Excel</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

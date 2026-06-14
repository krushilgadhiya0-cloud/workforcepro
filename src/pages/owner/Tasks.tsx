import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useData, useCurrentCompany } from '../../contexts/DataContext';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import type { Task, TaskPriority, TaskStatus } from '../../types';

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export function Tasks() {
  const { tasks, workers, addTask, updateTask, deleteTask } = useData();
  const company = useCurrentCompany();
  const { checkSubscription } = useSubscriptionGuard();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as TaskPriority, deadline: '', workerId: '', status: 'pending' as TaskStatus });

  const companyTasks = tasks.filter((t) => t.companyId === company?.id);
  const companyWorkers = workers.filter((w) => w.companyId === company?.id);
  const workerOptions = companyWorkers.map((w) => ({ value: w.id, label: w.name }));

  const filtered = companyTasks.filter((t) => {
    if (filter === 'pending') return t.status === 'pending' || t.status === 'in_progress';
    if (filter === 'completed') return t.status === 'completed';
    if (filter === 'overdue') return t.status !== 'completed' && new Date(t.deadline) < new Date();
    return true;
  });

  const getWorkerName = (id: string) => companyWorkers.find((w) => w.id === id)?.name || 'Unknown';

  const openAdd = () => {
    if (!checkSubscription()) return;
    setEditing(null);
    setForm({ title: '', description: '', priority: 'medium', deadline: '', workerId: workerOptions[0]?.value || '', status: 'pending' });
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setForm({ title: task.title, description: task.description, priority: task.priority, deadline: task.deadline, workerId: task.workerId, status: task.status });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!company) return;
    if (editing) {
      updateTask(editing.id, form);
    } else {
      addTask({ ...form, companyId: company.id });
    }
    setShowModal(false);
  };

  const tabs = [
    { key: 'all' as const, label: 'All', count: companyTasks.length },
    { key: 'pending' as const, label: 'Pending', count: companyTasks.filter((t) => t.status !== 'completed').length },
    { key: 'completed' as const, label: 'Completed', count: companyTasks.filter((t) => t.status === 'completed').length },
    { key: 'overdue' as const, label: 'Overdue', count: companyTasks.filter((t) => t.status !== 'completed' && new Date(t.deadline) < new Date()).length },
  ];

  return (
    <div>
      <PageHeader title="Task Management" subtitle="Assign and track tasks" action={<Button onClick={openAdd}><Plus size={18} /> Create Task</Button>} showBack={false} />

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setFilter(tab.key)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${filter === tab.key ? 'gradient-bg text-white' : 'bg-[var(--border)]/30 text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((task) => {
          const isOverdue = task.status !== 'completed' && new Date(task.deadline) < new Date();
          return (
            <div key={task.id} className={`glass-card rounded-2xl p-5 ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-[var(--text)]">{task.title}</h3>
                <Badge status={task.priority} />
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-3 line-clamp-2">{task.description}</p>
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-3">
                <span>Assigned: {getWorkerName(task.workerId)}</span>
                <span>Due: {task.deadline}</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge status={task.status} />
                <div className="flex gap-1">
                  <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg hover:bg-[var(--border)]/50 cursor-pointer"><Pencil size={14} /></button>
                  <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 cursor-pointer"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="text-center py-12 text-[var(--text-muted)]">No tasks found</p>}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Task' : 'Create Task'}>
        <div className="space-y-4">
          <Input label="Task Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Select label="Priority" options={priorityOptions} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })} />
          <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <Select label="Assign Worker" options={workerOptions.length ? workerOptions : [{ value: '', label: 'No workers' }]} value={form.workerId} onChange={(e) => setForm({ ...form, workerId: e.target.value })} />
          {editing && <Select label="Status" options={statusOptions} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })} />}
          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleSubmit}>{editing ? 'Update' : 'Create Task'}</Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

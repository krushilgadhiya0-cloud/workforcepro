import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useData, useCurrentUser } from '../../contexts/DataContext';

export function WorkerTasks() {
  const { tasks, workers, updateTask } = useData();
  const user = useCurrentUser();

  const worker = workers.find((w) => w.userId === user?.id);
  const myTasks = tasks.filter((t) => t.workerId === worker?.id);

  return (
    <div>
      <PageHeader title="My Tasks" subtitle={`${myTasks.length} total tasks`} showBack={false} />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myTasks.map((task) => (
          <div key={task.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-[var(--text)]">{task.title}</h4>
              <Badge status={task.priority} />
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-3">{task.description}</p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--text-muted)]">Due: {task.deadline}</span>
              <Badge status={task.status} />
            </div>
            {task.status !== 'completed' && (
              <Button size="sm" className="w-full" onClick={() => updateTask(task.id, { status: 'completed' })}>
                Mark As Done
              </Button>
            )}
          </div>
        ))}
      </div>
      {myTasks.length === 0 && <p className="text-center py-12 text-[var(--text-muted)]">No tasks assigned yet</p>}
    </div>
  );
}

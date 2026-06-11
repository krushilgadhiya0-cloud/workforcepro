import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useData, useCurrentCompany } from '../../contexts/DataContext';

export function Leaves() {
  const { leaves, workers, updateLeave } = useData();
  const company = useCurrentCompany();

  const companyLeaves = leaves.filter((l) => l.companyId === company?.id);
  const getWorkerName = (id: string) => workers.find((w) => w.id === id)?.name || 'Unknown';

  return (
    <div>
      <PageHeader title="Leave Requests" subtitle={`${companyLeaves.filter((l) => l.status === 'pending').length} pending requests`} showBack={false} />

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--border)]/20">
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Worker Name</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Leave Date</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Days</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Reason</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Status</th>
                <th className="text-right p-4 font-medium text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companyLeaves.map((leave) => (
                <tr key={leave.id} className="border-b border-[var(--border)] hover:bg-[var(--border)]/10">
                  <td className="p-4 font-medium">{getWorkerName(leave.workerId)}</td>
                  <td className="p-4 text-[var(--text-muted)]">{leave.leaveDate}</td>
                  <td className="p-4">{leave.days}</td>
                  <td className="p-4 text-[var(--text-muted)] max-w-xs truncate">{leave.reason}</td>
                  <td className="p-4"><Badge status={leave.status} /></td>
                  <td className="p-4 text-right">
                    {leave.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" onClick={() => updateLeave(leave.id, 'approved')}>Approve</Button>
                        <Button size="sm" variant="danger" onClick={() => updateLeave(leave.id, 'rejected')}>Reject</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {companyLeaves.length === 0 && <p className="text-center py-12 text-[var(--text-muted)]">No leave requests</p>}
        </div>
      </div>
    </div>
  );
}

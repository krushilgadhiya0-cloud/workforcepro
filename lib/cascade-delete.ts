import type { AppData } from '../src/types';

/** Collect every user account tied to a company (owner, admins, workers). */
export function getCompanyUserIds(data: AppData, companyId: string): Set<string> {
  const ids = new Set<string>();
  const company = data.companies.find((c) => c.id === companyId);
  if (company) ids.add(company.ownerId);
  for (const admin of data.admins) {
    if (admin.companyId === companyId) ids.add(admin.userId);
  }
  for (const worker of data.workers) {
    if (worker.companyId === companyId) ids.add(worker.userId);
  }
  for (const user of data.users) {
    if (user.companyId === companyId) ids.add(user.id);
  }
  return ids;
}

/** Remove a company and cascade-delete all staff, tasks, payments, etc. */
export function removeCompanyFromData(data: AppData, companyId: string): AppData {
  const d = { ...data };
  const userIds = getCompanyUserIds(d, companyId);

  d.companies = d.companies.filter((c) => c.id !== companyId);
  d.admins = d.admins.filter((a) => a.companyId !== companyId);
  d.workers = d.workers.filter((w) => w.companyId !== companyId);
  d.users = d.users.filter((u) => !userIds.has(u.id));
  d.tasks = d.tasks.filter((t) => t.companyId !== companyId);
  d.leaves = d.leaves.filter((l) => l.companyId !== companyId);
  d.payments = d.payments.filter((p) => p.companyId !== companyId);
  d.messages = d.messages.filter((m) => m.companyId !== companyId);
  d.dailyRevenue = d.dailyRevenue.filter((r) => r.companyId !== companyId);
  d.notifications = d.notifications.filter((n) => !userIds.has(n.userId));
  d.activities = d.activities.filter((a) => a.companyId !== companyId && !userIds.has(a.userId));
  d.privateMessages = d.privateMessages.filter(
    (m) => !userIds.has(m.senderId) && !userIds.has(m.receiverId),
  );

  if (d.currentCompanyId === companyId) d.currentCompanyId = null;
  if (d.currentUserId && userIds.has(d.currentUserId)) {
    d.currentUserId = null;
    d.currentCompanyId = null;
  }

  return d;
}

/** Remove a user and cascade-delete linked admin/worker/owner records. */
export function removeUserFromData(data: AppData, userId: string): AppData | null {
  const user = data.users.find((u) => u.id === userId);
  if (!user || user.role === 'superadmin') return null;

  let d = { ...data };

  if (user.role === 'owner') {
    const ownedCompanyIds = d.companies.filter((c) => c.ownerId === userId).map((c) => c.id);
    for (const companyId of ownedCompanyIds) {
      d = removeCompanyFromData(d, companyId);
    }
  } else if (user.role === 'admin') {
    d.admins = d.admins.filter((a) => a.userId !== userId);
  } else if (user.role === 'worker') {
    const worker = d.workers.find((w) => w.userId === userId);
    if (worker) {
      d = removeWorkerFromData(d, worker.id);
    }
  }

  d.users = d.users.filter((u) => u.id !== userId);
  d.notifications = d.notifications.filter((n) => n.userId !== userId);
  d.privateMessages = d.privateMessages.filter(
    (m) => m.senderId !== userId && m.receiverId !== userId,
  );

  if (d.currentUserId === userId) {
    d.currentUserId = null;
    d.currentCompanyId = null;
  }

  return d;
}

/** Remove a worker and their tasks, leaves, and payments. */
export function removeWorkerFromData(data: AppData, workerId: string): AppData {
  const d = { ...data };
  const worker = d.workers.find((w) => w.id === workerId);

  d.workers = d.workers.filter((w) => w.id !== workerId);
  d.tasks = d.tasks.filter((t) => t.workerId !== workerId);
  d.leaves = d.leaves.filter((l) => l.workerId !== workerId);
  d.payments = d.payments.filter((p) => p.workerId !== workerId);

  if (worker) {
    d.users = d.users.filter((u) => u.id !== worker.userId);
    d.notifications = d.notifications.filter((n) => n.userId !== worker.userId);
    if (d.currentUserId === worker.userId) {
      d.currentUserId = null;
      d.currentCompanyId = null;
    }
  }

  return d;
}

/** Remove an admin and their user account. */
export function removeAdminFromData(data: AppData, adminId: string): AppData | null {
  const admin = data.admins.find((a) => a.id === adminId);
  if (!admin) return null;

  const d = { ...data };
  d.admins = d.admins.filter((a) => a.id !== adminId);
  d.users = d.users.filter((u) => u.id !== admin.userId);
  d.notifications = d.notifications.filter((n) => n.userId !== admin.userId);

  if (d.currentUserId === admin.userId) {
    d.currentUserId = null;
    d.currentCompanyId = null;
  }

  return d;
}

import type {
  ActivityLog,
  Admin,
  AppData,
  AppSettings,
  CommunicationMessage,
  Company,
  DailyRevenue,
  LeaveRequest,
  Notification,
  Payment,
  PrivateMessage,
  Task,
  User,
  Worker,
} from '../src/types';
import { defaultAppData, normalizeAppData } from './data-sync.js';
import { supabaseAdmin } from './supabase.js';
import { ensureSuperAdminInData } from './super-admin.js';

const SETTINGS_ID = 'global';

let relationalModeCached: boolean | null = null;

export function isRelationalSupabaseEnabled(): boolean {
  const flag = process.env.USE_SUPABASE_RELATIONAL;
  if (flag === 'true' || flag === '1') return true;
  if (flag === 'false' || flag === '0') return false;
  return relationalModeCached === true;
}

/** Auto-enable relational mode after migration_meta is present. */
export async function resolveRelationalSupabaseMode(): Promise<boolean> {
  const flag = process.env.USE_SUPABASE_RELATIONAL;
  if (flag === 'true' || flag === '1') {
    relationalModeCached = true;
    return true;
  }
  if (flag === 'false' || flag === '0') {
    relationalModeCached = false;
    return false;
  }
  if (relationalModeCached !== null) return relationalModeCached;

  const meta = await getMigrationMeta();
  relationalModeCached = Boolean(meta?.migrated_at);
  return relationalModeCached;
}

export function resetRelationalModeCache(): void {
  relationalModeCached = null;
}

type Row = Record<string, unknown>;

function toIso(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  return new Date(value as string | number | Date).toISOString();
}

function toDateOnly(value: unknown): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (typeof value === 'string') return value.slice(0, 10);
  return new Date(value as string | number | Date).toISOString().slice(0, 10);
}

function rowToUser(row: Row): User {
  return {
    id: String(row.id),
    email: String(row.email),
    password: String(row.password),
    name: String(row.name),
    role: row.role as User['role'],
    companyId: row.company_id ? String(row.company_id) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    phoneVerified: Boolean(row.phone_verified),
    lastCommunicationReadAt: row.last_communication_read_at
      ? toIso(row.last_communication_read_at)
      : undefined,
    createdAt: toIso(row.created_at),
  };
}

function userToRow(user: User): Row {
  return {
    id: user.id,
    email: user.email,
    password: user.password,
    name: user.name,
    role: user.role,
    company_id: user.companyId ?? null,
    phone: user.phone ?? null,
    phone_verified: user.phoneVerified ?? false,
    last_communication_read_at: user.lastCommunicationReadAt ?? null,
    created_at: user.createdAt,
  };
}

function rowToCompany(row: Row): Company {
  return {
    id: String(row.id),
    name: String(row.name),
    ownerName: String(row.owner_name),
    email: String(row.email),
    phone: String(row.phone ?? ''),
    address: String(row.address ?? ''),
    industry: String(row.industry ?? ''),
    ownerId: String(row.owner_id),
    ownerPassword: String(row.owner_password ?? ''),
    subscription: row.subscription as Company['subscription'],
    subscriptionDate: row.subscription_date ? toIso(row.subscription_date) : null,
    subscriptionPrice: row.subscription_price != null ? Number(row.subscription_price) : undefined,
    hasUsedTrial: Boolean(row.has_used_trial),
    trialEndDate: row.trial_end_date ? toIso(row.trial_end_date) : undefined,
    monthlyRevenue: Number(row.monthly_revenue ?? 0),
    monthlyRevenueUpdatedAt: row.monthly_revenue_updated_at
      ? toIso(row.monthly_revenue_updated_at)
      : null,
    workerLabel: row.worker_label ? String(row.worker_label) : undefined,
    adminLabel: row.admin_label ? String(row.admin_label) : undefined,
    createdAt: toIso(row.created_at),
  };
}

function companyToRow(company: Company): Row {
  return {
    id: company.id,
    name: company.name,
    owner_name: company.ownerName,
    email: company.email,
    phone: company.phone,
    address: company.address,
    industry: company.industry,
    owner_id: company.ownerId,
    owner_password: company.ownerPassword,
    subscription: company.subscription,
    subscription_date: company.subscriptionDate,
    subscription_price: company.subscriptionPrice ?? null,
    has_used_trial: company.hasUsedTrial ?? false,
    trial_end_date: company.trialEndDate ?? null,
    monthly_revenue: company.monthlyRevenue,
    monthly_revenue_updated_at: company.monthlyRevenueUpdatedAt,
    worker_label: company.workerLabel ?? null,
    admin_label: company.adminLabel ?? null,
    created_at: company.createdAt,
  };
}

function rowToAdmin(row: Row): Admin {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone ?? ''),
    role: row.role as Admin['role'],
    customRoleName: row.custom_role_name ? String(row.custom_role_name) : undefined,
    userId: String(row.user_id),
    createdAt: toIso(row.created_at),
  };
}

function adminToRow(admin: Admin): Row {
  return {
    id: admin.id,
    company_id: admin.companyId,
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
    role: admin.role,
    custom_role_name: admin.customRoleName ?? null,
    user_id: admin.userId,
    created_at: admin.createdAt,
  };
}

function rowToWorker(row: Row): Worker {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone ?? ''),
    department: String(row.department ?? ''),
    designation: String(row.designation ?? ''),
    joiningDate: toDateOnly(row.joining_date),
    userId: String(row.user_id),
    attendanceStatus: row.attendance_status as Worker['attendanceStatus'],
    paymentUpiId: row.payment_upi_id ? String(row.payment_upi_id) : undefined,
    paymentQrUrl: row.payment_qr_url ? String(row.payment_qr_url) : undefined,
    createdAt: toIso(row.created_at),
  };
}

function workerToRow(worker: Worker): Row {
  return {
    id: worker.id,
    company_id: worker.companyId,
    user_id: worker.userId,
    name: worker.name,
    email: worker.email,
    phone: worker.phone,
    department: worker.department,
    designation: worker.designation,
    joining_date: worker.joiningDate,
    attendance_status: worker.attendanceStatus,
    payment_upi_id: worker.paymentUpiId ?? null,
    payment_qr_url: worker.paymentQrUrl ?? null,
    created_at: worker.createdAt,
  };
}

function rowToTask(row: Row): Task {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    title: String(row.title),
    description: String(row.description ?? ''),
    priority: row.priority as Task['priority'],
    deadline: toIso(row.deadline),
    workerId: String(row.employee_id),
    status: row.status as Task['status'],
    createdAt: toIso(row.created_at),
  };
}

function taskToRow(task: Task): Row {
  return {
    id: task.id,
    company_id: task.companyId,
    employee_id: task.workerId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    deadline: task.deadline,
    status: task.status,
    created_at: task.createdAt,
  };
}

function rowToLeave(row: Row): LeaveRequest {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    workerId: String(row.employee_id),
    leaveDate: toDateOnly(row.leave_date),
    days: Number(row.days ?? 1),
    reason: String(row.reason ?? ''),
    status: row.status as LeaveRequest['status'],
    createdAt: toIso(row.created_at),
  };
}

function leaveToRow(leave: LeaveRequest): Row {
  return {
    id: leave.id,
    company_id: leave.companyId,
    employee_id: leave.workerId,
    leave_date: leave.leaveDate,
    days: leave.days,
    reason: leave.reason,
    status: leave.status,
    created_at: leave.createdAt,
  };
}

function rowToPayment(row: Row): Payment {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    workerId: String(row.employee_id),
    amount: Number(row.amount ?? 0),
    dueDate: toDateOnly(row.due_date),
    status: row.status as Payment['status'],
    paymentMethod: row.payment_method as Payment['paymentMethod'],
    paidDate: row.paid_date ? toIso(row.paid_date) : undefined,
    transactionId: row.transaction_id ? String(row.transaction_id) : undefined,
    createdAt: toIso(row.created_at),
  };
}

function paymentToRow(payment: Payment): Row {
  return {
    id: payment.id,
    company_id: payment.companyId,
    employee_id: payment.workerId,
    amount: payment.amount,
    due_date: payment.dueDate,
    status: payment.status,
    payment_method: payment.paymentMethod ?? null,
    paid_date: payment.paidDate ?? null,
    transaction_id: payment.transactionId ?? null,
    created_at: payment.createdAt,
  };
}

function rowToNotification(row: Row): Notification {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    message: String(row.message),
    type: row.type as Notification['type'],
    read: Boolean(row.read),
    createdAt: toIso(row.created_at),
  };
}

function notificationToRow(notification: Notification): Row {
  return {
    id: notification.id,
    user_id: notification.userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: notification.read,
    created_at: notification.createdAt,
  };
}

function rowToActivity(row: Row): ActivityLog {
  return {
    id: String(row.id),
    type: row.type as ActivityLog['type'],
    userId: String(row.user_id),
    userName: String(row.user_name),
    userRole: row.user_role as ActivityLog['userRole'],
    companyId: row.company_id ? String(row.company_id) : undefined,
    companyName: row.company_name ? String(row.company_name) : undefined,
    message: String(row.message),
    createdAt: toIso(row.created_at),
  };
}

function activityToRow(activity: ActivityLog): Row {
  return {
    id: activity.id,
    type: activity.type,
    user_id: activity.userId,
    user_name: activity.userName,
    user_role: activity.userRole,
    company_id: activity.companyId ?? null,
    company_name: activity.companyName ?? null,
    message: activity.message,
    created_at: activity.createdAt,
  };
}

function rowToMessage(row: Row): CommunicationMessage {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    senderId: String(row.sender_id),
    senderName: String(row.sender_name),
    senderRole: row.sender_role as CommunicationMessage['senderRole'],
    content: String(row.content),
    createdAt: toIso(row.created_at),
    updatedAt: row.updated_at ? toIso(row.updated_at) : undefined,
    isDeleted: Boolean(row.is_deleted),
    readBy: Array.isArray(row.read_by) ? row.read_by.map(String) : [],
  };
}

function messageToRow(message: CommunicationMessage): Row {
  return {
    id: message.id,
    company_id: message.companyId,
    sender_id: message.senderId,
    sender_name: message.senderName,
    sender_role: message.senderRole,
    content: message.content,
    created_at: message.createdAt,
    updated_at: message.updatedAt ?? null,
    is_deleted: message.isDeleted ?? false,
    read_by: message.readBy ?? [],
  };
}

function rowToPrivateMessage(row: Row): PrivateMessage {
  return {
    id: String(row.id),
    senderId: String(row.sender_id),
    receiverId: String(row.receiver_id),
    content: String(row.content),
    createdAt: toIso(row.created_at),
    updatedAt: row.updated_at ? toIso(row.updated_at) : undefined,
    read: Boolean(row.read),
    readBy: Array.isArray(row.read_by) ? row.read_by.map(String) : [],
    isDeleted: Boolean(row.is_deleted),
  };
}

function privateMessageToRow(message: PrivateMessage): Row {
  return {
    id: message.id,
    sender_id: message.senderId,
    receiver_id: message.receiverId,
    content: message.content,
    created_at: message.createdAt,
    updated_at: message.updatedAt ?? null,
    read: message.read,
    read_by: message.readBy ?? [],
    is_deleted: message.isDeleted ?? false,
  };
}

function rowToDailyRevenue(row: Row): DailyRevenue {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    amount: Number(row.amount ?? 0),
    date: toDateOnly(row.date),
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: toIso(row.created_at),
  };
}

function dailyRevenueToRow(revenue: DailyRevenue): Row {
  return {
    id: revenue.id,
    company_id: revenue.companyId,
    amount: revenue.amount,
    date: revenue.date,
    notes: revenue.notes ?? null,
    created_at: revenue.createdAt,
  };
}

function rowToSettings(row: Row | null): AppSettings {
  if (!row) return { ...defaultAppData.settings };
  return {
    theme: (row.theme as AppSettings['theme']) ?? 'light',
    accentColor: row.accent_color as AppSettings['accentColor'],
    emailNotifications: row.email_notifications !== false,
    pushNotifications: row.push_notifications !== false,
  };
}

function settingsToRow(settings: AppSettings): Row {
  return {
    id: SETTINGS_ID,
    theme: settings.theme,
    accent_color: settings.accentColor ?? null,
    email_notifications: settings.emailNotifications,
    push_notifications: settings.pushNotifications,
    updated_at: new Date().toISOString(),
  };
}

export type AttendanceRecord = {
  id: string;
  companyId: string;
  employeeId: string;
  date: string;
  status: Worker['attendanceStatus'];
  createdAt: string;
};

function rowToAttendance(row: Row): AttendanceRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    employeeId: String(row.employee_id),
    date: toDateOnly(row.date),
    status: row.status as Worker['attendanceStatus'],
    createdAt: toIso(row.created_at),
  };
}

function attendanceToRow(record: AttendanceRecord): Row {
  return {
    id: record.id,
    company_id: record.companyId,
    employee_id: record.employeeId,
    date: record.date,
    status: record.status,
    created_at: record.createdAt,
  };
}

/** Build attendance rows from workers (current status as today's record). */
export function buildAttendanceFromWorkers(workers: Worker[]): AttendanceRecord[] {
  const today = new Date().toISOString().slice(0, 10);
  return workers.map((worker) => ({
    id: `att-${worker.id}-${today}`,
    companyId: worker.companyId,
    employeeId: worker.id,
    date: today,
    status: worker.attendanceStatus,
    createdAt: worker.createdAt,
  }));
}

function dedupeUsersByEmail(users: User[]): { users: User[]; idRemap: Map<string, string> } {
  const byEmail = new Map<string, User>();
  const idRemap = new Map<string, string>();

  for (const user of users) {
    const key = user.email.toLowerCase();
    const existing = byEmail.get(key);
    if (!existing) {
      byEmail.set(key, user);
      idRemap.set(user.id, user.id);
      continue;
    }

    const keep = new Date(user.createdAt) >= new Date(existing.createdAt) ? user : existing;
    const drop = keep.id === user.id ? existing : user;
    byEmail.set(key, keep);
    idRemap.set(drop.id, keep.id);
    idRemap.set(keep.id, keep.id);
  }

  return { users: Array.from(byEmail.values()), idRemap };
}

function remapId(idRemap: Map<string, string>, id: string): string {
  return idRemap.get(id) ?? id;
}

function normalizeForRelationalSave(data: AppData): AppData {
  const { users, idRemap } = dedupeUsersByEmail(data.users);
  const userIds = new Set(users.map((u) => u.id));

  const companies = data.companies
    .map((c) => ({ ...c, ownerId: remapId(idRemap, c.ownerId) }))
    .filter((c) => userIds.has(c.ownerId));

  const admins = data.admins
    .map((a) => ({ ...a, userId: remapId(idRemap, a.userId) }))
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
    .filter((a) => userIds.has(a.userId));

  const workers = data.workers
    .map((w) => ({ ...w, userId: remapId(idRemap, w.userId) }))
    .filter((w, i, arr) => arr.findIndex((x) => x.id === w.id) === i)
    .filter((w) => userIds.has(w.userId));

  const workerIds = new Set(workers.map((w) => w.id));
  const companyIds = new Set(companies.map((c) => c.id));

  return ensureSuperAdminInData({
    ...data,
    users,
    companies,
    admins: admins.filter((a) => companyIds.has(a.companyId)),
    workers: workers.filter((w) => companyIds.has(w.companyId)),
    tasks: data.tasks.filter((t) => workerIds.has(t.workerId) && companyIds.has(t.companyId)),
    leaves: data.leaves.filter((l) => workerIds.has(l.workerId) && companyIds.has(l.companyId)),
    payments: data.payments.filter((p) => workerIds.has(p.workerId) && companyIds.has(p.companyId)),
    notifications: data.notifications
      .map((n) => ({ ...n, userId: remapId(idRemap, n.userId) }))
      .filter((n) => userIds.has(n.userId)),
    activities: data.activities
      .map((a) => ({
        ...a,
        userId: remapId(idRemap, a.userId),
        companyId: a.companyId && companyIds.has(a.companyId) ? a.companyId : undefined,
      })),
    messages: data.messages
      .map((m) => ({ ...m, senderId: remapId(idRemap, m.senderId) }))
      .filter((m) => companyIds.has(m.companyId)),
    privateMessages: data.privateMessages.map((m) => ({
      ...m,
      senderId: remapId(idRemap, m.senderId),
      receiverId: remapId(idRemap, m.receiverId),
    })),
    dailyRevenue: data.dailyRevenue.filter((r) => companyIds.has(r.companyId)),
    currentUserId: data.currentUserId ? remapId(idRemap, data.currentUserId) : null,
    currentCompanyId: data.currentCompanyId,
  });
}

async function fetchAll<T>(table: string, map: (row: Row) => T): Promise<T[]> {
  const { data, error } = await supabaseAdmin.from(table).select('*');
  if (error) throw new Error(`Failed to load ${table}: ${error.message}`);
  return (data ?? []).map((row) => map(row as Row));
}

async function upsertRows<T extends { id: string }>(
  table: string,
  items: T[],
  toRow: (item: T) => Row,
): Promise<void> {
  const rows = items.map(toRow);
  if (rows.length === 0) return;
  const { error } = await supabaseAdmin.from(table).upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`Failed to upsert ${table}: ${error.message}`);
}

async function pruneRows(table: string, keepIds: Set<string>): Promise<void> {
  const { data: existing, error: selectError } = await supabaseAdmin.from(table).select('id');
  if (selectError) throw new Error(`Failed to read ${table} ids: ${selectError.message}`);

  const toDelete = (existing ?? [])
    .map((row) => String((row as Row).id))
    .filter((id) => !keepIds.has(id));

  if (toDelete.length === 0) return;

  const { error: deleteError } = await supabaseAdmin.from(table).delete().in('id', toDelete);
  if (deleteError) throw new Error(`Failed to prune ${table}: ${deleteError.message}`);
}

async function syncTable<T extends { id: string }>(
  table: string,
  items: T[],
  toRow: (item: T) => Row,
): Promise<void> {
  await upsertRows(table, items, toRow);
  await pruneRows(table, new Set(items.map((item) => item.id)));
}

export async function loadRelationalAppData(): Promise<AppData> {
  const [
    users,
    companies,
    admins,
    workers,
    tasks,
    leaves,
    payments,
    notifications,
    activities,
    messages,
    privateMessages,
    dailyRevenue,
    settingsRows,
  ] = await Promise.all([
    fetchAll('users', rowToUser),
    fetchAll('companies', rowToCompany),
    fetchAll('admins', rowToAdmin),
    fetchAll('employees', rowToWorker),
    fetchAll('tasks', rowToTask),
    fetchAll('leaves', rowToLeave),
    fetchAll('payments', rowToPayment),
    fetchAll('notifications', rowToNotification),
    fetchAll('activities', rowToActivity),
    fetchAll('communication_messages', rowToMessage),
    fetchAll('private_messages', rowToPrivateMessage),
    fetchAll('daily_revenue', rowToDailyRevenue),
    supabaseAdmin.from('app_settings').select('*').eq('id', SETTINGS_ID).maybeSingle(),
  ]);

  const settings = rowToSettings(settingsRows.data as Row | null);

  const appData: AppData = normalizeAppData({
    users,
    companies,
    admins,
    workers,
    tasks,
    leaves,
    payments,
    notifications,
    activities: activities.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
    messages: messages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
    privateMessages: privateMessages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
    dailyRevenue: dailyRevenue.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    ),
    settings,
    currentUserId: null,
    currentCompanyId: null,
  });

  return ensureSuperAdminInData(appData);
}

export async function saveRelationalAppData(data: AppData): Promise<AppData> {
  const normalized = normalizeForRelationalSave({
    ...data,
    currentUserId: null,
    currentCompanyId: null,
  });
  const finalData = { ...normalized, currentUserId: null, currentCompanyId: null };

  const attendance = buildAttendanceFromWorkers(finalData.workers);

  // Upsert phase (parents before children)
  const usersWithoutCompany = finalData.users.map((u) => ({ ...u, companyId: undefined }));
  await upsertRows('users', usersWithoutCompany, (u) => userToRow({ ...u, companyId: undefined }));
  await syncTable('companies', finalData.companies, companyToRow);
  await upsertRows('users', finalData.users, userToRow);
  await syncTable('admins', finalData.admins, adminToRow);
  await syncTable('employees', finalData.workers, workerToRow);
  await syncTable('tasks', finalData.tasks, taskToRow);
  await syncTable('attendance', attendance, attendanceToRow);
  await syncTable('leaves', finalData.leaves, leaveToRow);
  await syncTable('payments', finalData.payments, paymentToRow);
  await syncTable('notifications', finalData.notifications, notificationToRow);
  await syncTable('activities', finalData.activities, activityToRow);
  await syncTable('communication_messages', finalData.messages, messageToRow);
  await syncTable('private_messages', finalData.privateMessages, privateMessageToRow);
  await syncTable('daily_revenue', finalData.dailyRevenue, dailyRevenueToRow);

  // Prune users last — child tables must drop FK references first
  await pruneRows('users', new Set(finalData.users.map((u) => u.id)));

  const { error: settingsError } = await supabaseAdmin
    .from('app_settings')
    .upsert(settingsToRow(finalData.settings), { onConflict: 'id' });
  if (settingsError) throw new Error(`Failed to save settings: ${settingsError.message}`);

  return finalData;
}

/** Phase 2-3: populate relational tables from a JSON AppData blob. */
export async function importAppDataToRelationalTables(
  raw: Partial<AppData>,
  options: { markMigrated?: boolean } = {},
): Promise<AppData> {
  const data = ensureSuperAdminInData(normalizeAppData(raw));
  const saved = await saveRelationalAppData(data);

  if (options.markMigrated !== false) {
    const { error } = await supabaseAdmin.from('migration_meta').upsert({
      key: 'json_to_relational',
      value: {
        migrated_at: new Date().toISOString(),
        source: 'app_storage',
        users: data.users.length,
        employees: data.workers.length,
        tasks: data.tasks.length,
        payments: data.payments.length,
      },
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`Failed to record migration meta: ${error.message}`);
  }

  return saved;
}

export async function getMigrationMeta(): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabaseAdmin
    .from('migration_meta')
    .select('value')
    .eq('key', 'json_to_relational')
    .maybeSingle();

  if (error || !data) return null;
  return data.value as Record<string, unknown>;
}

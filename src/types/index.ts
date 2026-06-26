export type UserRole = 'owner' | 'admin' | 'worker' | 'superadmin';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'paid' | 'due' | 'pending';
export type SubscriptionPlan = 'trial' | 'monthly' | 'yearly';
export type AdminRole = 'manager' | 'hr' | 'supervisor' | 'finance';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  companyId?: string;
  phone?: string;
  phoneVerified?: boolean;
  lastCommunicationReadAt?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  industry: string;
  ownerId: string;
  ownerPassword: string;
  subscription: SubscriptionPlan | null;
  subscriptionDate: string | null;
  subscriptionPrice?: number;
  hasUsedTrial?: boolean;
  trialEndDate?: string;
  monthlyRevenue: number;
  monthlyRevenueUpdatedAt: string | null;
  workerLabel?: string;
  adminLabel?: string;
  createdAt: string;
}

export interface CommunicationMessage {
  id: string;
  companyId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface Admin {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  userId: string;
  createdAt: string;
}

export interface Worker {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  userId: string;
  attendanceStatus: 'present' | 'absent' | 'on_leave';
  createdAt: string;
}

export interface Task {
  id: string;
  companyId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  deadline: string;
  workerId: string;
  status: TaskStatus;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  companyId: string;
  workerId: string;
  leaveDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  companyId: string;
  workerId: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  paidDate?: string;
  transactionId?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'leave' | 'payment' | 'general';
  read: boolean;
  createdAt: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  accentColor?: 'indigo' | 'rose' | 'emerald' | 'amber' | 'violet' | 'slate';
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export type ActivityType =
  | 'user_registered'
  | 'user_login'
  | 'user_logout'
  | 'company_created'
  | 'worker_added'
  | 'admin_added'
  | 'subscription_started';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  userRole: UserRole;
  companyId?: string;
  companyName?: string;
  message: string;
  createdAt: string;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  read: boolean;
  isDeleted?: boolean;
}

export interface DailyRevenue {
  id: string;
  companyId: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface AppData {
  users: User[];
  companies: Company[];
  admins: Admin[];
  workers: Worker[];
  tasks: Task[];
  leaves: LeaveRequest[];
  payments: Payment[];
  notifications: Notification[];
  activities: ActivityLog[];
  messages: CommunicationMessage[];
  privateMessages: PrivateMessage[];
  dailyRevenue: DailyRevenue[];
  settings: AppSettings;
  currentUserId: string | null;
  currentCompanyId: string | null;
}

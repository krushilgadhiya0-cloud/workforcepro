-- Phase 1: Relational schema for WorkForce Pro
-- Run this in Supabase SQL Editor before migrating data.

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'worker', 'superadmin')),
  company_id TEXT,
  phone TEXT,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  last_communication_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  owner_password TEXT NOT NULL DEFAULT '',
  subscription TEXT,
  subscription_date TIMESTAMPTZ,
  subscription_price NUMERIC,
  has_used_trial BOOLEAN NOT NULL DEFAULT false,
  trial_end_date TIMESTAMPTZ,
  monthly_revenue NUMERIC NOT NULL DEFAULT 0,
  monthly_revenue_updated_at TIMESTAMPTZ,
  worker_label TEXT,
  admin_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_company_id_fkey;

ALTER TABLE users
  ADD CONSTRAINT users_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'manager',
  custom_role_name TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employees (maps to app "workers")
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  designation TEXT NOT NULL DEFAULT '',
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  attendance_status TEXT NOT NULL DEFAULT 'present'
    CHECK (attendance_status IN ('present', 'absent', 'on_leave')),
  payment_upi_id TEXT,
  payment_qr_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present'
    CHECK (status IN ('present', 'absent', 'on_leave')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, date)
);

CREATE TABLE IF NOT EXISTS leaves (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  days INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'due'
    CHECK (status IN ('paid', 'due', 'pending')),
  payment_method TEXT CHECK (payment_method IN ('online', 'cash')),
  paid_date TIMESTAMPTZ,
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general'
    CHECK (type IN ('task', 'leave', 'payment', 'general')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communication_messages (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  read_by JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS private_messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  read BOOLEAN NOT NULL DEFAULT false,
  read_by JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS daily_revenue (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  theme TEXT NOT NULL DEFAULT 'light',
  accent_color TEXT,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO app_settings (id)
VALUES ('global')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS migration_meta (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS employees_company_id_idx ON employees (company_id);
CREATE INDEX IF NOT EXISTS tasks_company_id_idx ON tasks (company_id);
CREATE INDEX IF NOT EXISTS tasks_employee_id_idx ON tasks (employee_id);
CREATE INDEX IF NOT EXISTS attendance_employee_date_idx ON attendance (employee_id, date);
CREATE INDEX IF NOT EXISTS payments_company_id_idx ON payments (company_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id);
CREATE INDEX IF NOT EXISTS leaves_employee_id_idx ON leaves (employee_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (enable when using Supabase Auth; service role bypasses)
-- ---------------------------------------------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

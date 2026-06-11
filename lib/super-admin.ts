import type { AppData } from '../src/types';

export const SUPER_ADMIN_ID = 'super-admin-system';

export function getSuperAdminCredentials(): { email: string; password: string } | null {
  const email = (
    process.env.SUPER_ADMIN_EMAIL
    ?? process.env.VITE_SUPER_ADMIN_EMAIL
    ?? ''
  ).trim();
  const password = (
    process.env.SUPER_ADMIN_PASSWORD
    ?? process.env.VITE_SUPER_ADMIN_PASSWORD
    ?? ''
  ).trim();

  if (!email || !password) return null;
  return { email, password };
}

export function ensureSuperAdminInData(data: AppData, creds?: { email: string; password: string } | null): AppData {
  const credentials = creds ?? getSuperAdminCredentials();
  if (!credentials) return data;

  const { email, password } = credentials;
  const idx = data.users.findIndex((u) => u.role === 'superadmin');

  if (idx === -1) {
    data.users.push({
      id: SUPER_ADMIN_ID,
      email,
      password,
      name: 'Super Admin',
      role: 'superadmin',
      createdAt: new Date().toISOString(),
    });
  } else {
    data.users[idx] = {
      ...data.users[idx],
      id: SUPER_ADMIN_ID,
      email,
      password,
      role: 'superadmin',
    };
  }

  return data;
}

export function matchesSuperAdminCredentials(email: string, password: string): boolean {
  const creds = getSuperAdminCredentials();
  if (!creds) return false;
  return creds.email.toLowerCase() === email.toLowerCase() && creds.password === password;
}

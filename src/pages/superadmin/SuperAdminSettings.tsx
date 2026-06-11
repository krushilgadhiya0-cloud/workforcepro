import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useData, useCurrentUser } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SUPER_ADMIN_EMAIL } from '../../utils/storage';

export function SuperAdminSettings() {
  const { changePassword, settings, updateSettings } = useData();
  const user = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  const handleChangePassword = () => {
    if (!user) return;
    if (passwords.new !== passwords.confirm) {
      setPasswordMsg('Passwords do not match');
      return;
    }
    const success = changePassword(user.id, passwords.old, passwords.new);
    setPasswordMsg(success ? 'Password updated successfully' : 'Incorrect current password');
    if (success) setPasswords({ old: '', new: '', confirm: '' });
  };

  return (
    <div>
      <PageHeader title="Super Admin Settings" subtitle="Manage platform admin account" showBack={false} />

      <div className="space-y-6 max-w-2xl">
        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Account Info</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email || SUPER_ADMIN_EMAIL}</p>
            <p><strong>Role:</strong> Super Admin</p>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Change Password</h3>
          <div className="space-y-4">
            <Input label="Current Password" type="password" value={passwords.old} onChange={(e) => setPasswords({ ...passwords, old: e.target.value })} />
            <Input label="New Password" type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} />
            <Input label="Confirm Password" type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
            {passwordMsg && <p className={`text-sm ${passwordMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{passwordMsg}</p>}
            <Button onClick={handleChangePassword}>Update Password</Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Theme</h3>
          <div className="flex gap-3">
            <button onClick={() => setTheme('light')} className={`flex-1 p-4 rounded-xl border-2 transition-all cursor-pointer ${theme === 'light' ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)]'}`}>
              <span className="text-2xl">☀️</span>
              <p className="text-sm font-medium mt-2">Light</p>
            </button>
            <button onClick={() => setTheme('dark')} className={`flex-1 p-4 rounded-xl border-2 transition-all cursor-pointer ${theme === 'dark' ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)]'}`}>
              <span className="text-2xl">🌙</span>
              <p className="text-sm font-medium mt-2">Dark</p>
            </button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Email Notifications</span>
              <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => updateSettings({ emailNotifications: e.target.checked })} className="w-5 h-5 accent-[var(--primary)]" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Push Notifications</span>
              <input type="checkbox" checked={settings.pushNotifications} onChange={(e) => updateSettings({ pushNotifications: e.target.checked })} className="w-5 h-5 accent-[var(--primary)]" />
            </label>
          </div>
        </Card>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useData, useCurrentUser } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';

export function WorkerSettings() {
  const { settings, updateSettings, changePassword } = useData();
  const user = useCurrentUser();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
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
      <PageHeader title="Settings" subtitle="Manage your preferences" showBack={false} />

      <div className="space-y-6 max-w-2xl">
        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Profile</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">Your worker account details. Contact your admin to update name or email.</p>
          <div className="space-y-3 text-sm">
            <p><span className="text-[var(--text-muted)]">Name:</span> <strong>{user?.name}</strong> — shown on tasks and leave requests</p>
            <p><span className="text-[var(--text-muted)]">Login Email:</span> <strong>{user?.email}</strong> — used to sign in</p>
            <p><span className="text-[var(--text-muted)]">Role:</span> <strong>Worker</strong></p>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Change Password</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">Update your personal login password.</p>
          <div className="space-y-4">
            <Input label="Current Password" type="password" value={passwords.old} onChange={(e) => setPasswords({ ...passwords, old: e.target.value })} />
            <Input label="New Password" type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} />
            <Input label="Confirm Password" type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
            {passwordMsg && <p className={`text-sm ${passwordMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{passwordMsg}</p>}
            <Button onClick={handleChangePassword}>Update Password</Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Theme & Appearance</h3>
          <div className="flex gap-3 mb-6">
            <button onClick={() => setTheme('light')} className={`flex-1 p-4 rounded-xl border-2 transition-all cursor-pointer ${theme === 'light' ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-inner' : 'border-[var(--border)] hover:bg-[var(--border)]/20'}`}>
              <span className="text-2xl">☀️</span>
              <p className="text-sm font-medium mt-2">Light</p>
            </button>
            <button onClick={() => setTheme('dark')} className={`flex-1 p-4 rounded-xl border-2 transition-all cursor-pointer ${theme === 'dark' ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-inner' : 'border-[var(--border)] hover:bg-[var(--border)]/20'}`}>
              <span className="text-2xl">🌙</span>
              <p className="text-sm font-medium mt-2">Dark</p>
            </button>
          </div>

          <p className="text-sm font-medium text-[var(--text)] mb-3">Accent Color</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { id: 'indigo', name: 'Indigo', color: 'bg-[#2563eb]' },
              { id: 'rose', name: 'Rose', color: 'bg-[#e11d48]' },
              { id: 'emerald', name: 'Emerald', color: 'bg-[#10b981]' },
              { id: 'amber', name: 'Amber', color: 'bg-[#f59e0b]' },
              { id: 'violet', name: 'Violet', color: 'bg-[#7c3aed]' },
              { id: 'slate', name: 'Slate', color: 'bg-[#334155]' },
            ].map((c) => (
              <button 
                key={c.id} 
                onClick={() => setAccentColor(c.id)}
                className="group flex flex-col items-center gap-2 cursor-pointer"
              >
                <div className={`w-8 h-8 rounded-full ${c.color} flex items-center justify-center transition-all duration-300 ring-offset-2 ${accentColor === c.id ? 'ring-2 ring-[var(--primary)] scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}>
                  {accentColor === c.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${accentColor === c.id ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>{c.name}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Notifications</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">Get alerts when tasks are assigned, leave is approved/rejected, or salary is paid.</p>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer gap-4">
              <div>
                <span className="text-sm block">Email Notifications</span>
                <span className="text-xs text-[var(--text-muted)]">Task and payment alerts by email (demo)</span>
              </div>
              <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => updateSettings({ emailNotifications: e.target.checked })} className="w-5 h-5 accent-[var(--primary)] shrink-0" />
            </label>
            <label className="flex items-center justify-between cursor-pointer gap-4">
              <div>
                <span className="text-sm block">In-App Notifications</span>
                <span className="text-xs text-[var(--text-muted)]">Updates in notification bell</span>
              </div>
              <input type="checkbox" checked={settings.pushNotifications} onChange={(e) => updateSettings({ pushNotifications: e.target.checked })} className="w-5 h-5 accent-[var(--primary)] shrink-0" />
            </label>
          </div>
        </Card>
      </div>
    </div>
  );
}

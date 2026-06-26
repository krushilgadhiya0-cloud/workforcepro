import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useData, useCurrentCompany, useCurrentUser } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PasswordStrengthMeter } from '../../components/ui/PasswordStrengthMeter';
import { validatePasswordStrength, type PasswordStrength } from '../../utils/password';


export function Settings() {
  const {
    settings, updateSettings, changePassword, companies,
  } = useData();
  const company = useCurrentCompany();
  const user = useCurrentUser();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const isOwner = user?.role === 'owner';

  const myCompanies = isOwner
    ? companies.filter((c) => c.ownerId === user?.id)
    : company ? [company] : [];

  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passStrength, setPassStrength] = useState<PasswordStrength>(validatePasswordStrength(''));

  const handleChangePassword = async () => {
    if (!user) return;
    setPasswordMsg('');
    if (!passwords.old || !passwords.new) {
      setPasswordMsg('Please fill in all password fields');
      return;
    }
    if (!passStrength.isValid) {
      setPasswordMsg('New password does not meet requirements');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordMsg('Passwords do not match');
      return;
    }
    try {
      const success = await changePassword(user.id, passwords.old, passwords.new);
      setPasswordMsg(success ? 'Password updated successfully' : 'Incorrect current password');
      if (success) setPasswords({ old: '', new: '', confirm: '' });
    } catch (err) {
      setPasswordMsg('Failed to update password. Cloud sync issue.');
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage account, security, and preferences" showBack={false} />

      <div className="space-y-6 max-w-2xl">
        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Change Password</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">Update your login password. Does not change worker or admin passwords.</p>
          <div className="space-y-4">
            <Input label="Current Password" type="password" value={passwords.old} onChange={(e) => setPasswords({ ...passwords, old: e.target.value })} />
            <div className="space-y-1">
              <Input 
                label="New Password" 
                type="password" 
                value={passwords.new} 
                onChange={(e) => {
                  setPasswords({ ...passwords, new: e.target.value });
                  setPassStrength(validatePasswordStrength(e.target.value));
                }} 
              />
              {passwords.new && <PasswordStrengthMeter strength={passStrength} />}
            </div>
            <Input label="Confirm Password" type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
            {passwordMsg && <p className={`text-sm ${passwordMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{passwordMsg}</p>}
            <Button onClick={handleChangePassword} disabled={passwords.new.length > 0 && !passStrength.isValid}>Update Password</Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Theme Settings</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">Saved automatically across all pages.</p>
          <div className="flex gap-3 mb-6">
            <button onClick={() => setTheme('light')} className={`flex-1 p-4 rounded-xl border-2 transition-all cursor-pointer ${theme === 'light' ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-inner' : 'border-[var(--border)] hover:bg-[var(--border)]/20'}`}>
              <span className="text-2xl">☀️</span>
              <p className="text-sm font-medium mt-2">Light Mode</p>
            </button>
            <button onClick={() => setTheme('dark')} className={`flex-1 p-4 rounded-xl border-2 transition-all cursor-pointer ${theme === 'dark' ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-inner' : 'border-[var(--border)] hover:bg-[var(--border)]/20'}`}>
              <span className="text-2xl">🌙</span>
              <p className="text-sm font-medium mt-2">Dark Mode</p>
            </button>
          </div>

          <p className="text-sm font-medium text-[var(--text)] mt-6 mb-3">UI Accent Color</p>
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
                <div className={`w-10 h-10 rounded-full ${c.color} flex items-center justify-center transition-all duration-300 ring-offset-2 ${accentColor === c.id ? 'ring-2 ring-[var(--primary)] scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}>
                  {accentColor === c.id && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${accentColor === c.id ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>{c.name}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Notification Settings</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">Saved automatically.</p>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer gap-4">
              <div>
                <span className="text-sm text-[var(--text)] block">Email Notifications</span>
                <span className="text-xs text-[var(--text-muted)]">Task, leave, and payment alerts by email (demo)</span>
              </div>
              <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => updateSettings({ emailNotifications: e.target.checked })} className="w-5 h-5 accent-[var(--primary)] shrink-0" />
            </label>
            <label className="flex items-center justify-between cursor-pointer gap-4">
              <div>
                <span className="text-sm text-[var(--text)] block">In-App Notifications</span>
                <span className="text-xs text-[var(--text-muted)]">Updates in notification bell and sidebar</span>
              </div>
              <input type="checkbox" checked={settings.pushNotifications} onChange={(e) => updateSettings({ pushNotifications: e.target.checked })} className="w-5 h-5 accent-[var(--primary)] shrink-0" />
            </label>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Manage Subscription</h3>
          <p className="text-xs text-[var(--text-muted)] mb-3">Platform plan for active business.</p>
          <p className="text-sm text-[var(--text-muted)]">
            Current plan: <strong className="text-[var(--text)]">{company?.subscription ? `${company.subscription} (₹${company.subscription === 'monthly' ? '799/mo' : '4,999/yr'})` : 'None'}</strong>
          </p>
          {company?.subscriptionDate && (
            <p className="text-xs text-[var(--text-muted)] mt-1">Subscribed: {new Date(company.subscriptionDate).toLocaleDateString()}</p>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Account Info</h3>
          <div className="space-y-2 text-sm mt-3">
            <p><span className="text-[var(--text-muted)]">Login Email:</span> <strong>{user?.email}</strong></p>
            <p><span className="text-[var(--text-muted)]">Role:</span> <strong className="capitalize">{user?.role}</strong></p>
            <p><span className="text-[var(--text-muted)]">Active Business:</span> <strong>{company?.name || 'None'}</strong></p>
            {isOwner && <p><span className="text-[var(--text-muted)]">Total Businesses:</span> <strong>{myCompanies.length}</strong></p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import { BackButton } from '../ui/BackButton';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  showBack?: boolean;
  backTo?: string;
}

export function PageHeader({ title, subtitle, action, showBack = true, backTo }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {showBack && <BackButton to={backTo} />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">{title}</h1>
          {subtitle && <p className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

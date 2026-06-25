import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div 
      className={`glass-card rounded-2xl p-5 ${hover ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number | ReactNode;
  icon: ReactNode;
  trend?: string;
  color?: string;
}

export function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  return (
    <Card hover className="animate-fade-in shimmer overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-1">{title}</p>
          <p className="text-2xl font-bold text-[var(--text)]">{value}</p>
          {trend && <p className="text-xs text-[var(--accent)] mt-1">{trend}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color || 'bg-[var(--primary)]/10'}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

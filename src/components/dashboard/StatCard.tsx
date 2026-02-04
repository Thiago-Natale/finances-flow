import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'danger';
  subtitle?: string;
}

export function StatCard({ title, value, icon: Icon, variant = 'default', subtitle }: StatCardProps) {
  const getIconStyles = () => {
    switch (variant) {
      case 'success':
        return 'from-success/20 to-success/10 text-success';
      case 'danger':
        return 'from-destructive/20 to-destructive/10 text-destructive';
      default:
        return 'from-primary/20 to-accent/10 text-primary';
    }
  };

  const getValueStyles = () => {
    switch (variant) {
      case 'success':
        return 'money-positive';
      case 'danger':
        return 'money-negative';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">{title}</p>
          <p className={`text-xl sm:text-2xl font-bold ${getValueStyles()} truncate`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>
          )}
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${getIconStyles()} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
}

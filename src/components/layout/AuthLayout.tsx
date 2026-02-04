import { ReactNode } from 'react';
import { TrendingUp } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 animate-float">
            <TrendingUp className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-muted-foreground mt-2">{subtitle}</p>
          )}
        </div>

        {/* Card */}
        <div className="glass-card p-6 sm:p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

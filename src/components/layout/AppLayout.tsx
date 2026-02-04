import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Main Content */}
      <main className="lg:ml-64 pt-20 lg:pt-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl pt-10 mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  Wallet, 
  Tags, 
  ArrowUpDown, 
  User, 
  LogOut,
  TrendingUp,
  Menu,
  Handshake,
  CalendarClock
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/perfil-financeiro', icon: Wallet, label: 'Perfil Financeiro' },
  { to: '/categorias', icon: Tags, label: 'Categorias' },
  { to: '/movimentacoes', icon: ArrowUpDown, label: 'Movimentações' },
  { to: '/emprestimos', icon: Handshake, label: 'Empréstimos' },
  { to: '/contas-recorrentes', icon: CalendarClock, label: 'Contas Recorrentes' },
  { to: '/minha-conta', icon: User, label: 'Minha Conta' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { usuario, signOut } = useAuth();

  const handleNavClick = () => {
    setOpen(false);
  };

  const handleSignOut = () => {
    setOpen(false);
    signOut();
  };

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="flex items-center justify-between p-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">Controla Aí</span>
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-2 rounded-xl hover:bg-secondary/50 transition-colors">
              <Menu className="w-6 h-6 text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0 glass-card border-l border-border/50">
            {/* User info */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {usuario?.nome_completo || 'Usuário'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{usuario?.login || 'usuario'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={handleNavClick}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border/50 mt-auto">
              <button
                onClick={handleSignOut}
                className="nav-item w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

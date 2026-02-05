import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Wallet, 
  Tags, 
  ArrowUpDown, 
  User, 
  LogOut,
  TrendingUp
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/perfil-financeiro', icon: Wallet, label: 'Perfil Financeiro' },
  { to: '/categorias', icon: Tags, label: 'Categorias' },
  { to: '/movimentacoes', icon: ArrowUpDown, label: 'Movimentações' },
  { to: '/minha-conta', icon: User, label: 'Minha Conta' },
];

export function Sidebar() {
  const location = useLocation();
  const { usuario, signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-card border-r border-border/50 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg text-foreground">Controla Aí</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info & Logout */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 mb-4 px-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {usuario?.nome_completo || 'Usuário'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              @{usuario?.login || 'usuario'}
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="nav-item w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

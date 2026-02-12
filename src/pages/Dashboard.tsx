import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { ComparisonChart } from '@/components/dashboard/ComparisonChart';
import { useDashboardData, formatCurrency, useMovimentacoes } from '@/hooks/useFinancialData';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, TrendingUp, TrendingDown, ArrowUpDown, Loader2, Handshake } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { usuario } = useAuth();
  const { data: dashboard, isLoading: loadingDashboard } = useDashboardData();
  const { data: movimentacoes, isLoading: loadingMovimentacoes } = useMovimentacoes();

  const recentMovimentacoes = movimentacoes?.slice(0, 5) || [];

  if (loadingDashboard) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6 sm:mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Olá, {usuario?.nome_completo?.split(' ')[0] || 'Usuário'}!
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Aqui está um resumo das suas finanças
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <StatCard
            title="Saldo Total"
            value={formatCurrency(dashboard?.saldoTotal || 0)}
            icon={Wallet}
            variant={dashboard?.saldoTotal && dashboard.saldoTotal >= 0 ? 'default' : 'danger'}
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <StatCard
            title="Ganhos do Mês"
            value={formatCurrency(dashboard?.ganhosMes || 0)}
            icon={TrendingUp}
            variant="success"
            subtitle="Entradas do mês atual"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <StatCard
            title="Gastos do Mês"
            value={formatCurrency(dashboard?.gastosMes || 0)}
            icon={TrendingDown}
            variant="danger"
            subtitle="Saídas do mês atual"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <StatCard
            title="Empréstimos"
            value={formatCurrency(dashboard?.emprestimosPendentes || 0)}
            icon={Handshake}
            variant={(dashboard?.emprestimosPendentes || 0) > 0 ? 'danger' : 'default'}
            subtitle={
              (dashboard?.emprestimosPendentes || 0) > 0
                ? 'Pendentes de pagamento'
                : 'Nenhum pendente'
            }
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div style={{ animationDelay: '0.4s' }}>
          <ExpenseChart />
        </div>
        <div style={{ animationDelay: '0.5s' }}>
          <ComparisonChart />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-4 sm:p-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Últimas Movimentações</h2>
          <Link
            to="/movimentacoes"
            className="text-primary hover:underline text-xs sm:text-sm font-medium"
          >
            Ver todas
          </Link>
        </div>

        {loadingMovimentacoes ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : recentMovimentacoes.length === 0 ? (
          <div className="text-center py-8">
            <ArrowUpDown className="w-10 sm:w-12 h-10 sm:h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm sm:text-base text-muted-foreground">Nenhuma movimentação registrada</p>
            <Link
              to="/movimentacoes"
              className="text-primary hover:underline text-sm font-medium mt-2 inline-block"
            >
              Adicionar movimentação
            </Link>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {recentMovimentacoes.map((mov, index) => (
              <div
                key={mov.id}
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors animate-slide-in"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    mov.categorias_financeiras?.tipo === 'entrada'
                      ? 'bg-success/20 text-success'
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {mov.categorias_financeiras?.tipo === 'entrada' ? (
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm sm:text-base truncate">
                      {mov.descricao || mov.categorias_financeiras?.nome || 'Movimentação'}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {mov.categorias_financeiras?.nome} • {new Date(mov.data_movimentacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <p className={`font-semibold text-sm sm:text-base shrink-0 ml-2 ${
                  mov.categorias_financeiras?.tipo === 'entrada'
                    ? 'money-positive'
                    : 'money-negative'
                }`}>
                  {mov.categorias_financeiras?.tipo === 'entrada' ? '+' : '-'}
                  {formatCurrency(Number(mov.valor))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

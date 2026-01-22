import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { useDashboardData, formatCurrency, useMovimentacoes } from '@/hooks/useFinancialData';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, TrendingUp, TrendingDown, ArrowUpDown, Loader2 } from 'lucide-react';
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
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">
          Olá, {usuario?.nome_completo?.split(' ')[0] || 'Usuário'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Aqui está um resumo das suas finanças
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Últimas Movimentações</h2>
          <Link
            to="/movimentacoes"
            className="text-primary hover:underline text-sm font-medium"
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
            <ArrowUpDown className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhuma movimentação registrada</p>
            <Link
              to="/movimentacoes"
              className="text-primary hover:underline text-sm font-medium mt-2 inline-block"
            >
              Adicionar movimentação
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentMovimentacoes.map((mov, index) => (
              <div
                key={mov.id}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors animate-slide-in"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    mov.categorias_financeiras?.tipo === 'entrada'
                      ? 'bg-success/20 text-success'
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {mov.categorias_financeiras?.tipo === 'entrada' ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {mov.descricao || mov.categorias_financeiras?.nome || 'Movimentação'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {mov.categorias_financeiras?.nome} • {new Date(mov.data_movimentacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <p className={`font-semibold ${
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

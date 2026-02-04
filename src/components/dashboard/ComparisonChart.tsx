import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useDashboardData, formatCurrency } from '@/hooks/useFinancialData';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function ComparisonChart() {
  const { data: dashboard, isLoading } = useDashboardData();

  const chartData = useMemo(() => {
    if (!dashboard) return [];
    
    const entradas = dashboard.ganhosMes || 0;
    const saidas = dashboard.gastosMes || 0;
    
    if (entradas === 0 && saidas === 0) return [];
    
    return [
      { name: 'Entradas', value: entradas, color: 'hsl(var(--success))' },
      { name: 'Saídas', value: saidas, color: 'hsl(var(--destructive))' },
    ];
  }, [dashboard]);

  const balance = (dashboard?.ganhosMes || 0) - (dashboard?.gastosMes || 0);
  const isPositive = balance >= 0;

  if (isLoading || chartData.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-4 sm:p-6 animate-fade-in">
      <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
        Balanço do Mês
      </h2>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius="90%"
                innerRadius="60%"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 w-full space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-success" />
              <span className="text-xs sm:text-sm text-muted-foreground">Entradas</span>
            </div>
            <span className="text-sm sm:text-base font-medium money-positive">
              {formatCurrency(dashboard?.ganhosMes || 0)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-destructive" />
              <span className="text-xs sm:text-sm text-muted-foreground">Saídas</span>
            </div>
            <span className="text-sm sm:text-base font-medium money-negative">
              {formatCurrency(dashboard?.gastosMes || 0)}
            </span>
          </div>

          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
                )}
                <span className="text-xs sm:text-sm font-medium text-foreground">Saldo</span>
              </div>
              <span className={`text-sm sm:text-base font-bold ${isPositive ? 'money-positive' : 'money-negative'}`}>
                {isPositive ? '+' : ''}{formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

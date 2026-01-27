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
      { name: 'Entradas', value: entradas, color: 'hsl(142, 76%, 36%)' },
      { name: 'Saídas', value: saidas, color: 'hsl(var(--destructive))' },
    ];
  }, [dashboard]);

  const balance = (dashboard?.ganhosMes || 0) - (dashboard?.gastosMes || 0);
  const isPositive = balance >= 0;

  if (isLoading || chartData.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Balanço do Mês
      </h2>

      <div className="flex items-center gap-6">
        <div className="w-[140px] h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                innerRadius={40}
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
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm text-muted-foreground">Entradas</span>
            </div>
            <span className="font-medium money-positive">
              {formatCurrency(dashboard?.ganhosMes || 0)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-sm text-muted-foreground">Saídas</span>
            </div>
            <span className="font-medium money-negative">
              {formatCurrency(dashboard?.gastosMes || 0)}
            </span>
          </div>

          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
                <span className="text-sm font-medium text-foreground">Saldo</span>
              </div>
              <span className={`font-bold ${isPositive ? 'money-positive' : 'money-negative'}`}>
                {isPositive ? '+' : ''}{formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

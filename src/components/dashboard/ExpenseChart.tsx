import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useMovimentacoes, formatCurrency } from '@/hooks/useFinancialData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
  'hsl(339, 82%, 51%)',
  'hsl(47, 96%, 53%)',
  'hsl(173, 80%, 40%)',
  'hsl(291, 64%, 42%)',
];

type FilterType = 'all' | 'entrada' | 'saida';
type PeriodType = 'current-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'year';

export function ExpenseChart() {
  const { data: movimentacoes, isLoading } = useMovimentacoes();
  const [filterType, setFilterType] = useState<FilterType>('saida');
  const [period, setPeriod] = useState<PeriodType>('current-month');

  const filteredData = useMemo(() => {
    if (!movimentacoes) return [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter by period
    const periodFiltered = movimentacoes.filter((mov) => {
      const movDate = new Date(mov.data_movimentacao);
      const movMonth = movDate.getMonth();
      const movYear = movDate.getFullYear();

      switch (period) {
        case 'current-month':
          return movMonth === currentMonth && movYear === currentYear;
        case 'last-month':
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return movMonth === lastMonth && movYear === lastMonthYear;
        case 'last-3-months':
          const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
          return movDate >= threeMonthsAgo;
        case 'last-6-months':
          const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);
          return movDate >= sixMonthsAgo;
        case 'year':
          return movYear === currentYear;
        default:
          return true;
      }
    });

    // Filter by type
    const typeFiltered = filterType === 'all' 
      ? periodFiltered 
      : periodFiltered.filter((mov) => mov.categorias_financeiras?.tipo === filterType);

    // Group by category
    const grouped = typeFiltered.reduce((acc, mov) => {
      const categoryName = mov.categorias_financeiras?.nome || 'Sem categoria';
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += Number(mov.valor);
      return acc;
    }, {} as Record<string, number>);

    // Convert to array for chart
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [movimentacoes, filterType, period]);

  const total = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.value, 0);
  }, [filteredData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.value)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-foreground">Distribuição Financeira</h2>
        <div className="flex flex-wrap gap-3">
          <Select value={filterType} onValueChange={(v: FilterType) => setFilterType(v)}>
            <SelectTrigger className="w-[140px] bg-secondary/50">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="saida">Saídas</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={period} onValueChange={(v: PeriodType) => setPeriod(v)}>
            <SelectTrigger className="w-[160px] bg-secondary/50">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Mês Atual</SelectItem>
              <SelectItem value="last-month">Mês Anterior</SelectItem>
              <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
              <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
          <p>Nenhuma movimentação encontrada</p>
          <p className="text-sm">para o período selecionado</p>
        </div>
      ) : (
        <>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={120}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {filteredData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  formatter={(value) => (
                    <span className="text-sm text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total:</span>
              <span className={`text-lg font-bold ${
                filterType === 'entrada' ? 'money-positive' : 
                filterType === 'saida' ? 'money-negative' : 'text-foreground'
              }`}>
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

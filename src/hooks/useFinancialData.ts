import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PerfilFinanceiro {
  id: string;
  usuario_id: string;
  renda_mensal: number;
  saldo_inicial: number;
  created_at: string;
  updated_at: string;
}

interface CategoriaFinanceira {
  id: string;
  usuario_id: string;
  nome: string;
  tipo: 'entrada' | 'saida';
  created_at: string;
}

interface MovimentacaoFinanceira {
  id: string;
  usuario_id: string;
  categoria_id: string;
  valor: number;
  data_movimentacao: string;
  descricao: string | null;
  created_at: string;
  categorias_financeiras?: CategoriaFinanceira;
}

interface DashboardData {
  saldoTotal: number;
  ganhosMes: number;
  gastosMes: number;
  saldoInicial: number;
}

export function usePerfilFinanceiro() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['perfil-financeiro', user?.id],
    queryFn: async (): Promise<PerfilFinanceiro | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('perfil_financeiro')
        .select('*')
        .eq('usuario_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useCategorias() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['categorias', user?.id],
    queryFn: async (): Promise<CategoriaFinanceira[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export function useMovimentacoes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['movimentacoes', user?.id],
    queryFn: async (): Promise<MovimentacaoFinanceira[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('movimentacoes_financeiras')
        .select(`
          *,
          categorias_financeiras (
            id,
            nome,
            tipo
          )
        `)
        .eq('usuario_id', user.id)
        .order('data_movimentacao', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export function useDashboardData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: async (): Promise<DashboardData> => {
      if (!user?.id) {
        return { saldoTotal: 0, ganhosMes: 0, gastosMes: 0, saldoInicial: 0 };
      }

      // Get perfil financeiro for saldo_inicial
      const { data: perfil } = await supabase
        .from('perfil_financeiro')
        .select('saldo_inicial')
        .eq('usuario_id', user.id)
        .maybeSingle();

      const saldoInicial = Number(perfil?.saldo_inicial) || 0;

      // Get all movimentacoes with categories
      const { data: movimentacoes } = await supabase
        .from('movimentacoes_financeiras')
        .select(`
          valor,
          data_movimentacao,
          categorias_financeiras (
            tipo
          )
        `)
        .eq('usuario_id', user.id);

      // Calculate totals
      let totalEntradas = 0;
      let totalSaidas = 0;
      let ganhosMes = 0;
      let gastosMes = 0;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      movimentacoes?.forEach((mov) => {
        const valor = Number(mov.valor);
        const tipo = mov.categorias_financeiras?.tipo;
        const dataMovimentacao = new Date(mov.data_movimentacao);
        const isCurrentMonth = 
          dataMovimentacao.getMonth() === currentMonth && 
          dataMovimentacao.getFullYear() === currentYear;

        if (tipo === 'entrada') {
          totalEntradas += valor;
          if (isCurrentMonth) ganhosMes += valor;
        } else if (tipo === 'saida') {
          totalSaidas += valor;
          if (isCurrentMonth) gastosMes += valor;
        }
      });

      const saldoTotal = saldoInicial + totalEntradas - totalSaidas;

      return {
        saldoTotal,
        ganhosMes,
        gastosMes,
        saldoInicial,
      };
    },
    enabled: !!user?.id,
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

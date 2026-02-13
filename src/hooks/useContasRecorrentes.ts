import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ContaRecorrente {
  id: string;
  usuario_id: string;
  nome: string;
  descricao: string | null;
  valor_total: number;
  categoria_id: string;
  is_assinatura: boolean;
  data_inicio: string;
  quantidade_parcelas: number | null;
  parcelas_pagas: number;
  dia_fechamento: number;
  ativo: boolean;
  created_at: string | null;
  updated_at: string | null;
  categorias_financeiras?: {
    id: string;
    nome: string;
    tipo: 'entrada' | 'saida';
  } | null;
}

interface CreateContaRecorrente {
  nome: string;
  descricao?: string;
  valor_total: number;
  categoria_id: string;
  is_assinatura: boolean;
  data_inicio?: string;
  quantidade_parcelas?: number;
  dia_fechamento: number;
}

export function useContasRecorrentes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contas-recorrentes', user?.id],
    queryFn: async (): Promise<ContaRecorrente[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('contas_recorrentes')
        .select(`*, categorias_financeiras (id, nome, tipo)`)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export function useCreateContaRecorrente() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conta: CreateContaRecorrente) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const { error } = await supabase.from('contas_recorrentes').insert({
        usuario_id: user.id,
        nome: conta.nome,
        descricao: conta.descricao || null,
        valor_total: conta.valor_total,
        categoria_id: conta.categoria_id,
        is_assinatura: conta.is_assinatura,
        data_inicio: conta.data_inicio || new Date().toISOString().split('T')[0],
        quantidade_parcelas: conta.is_assinatura ? null : conta.quantidade_parcelas,
        dia_fechamento: conta.dia_fechamento,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-recorrentes'] });
      toast.success('Conta recorrente criada!');
    },
    onError: () => toast.error('Erro ao criar conta recorrente'),
  });
}

export function useDeleteContaRecorrente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contas_recorrentes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-recorrentes'] });
      toast.success('Conta recorrente excluída!');
    },
    onError: () => toast.error('Erro ao excluir conta recorrente'),
  });
}

export function useToggleContaRecorrenteAtivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('contas_recorrentes')
        .update({ ativo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-recorrentes'] });
      toast.success('Status atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });
}

export function useProcessarContasRecorrentes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      // Get active contas recorrentes
      const { data: contas } = await supabase
        .from('contas_recorrentes')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true);

      if (!contas || contas.length === 0) return;

      const today = new Date();

      for (const conta of contas) {
        // For installments, check if all parcelas are paid
        if (!conta.is_assinatura && conta.quantidade_parcelas && conta.parcelas_pagas >= conta.quantidade_parcelas) {
          continue;
        }

        const dataInicio = new Date(conta.data_inicio);
        
        // Calculate how many months should have entries since data_inicio
        let monthCursor = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), conta.dia_fechamento);
        if (monthCursor < dataInicio) {
          monthCursor.setMonth(monthCursor.getMonth() + 1);
        }

        // Check existing entries for this conta
        const { data: existingEntries } = await supabase
          .from('movimentacoes_financeiras')
          .select('parcela_numero, data_movimentacao')
          .eq('conta_recorrente_id', conta.id);

        const existingDates = new Set(
          (existingEntries || []).map(e => e.data_movimentacao)
        );

        let parcelasProcessadas = existingEntries?.length || 0;
        const valorParcela = conta.is_assinatura
          ? Number(conta.valor_total)
          : Number(conta.valor_total) / (conta.quantidade_parcelas || 1);

        let newEntries: any[] = [];

        while (monthCursor <= today) {
          if (!conta.is_assinatura && conta.quantidade_parcelas && parcelasProcessadas >= conta.quantidade_parcelas) {
            break;
          }

          const dateStr = monthCursor.toISOString().split('T')[0];

          if (!existingDates.has(dateStr)) {
            const parcelaNum = parcelasProcessadas + 1;
            const descricao = conta.is_assinatura
              ? `${conta.nome} - Assinatura`
              : `${conta.nome} - Parcela ${parcelaNum}/${conta.quantidade_parcelas}`;

            newEntries.push({
              usuario_id: user.id,
              categoria_id: conta.categoria_id,
              valor: Math.round(valorParcela * 100) / 100,
              data_movimentacao: dateStr,
              descricao,
              conta_recorrente_id: conta.id,
              parcela_numero: parcelaNum,
            });
            parcelasProcessadas++;
          }

          monthCursor.setMonth(monthCursor.getMonth() + 1);
        }

        if (newEntries.length > 0) {
          await supabase.from('movimentacoes_financeiras').insert(newEntries);
          await supabase
            .from('contas_recorrentes')
            .update({ parcelas_pagas: parcelasProcessadas })
            .eq('id', conta.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-recorrentes'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDiaFechamentoPadrao() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dia-fechamento-padrao', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 1;
      const { data } = await supabase
        .from('perfil_financeiro')
        .select('dia_fechamento_padrao')
        .eq('usuario_id', user.id)
        .maybeSingle();
      return data?.dia_fechamento_padrao ?? 1;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateDiaFechamentoPadrao() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dia: number) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const { error } = await supabase
        .from('perfil_financeiro')
        .update({ dia_fechamento_padrao: dia })
        .eq('usuario_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dia-fechamento-padrao'] });
      toast.success('Data de fechamento padrão atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar data de fechamento'),
  });
}

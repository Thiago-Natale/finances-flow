import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Emprestimo {
  id: string;
  usuario_id: string;
  nome: string;
  valor: number;
  data_criacao: string;
  data_pagamento: string | null;
  status: 'pendente' | 'pago';
  created_at: string | null;
  updated_at: string | null;
}

export function useEmprestimos() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['emprestimos', user?.id],
    queryFn: async (): Promise<Emprestimo[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('emprestimos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Emprestimo[]) || [];
    },
    enabled: !!user?.id,
  });
}

export function useEmprestimosPendentes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['emprestimos-pendentes', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;

      const { data, error } = await supabase
        .from('emprestimos')
        .select('valor')
        .eq('usuario_id', user.id)
        .eq('status', 'pendente');

      if (error) throw error;
      return (data || []).reduce((sum, e) => sum + Number(e.valor), 0);
    },
    enabled: !!user?.id,
  });
}

export function useCreateEmprestimo() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nome: string; valor: number; data_pagamento?: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('emprestimos').insert({
        usuario_id: user.id,
        nome: data.nome,
        valor: data.valor,
        data_pagamento: data.data_pagamento || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
      queryClient.invalidateQueries({ queryKey: ['emprestimos-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Empréstimo criado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao criar empréstimo');
    },
  });
}

export function useUpdateEmprestimoStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pendente' | 'pago' }) => {
      const { error } = await supabase
        .from('emprestimos')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
      queryClient.invalidateQueries({ queryKey: ['emprestimos-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Status atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });
}

export function useDeleteEmprestimo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('emprestimos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
      queryClient.invalidateQueries({ queryKey: ['emprestimos-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Empréstimo excluído');
    },
    onError: () => {
      toast.error('Erro ao excluir empréstimo');
    },
  });
}

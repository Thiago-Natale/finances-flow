import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePerfilFinanceiro, formatCurrency } from '@/hooks/useFinancialData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Wallet, Save, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function PerfilFinanceiro() {
  const { user } = useAuth();
  const { data: perfil, isLoading } = usePerfilFinanceiro();
  const [rendaMensal, setRendaMensal] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (perfil) {
      setRendaMensal(String(perfil.renda_mensal || ''));
      setSaldoInicial(String(perfil.saldo_inicial || ''));
    }
  }, [perfil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !perfil?.id) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('perfil_financeiro')
        .update({
          renda_mensal: parseFloat(rendaMensal) || 0,
          saldo_inicial: parseFloat(saldoInicial) || 0,
        })
        .eq('id', perfil.id);

      if (error) throw error;

      toast.success('Perfil financeiro atualizado!');
      queryClient.invalidateQueries({ queryKey: ['perfil-financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (error) {
      toast.error('Erro ao salvar perfil financeiro');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
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
        <h1 className="text-3xl font-bold text-foreground">Perfil Financeiro</h1>
        <p className="text-muted-foreground mt-1">
          Configure sua renda e saldo inicial
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Dados Financeiros</h2>
              <p className="text-sm text-muted-foreground">
                Essas informações são usadas para calcular seu saldo
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="renda" className="text-foreground/80">
                Renda Mensal
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="renda"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={rendaMensal}
                  onChange={(e) => setRendaMensal(e.target.value)}
                  className="glass-input pl-12"
                  disabled={saving}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Sua renda média mensal estimada
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saldo" className="text-foreground/80">
                Saldo Inicial
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="saldo"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                  className="glass-input pl-12"
                  disabled={saving}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Seu saldo atual antes de começar a registrar movimentações
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="btn-gradient"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="glass-card p-6 mt-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-medium text-foreground mb-2">💡 Como funciona</h3>
          <p className="text-sm text-muted-foreground">
            O <strong>Saldo Inicial</strong> é o ponto de partida para calcular seu saldo total. 
            A partir dele, todas as suas movimentações (entradas e saídas) são somadas ou subtraídas 
            para mostrar seu saldo atual no Dashboard.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

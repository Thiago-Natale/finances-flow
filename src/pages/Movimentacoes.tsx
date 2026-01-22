import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMovimentacoes, useCategorias, formatCurrency } from '@/hooks/useFinancialData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowUpDown, Plus, Trash2, Loader2, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Movimentacoes() {
  const { user } = useAuth();
  const { data: movimentacoes, isLoading } = useMovimentacoes();
  const { data: categorias } = useCategorias();
  const [categoriaId, setCategoriaId] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !categoriaId || !valor) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('movimentacoes_financeiras')
        .insert({
          usuario_id: user.id,
          categoria_id: categoriaId,
          valor: parseFloat(valor),
          data_movimentacao: data,
          descricao: descricao.trim() || null,
        });

      if (error) throw error;

      toast.success('Movimentação registrada!');
      setCategoriaId('');
      setValor('');
      setData(new Date().toISOString().split('T')[0]);
      setDescricao('');
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (error) {
      toast.error('Erro ao registrar movimentação');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('movimentacoes_financeiras')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Movimentação excluída!');
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (error) {
      toast.error('Erro ao excluir movimentação');
    }
  };

  const categoriasEntrada = categorias?.filter(c => c.tipo === 'entrada') || [];
  const categoriasSaida = categorias?.filter(c => c.tipo === 'saida') || [];

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
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Movimentações</h1>
          <p className="text-muted-foreground mt-1">
            Registre suas entradas e saídas financeiras
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient" disabled={!categorias?.length}>
              <Plus className="w-5 h-5 mr-2" />
              Nova Movimentação
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card-strong">
            <DialogHeader>
              <DialogTitle>Nova Movimentação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasEntrada.length > 0 && (
                      <>
                        <SelectItem value="header-entrada" disabled>
                          <span className="text-xs text-success font-medium">ENTRADAS</span>
                        </SelectItem>
                        {categoriasEntrada.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-success" />
                              {cat.nome}
                            </span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {categoriasSaida.length > 0 && (
                      <>
                        <SelectItem value="header-saida" disabled>
                          <span className="text-xs text-destructive font-medium">SAÍDAS</span>
                        </SelectItem>
                        {categoriasSaida.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              <TrendingDown className="w-4 h-4 text-destructive" />
                              {cat.nome}
                            </span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      R$
                    </span>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0,00"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      className="glass-input pl-12"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="glass-input"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Textarea
                  id="descricao"
                  placeholder="Detalhes da movimentação..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="glass-input resize-none"
                  rows={3}
                  disabled={saving}
                />
              </div>

              <Button
                type="submit"
                className="w-full btn-gradient"
                disabled={saving || !categoriaId || !valor}
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Plus className="w-5 h-5 mr-2" />
                )}
                Registrar Movimentação
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert if no categories */}
      {(!categorias || categorias.length === 0) && (
        <div className="glass-card p-6 mb-6 border-warning/50 animate-fade-in">
          <p className="text-foreground mb-2">
            <strong>⚠️ Crie categorias primeiro</strong>
          </p>
          <p className="text-muted-foreground text-sm mb-4">
            Para registrar movimentações, você precisa ter pelo menos uma categoria cadastrada.
          </p>
          <Link to="/categorias">
            <Button className="btn-gradient">
              Ir para Categorias
            </Button>
          </Link>
        </div>
      )}

      {/* Movimentações List */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {movimentacoes?.length === 0 ? (
          <div className="text-center py-12">
            <ArrowUpDown className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg mb-2">Nenhuma movimentação registrada</p>
            <p className="text-muted-foreground text-sm">
              Clique em "Nova Movimentação" para começar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {movimentacoes?.map((mov, index) => (
              <div
                key={mov.id}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors animate-slide-in"
                style={{ animationDelay: `${0.05 * index}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    mov.categorias_financeiras?.tipo === 'entrada'
                      ? 'bg-success/20 text-success'
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {mov.categorias_financeiras?.tipo === 'entrada' ? (
                      <TrendingUp className="w-6 h-6" />
                    ) : (
                      <TrendingDown className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {mov.descricao || mov.categorias_financeiras?.nome || 'Movimentação'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        mov.categorias_financeiras?.tipo === 'entrada'
                          ? 'badge-entrada'
                          : 'badge-saida'
                      }`}>
                        {mov.categorias_financeiras?.nome}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(mov.data_movimentacao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`text-lg font-bold ${
                    mov.categorias_financeiras?.tipo === 'entrada'
                      ? 'money-positive'
                      : 'money-negative'
                  }`}>
                    {mov.categorias_financeiras?.tipo === 'entrada' ? '+' : '-'}
                    {formatCurrency(Number(mov.valor))}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(mov.id)}
                    className="h-10 w-10 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

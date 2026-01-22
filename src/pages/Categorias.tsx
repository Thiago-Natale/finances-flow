import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCategorias } from '@/hooks/useFinancialData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Tags, Plus, Trash2, Loader2, TrendingUp, TrendingDown, Edit2, X, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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

export default function Categorias() {
  const { user } = useAuth();
  const { data: categorias, isLoading } = useCategorias();
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('saida');
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !nome.trim()) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('categorias_financeiras')
        .insert({
          usuario_id: user.id,
          nome: nome.trim(),
          tipo,
        });

      if (error) throw error;

      toast.success('Categoria criada!');
      setNome('');
      setTipo('saida');
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    } catch (error) {
      toast.error('Erro ao criar categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categorias_financeiras')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.message.includes('violates foreign key constraint')) {
          toast.error('Não é possível excluir: categoria tem movimentações vinculadas');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Categoria excluída!');
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    } catch (error) {
      toast.error('Erro ao excluir categoria');
    }
  };

  const handleEdit = async (id: string) => {
    if (!editNome.trim()) return;

    try {
      const { error } = await supabase
        .from('categorias_financeiras')
        .update({ nome: editNome.trim() })
        .eq('id', id);

      if (error) throw error;

      toast.success('Categoria atualizada!');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    } catch (error) {
      toast.error('Erro ao atualizar categoria');
    }
  };

  const startEditing = (id: string, currentNome: string) => {
    setEditingId(id);
    setEditNome(currentNome);
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
          <h1 className="text-3xl font-bold text-foreground">Categorias</h1>
          <p className="text-muted-foreground mt-1">
            Organize suas movimentações por categorias
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient">
              <Plus className="w-5 h-5 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card-strong">
            <DialogHeader>
              <DialogTitle>Nova Categoria</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Categoria</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Alimentação"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="glass-input"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as 'entrada' | 'saida')}>
                  <SelectTrigger className="glass-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-success" />
                        Entrada (Ganho)
                      </span>
                    </SelectItem>
                    <SelectItem value="saida">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-destructive" />
                        Saída (Gasto)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full btn-gradient"
                disabled={saving || !nome.trim()}
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Plus className="w-5 h-5 mr-2" />
                )}
                Criar Categoria
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categorias de Entrada */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Entradas</h2>
          </div>

          {categoriasEntrada.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma categoria de entrada</p>
          ) : (
            <div className="space-y-2">
              {categoriasEntrada.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(cat.id)}
                        className="h-8 w-8 p-0 text-success"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">{cat.nome}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(cat.id, cat.nome)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(cat.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categorias de Saída */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Saídas</h2>
          </div>

          {categoriasSaida.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma categoria de saída</p>
          ) : (
            <div className="space-y-2">
              {categoriasSaida.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(cat.id)}
                        className="h-8 w-8 p-0 text-success"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">{cat.nome}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(cat.id, cat.nome)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(cat.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

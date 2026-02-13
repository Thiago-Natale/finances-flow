import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  useContasRecorrentes,
  useCreateContaRecorrente,
  useDeleteContaRecorrente,
  useToggleContaRecorrenteAtivo,
  useProcessarContasRecorrentes,
  useDiaFechamentoPadrao,
  useUpdateDiaFechamentoPadrao,
} from '@/hooks/useContasRecorrentes';
import { useCategorias } from '@/hooks/useFinancialData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/hooks/useFinancialData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Plus, Search, Loader2, Trash2, RefreshCw, CalendarClock,
  Pause, Play, Settings2
} from 'lucide-react';
import { toast } from 'sonner';

export default function ContasRecorrentes() {
  const { user } = useAuth();
  const { data: contas, isLoading } = useContasRecorrentes();
  const { data: categorias } = useCategorias();
  const { data: diaFechamentoPadrao } = useDiaFechamentoPadrao();
  const createMutation = useCreateContaRecorrente();
  const deleteMutation = useDeleteContaRecorrente();
  const toggleAtivoMutation = useToggleContaRecorrenteAtivo();
  const processarMutation = useProcessarContasRecorrentes();
  const updateDiaMutation = useUpdateDiaFechamentoPadrao();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo'>('all');

  // Form state
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [categoriaInput, setCategoriaInput] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [isAssinatura, setIsAssinatura] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [qtdParcelas, setQtdParcelas] = useState('');
  const [diaFechamento, setDiaFechamento] = useState('');
  const [useDiaPadrao, setUseDiaPadrao] = useState(true);
  const [newDiaPadrao, setNewDiaPadrao] = useState('');

  // Auto-process on load
  useEffect(() => {
    if (user?.id) {
      processarMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (diaFechamentoPadrao) {
      setNewDiaPadrao(String(diaFechamentoPadrao));
      if (useDiaPadrao) {
        setDiaFechamento(String(diaFechamentoPadrao));
      }
    }
  }, [diaFechamentoPadrao, useDiaPadrao]);

  const categoriasSaida = useMemo(() =>
    (categorias || []).filter(c => c.tipo === 'saida'),
    [categorias]
  );

  const filteredContas = useMemo(() => {
    if (!contas) return [];
    return contas.filter(c => {
      if (statusFilter === 'ativo' && !c.ativo) return false;
      if (statusFilter === 'inativo' && c.ativo) return false;
      if (searchQuery && !c.nome.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [contas, statusFilter, searchQuery]);

  const resetForm = () => {
    setNome(''); setDescricao(''); setValorTotal('');
    setCategoriaInput(''); setCategoriaId('');
    setIsAssinatura(false); setDataInicio('');
    setQtdParcelas(''); setUseDiaPadrao(true);
    setDiaFechamento(String(diaFechamentoPadrao || 1));
  };

  const handleCreate = async () => {
    if (!nome.trim() || !valorTotal || (!categoriaId && !categoriaInput.trim())) return;

    let finalCategoriaId = categoriaId;

    // If user typed a category that doesn't exist, create it
    if (!categoriaId && categoriaInput.trim()) {
      const existing = categorias?.find(
        c => c.nome.toLowerCase() === categoriaInput.trim().toLowerCase() && c.tipo === 'saida'
      );
      if (existing) {
        finalCategoriaId = existing.id;
      } else {
        const { data, error } = await supabase
          .from('categorias_financeiras')
          .insert({ usuario_id: user!.id, nome: categoriaInput.trim(), tipo: 'saida' })
          .select('id')
          .single();
        if (error) {
          toast.error('Erro ao criar categoria');
          return;
        }
        finalCategoriaId = data.id;
      }
    }

    createMutation.mutate(
      {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        valor_total: Number(valorTotal),
        categoria_id: finalCategoriaId,
        is_assinatura: isAssinatura,
        data_inicio: dataInicio || undefined,
        quantidade_parcelas: isAssinatura ? undefined : Number(qtdParcelas) || undefined,
        dia_fechamento: Number(diaFechamento) || diaFechamentoPadrao || 1,
      },
      {
        onSuccess: () => {
          resetForm();
          setDialogOpen(false);
          // Process immediately after creation
          processarMutation.mutate();
        },
      }
    );
  };

  const getValorExibicao = (conta: typeof filteredContas[0]) => {
    if (conta.is_assinatura) return Number(conta.valor_total);
    if (!conta.quantidade_parcelas) return Number(conta.valor_total);
    return Math.round((Number(conta.valor_total) / conta.quantidade_parcelas) * 100) / 100;
  };

  return (
    <AppLayout>
      <div className="mb-6 sm:mb-8 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Contas Recorrentes</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Assinaturas e parcelamentos automáticos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={configOpen} onOpenChange={setConfigOpen}>
              <DialogTrigger asChild>
                <button className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors" title="Configurações">
                  <Settings2 className="w-5 h-5 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="glass-card-strong">
                <DialogHeader>
                  <DialogTitle>Data de Fechamento Padrão</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <p className="text-sm text-muted-foreground">
                    Dia do mês em que as contas recorrentes serão registradas como saída por padrão.
                  </p>
                  <div>
                    <Label>Dia do mês (1-31)</Label>
                    <Input
                      className="glass-input mt-1"
                      type="number" min="1" max="31"
                      value={newDiaPadrao}
                      onChange={e => setNewDiaPadrao(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full btn-gradient"
                    onClick={() => {
                      const dia = Math.max(1, Math.min(31, Number(newDiaPadrao) || 1));
                      updateDiaMutation.mutate(dia);
                      setConfigOpen(false);
                    }}
                    disabled={updateDiaMutation.isPending}
                  >
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={() => processarMutation.mutate()}
              disabled={processarMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${processarMutation.isPending ? 'animate-spin' : ''}`} />
              Processar
            </Button>

            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <button className="btn-gradient flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" />
                  Nova Conta
                </button>
              </DialogTrigger>
              <DialogContent className="glass-card-strong max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova Conta Recorrente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label>Nome *</Label>
                    <Input className="glass-input mt-1" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Netflix, Celular novo..." />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input className="glass-input mt-1" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição opcional" />
                  </div>
                  <div>
                    <Label>Valor Total *</Label>
                    <Input className="glass-input mt-1" type="number" step="0.01" min="0" value={valorTotal} onChange={e => setValorTotal(e.target.value)} placeholder="0,00" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAssinatura
                        ? 'Este valor será debitado mensalmente na data de fechamento.'
                        : 'Este valor será dividido pelo número de parcelas.'}
                    </p>
                  </div>
                  <div>
                    <Label>Categoria *</Label>
                    <div className="mt-1">
                      <Select value={categoriaId} onValueChange={(v) => { setCategoriaId(v); setCategoriaInput(''); }}>
                        <SelectTrigger className="bg-secondary/50">
                          <SelectValue placeholder="Selecione ou digite abaixo" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriasSaida.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        className="glass-input mt-2"
                        value={categoriaInput}
                        onChange={e => { setCategoriaInput(e.target.value); setCategoriaId(''); }}
                        placeholder="Ou digite uma nova categoria (será criada como saída)"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="assinatura"
                      checked={isAssinatura}
                      onCheckedChange={(checked) => setIsAssinatura(checked === true)}
                    />
                    <Label htmlFor="assinatura" className="cursor-pointer">É uma assinatura</Label>
                  </div>
                  <div>
                    <Label>Início de Pagamento</Label>
                    <Input className="glass-input mt-1" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                    <p className="text-xs text-muted-foreground mt-1">Se não preenchido, será utilizada a data de hoje.</p>
                  </div>
                  {!isAssinatura && (
                    <div>
                      <Label>Quantidade de Parcelas *</Label>
                      <Input className="glass-input mt-1" type="number" min="1" value={qtdParcelas} onChange={e => setQtdParcelas(e.target.value)} placeholder="Ex: 12" />
                      {valorTotal && qtdParcelas && Number(qtdParcelas) > 0 && (
                        <p className="text-xs text-primary mt-1">
                          Valor por parcela: {formatCurrency(Number(valorTotal) / Number(qtdParcelas))}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id="useDiaPadrao"
                        checked={useDiaPadrao}
                        onCheckedChange={(checked) => {
                          setUseDiaPadrao(checked === true);
                          if (checked) setDiaFechamento(String(diaFechamentoPadrao || 1));
                        }}
                      />
                      <Label htmlFor="useDiaPadrao" className="cursor-pointer">
                        Usar data de fechamento padrão (dia {diaFechamentoPadrao || 1})
                      </Label>
                    </div>
                    {!useDiaPadrao && (
                      <>
                        <Label>Dia de Fechamento (1-31)</Label>
                        <Input
                          className="glass-input mt-1"
                          type="number" min="1" max="31"
                          value={diaFechamento}
                          onChange={e => setDiaFechamento(e.target.value)}
                        />
                      </>
                    )}
                  </div>
                  <Button
                    onClick={handleCreate}
                    disabled={createMutation.isPending || !nome.trim() || !valorTotal || (!categoriaId && !categoriaInput.trim()) || (!isAssinatura && !qtdParcelas)}
                    className="w-full btn-gradient"
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Criar Conta Recorrente
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="glass-input pl-9" placeholder="Buscar por nome..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="bg-secondary/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="w-4 h-4" />
            <span>Fechamento padrão: dia {diaFechamentoPadrao || 1}</span>
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredContas.length === 0 ? (
        <div className="glass-card p-8 text-center animate-fade-in">
          <CalendarClock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Nenhuma conta recorrente encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredContas.map((conta, index) => {
            const valorMensal = getValorExibicao(conta);
            const progresso = !conta.is_assinatura && conta.quantidade_parcelas
              ? `${conta.parcelas_pagas}/${conta.quantidade_parcelas}`
              : null;
            const concluida = !conta.is_assinatura && conta.quantidade_parcelas && conta.parcelas_pagas >= conta.quantidade_parcelas;

            return (
              <div
                key={conta.id}
                className={`glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-in ${!conta.ativo ? 'opacity-50' : ''}`}
                style={{ animationDelay: `${0.05 * index}s` }}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    conta.is_assinatura ? 'bg-primary/20 text-primary' : concluida ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                  }`}>
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{conta.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {conta.categorias_financeiras?.nome} • Fecha dia {conta.dia_fechamento}
                      {conta.is_assinatura ? ' • Assinatura' : ''}
                      {progresso ? ` • ${progresso} parcelas` : ''}
                      {concluida ? ' • ✅ Concluída' : ''}
                    </p>
                    {conta.descricao && (
                      <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{conta.descricao}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right mr-2">
                    <span className="font-bold text-base money-negative">
                      {formatCurrency(valorMensal)}/mês
                    </span>
                    {!conta.is_assinatura && (
                      <p className="text-xs text-muted-foreground">
                        Total: {formatCurrency(Number(conta.valor_total))}
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className={conta.ativo ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10'}
                    onClick={() => toggleAtivoMutation.mutate({ id: conta.id, ativo: !conta.ativo })}
                    disabled={toggleAtivoMutation.isPending}
                    title={conta.ativo ? 'Pausar' : 'Ativar'}
                  >
                    {conta.ativo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir conta recorrente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          A conta será excluída, mas as movimentações já geradas serão mantidas no histórico.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="btn-danger" onClick={() => deleteMutation.mutate(conta.id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}

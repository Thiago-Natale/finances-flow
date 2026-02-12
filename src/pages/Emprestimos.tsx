import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEmprestimos, useCreateEmprestimo, useUpdateEmprestimoStatus, useDeleteEmprestimo } from '@/hooks/useEmprestimos';
import { formatCurrency } from '@/hooks/useFinancialData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Loader2, Trash2, CheckCircle2, Clock, Undo2, Handshake } from 'lucide-react';

type StatusFilter = 'all' | 'pendente' | 'pago';

export default function Emprestimos() {
  const { data: emprestimos, isLoading } = useEmprestimos();
  const createMutation = useCreateEmprestimo();
  const updateStatusMutation = useUpdateEmprestimoStatus();
  const deleteMutation = useDeleteEmprestimo();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredEmprestimos = useMemo(() => {
    if (!emprestimos) return [];
    return emprestimos.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (searchQuery && !e.nome.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (dateFrom && e.data_criacao < dateFrom) return false;
      if (dateTo && e.data_criacao > dateTo) return false;
      return true;
    });
  }, [emprestimos, statusFilter, searchQuery, dateFrom, dateTo]);

  const handleCreate = () => {
    if (!nome.trim() || !valor) return;
    createMutation.mutate(
      { nome: nome.trim(), valor: Number(valor), data_pagamento: dataPagamento || undefined },
      {
        onSuccess: () => {
          setNome('');
          setValor('');
          setDataPagamento('');
          setDialogOpen(false);
        },
      }
    );
  };

  return (
    <AppLayout>
      <div className="mb-6 sm:mb-8 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Empréstimos</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Gerencie seus empréstimos</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="btn-gradient flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Novo Empréstimo
              </button>
            </DialogTrigger>
            <DialogContent className="glass-card-strong">
              <DialogHeader>
                <DialogTitle>Novo Empréstimo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Nome</Label>
                  <Input className="glass-input mt-1" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Empréstimo pessoal" />
                </div>
                <div>
                  <Label>Valor</Label>
                  <Input className="glass-input mt-1" type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
                </div>
                <div>
                  <Label>Data de Pagamento (opcional)</Label>
                  <Input className="glass-input mt-1" type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} />
                </div>
                <Button onClick={handleCreate} disabled={createMutation.isPending || !nome.trim() || !valor} className="w-full btn-gradient">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Criar Empréstimo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="glass-input pl-9" placeholder="Buscar por nome..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
            <SelectTrigger className="bg-secondary/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
            </SelectContent>
          </Select>
          <Input className="glass-input" type="date" placeholder="Data de" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input className="glass-input" type="date" placeholder="Data até" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredEmprestimos.length === 0 ? (
        <div className="glass-card p-8 text-center animate-fade-in">
          <Handshake className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Nenhum empréstimo encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEmprestimos.map((emp, index) => (
            <div
              key={emp.id}
              className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-in"
              style={{ animationDelay: `${0.05 * index}s` }}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  emp.status === 'pendente' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                }`}>
                  {emp.status === 'pendente' ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{emp.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    Criado em {new Date(emp.data_criacao).toLocaleDateString('pt-BR')}
                    {emp.data_pagamento && ` • Pgto: ${new Date(emp.data_pagamento).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`font-bold text-base ${emp.status === 'pendente' ? 'money-negative' : 'money-positive'}`}>
                  {formatCurrency(Number(emp.valor))}
                </span>

                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  emp.status === 'pendente' 
                    ? 'bg-warning/15 text-warning' 
                    : 'bg-success/15 text-success'
                }`}>
                  {emp.status === 'pendente' ? 'Pendente' : 'Pago'}
                </span>

                {emp.status === 'pendente' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-success hover:bg-success/10"
                    onClick={() => updateStatusMutation.mutate({ id: emp.id, status: 'pago' })}
                    disabled={updateStatusMutation.isPending}
                    title="Marcar como pago"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-warning hover:bg-warning/10"
                    onClick={() => updateStatusMutation.mutate({ id: emp.id, status: 'pendente' })}
                    disabled={updateStatusMutation.isPending}
                    title="Voltar para pendente"
                  >
                    <Undo2 className="w-4 h-4" />
                  </Button>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" title="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir empréstimo?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction className="btn-danger" onClick={() => deleteMutation.mutate(emp.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

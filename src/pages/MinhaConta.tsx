import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Save, Loader2, Mail, Phone, Calendar, AtSign } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function MinhaConta() {
  const { usuario, refreshUsuario } = useAuth();
  const [formData, setFormData] = useState({
    nome_completo: '',
    data_nascimento: '',
    telefone: '',
    email: '',
    login: '',
  });
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (usuario) {
      setFormData({
        nome_completo: usuario.nome_completo || '',
        data_nascimento: usuario.data_nascimento || '',
        telefone: usuario.telefone || '',
        email: usuario.email || '',
        login: usuario.login || '',
      });
    }
  }, [usuario]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario?.id) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome_completo: formData.nome_completo.trim(),
          data_nascimento: formData.data_nascimento || null,
          telefone: formData.telefone.trim() || null,
        })
        .eq('id', usuario.id);

      if (error) throw error;

      toast.success('Dados atualizados com sucesso!');
      await refreshUsuario();
    } catch (error) {
      toast.error('Erro ao salvar dados');
    } finally {
      setSaving(false);
    }
  };

  if (!usuario) {
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
        <h1 className="text-3xl font-bold text-foreground">Minha Conta</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas informações pessoais
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{usuario.nome_completo}</h2>
              <p className="text-muted-foreground">@{usuario.login}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome_completo" className="text-foreground/80 flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome Completo
              </Label>
              <Input
                id="nome_completo"
                name="nome_completo"
                value={formData.nome_completo}
                onChange={handleChange}
                className="glass-input"
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_nascimento" className="text-foreground/80 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data de Nascimento
                </Label>
                <Input
                  id="data_nascimento"
                  name="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={handleChange}
                  className="glass-input"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-foreground/80 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="glass-input"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Read-only fields */}
            <div className="space-y-2">
              <Label className="text-foreground/80 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-mail
              </Label>
              <Input
                value={formData.email}
                className="glass-input opacity-60"
                disabled
              />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/80 flex items-center gap-2">
                <AtSign className="w-4 h-4" />
                Login
              </Label>
              <Input
                value={formData.login}
                className="glass-input opacity-60"
                disabled
              />
              <p className="text-xs text-muted-foreground">O login não pode ser alterado</p>
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

        {/* Account Info */}
        <div className="glass-card p-6 mt-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-medium text-foreground mb-2">ℹ️ Informações da Conta</h3>
          <p className="text-sm text-muted-foreground">
            Sua conta foi criada em{' '}
            <strong>
              {new Date(usuario.created_at || Date.now()).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </strong>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

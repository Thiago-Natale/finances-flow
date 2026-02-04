import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react';
import { z } from 'zod';

const registerSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  telefone: z.string().min(10, 'Telefone inválido').max(20),
  email: z.string().email('E-mail inválido').max(255),
  login: z.string().min(3, 'Login deve ter pelo menos 3 caracteres').max(50).regex(/^[a-zA-Z0-9_]+$/, 'Login deve conter apenas letras, números e underscore'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export function RegisterForm() {
  const [formData, setFormData] = useState({
    nome_completo: '',
    data_nascimento: '',
    telefone: '',
    email: '',
    login: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('Este e-mail já está cadastrado');
        } else {
          toast.error('Erro ao criar conta: ' + authError.message);
        }
        return;
      }

      if (!authData.user) {
        toast.error('Erro ao criar usuário');
        return;
      }

      // Create user profile in usuarios table
      // The UNIQUE constraints on login and email will prevent duplicates at DB level
      const { error: profileError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          nome_completo: formData.nome_completo.trim(),
          data_nascimento: formData.data_nascimento,
          telefone: formData.telefone.trim(),
          email: formData.email.trim(),
          login: formData.login.trim(),
        });

      if (profileError) {
        // Handle specific constraint violations
        if (profileError.code === '23505') {
          // Unique constraint violation
          if (profileError.message.includes('login')) {
            setErrors({ login: 'Este login já está em uso' });
            toast.error('Este login já está em uso');
          } else if (profileError.message.includes('email')) {
            toast.error('Este e-mail já está cadastrado');
          } else {
            toast.error('Dados duplicados detectados');
          }
        } else {
          toast.error('Erro ao criar perfil. Por favor, entre em contato com o suporte.');
        }
        // Note: Auth user may exist without profile - user should try logging in
        // or contact support. We cannot delete auth users from client-side.
        console.error('Profile creation error:', profileError.message);
        return;
      }

      toast.success('Conta criada com sucesso! Bem-vindo!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Erro inesperado ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="nome_completo" className="text-foreground/80">Nome Completo</Label>
        <Input
          id="nome_completo"
          name="nome_completo"
          placeholder="João da Silva"
          value={formData.nome_completo}
          onChange={handleChange}
          className="glass-input"
          disabled={loading}
        />
        {errors.nome_completo && <p className="text-destructive text-sm">{errors.nome_completo}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data_nascimento" className="text-foreground/80">Data de Nascimento</Label>
          <Input
            id="data_nascimento"
            name="data_nascimento"
            type="date"
            value={formData.data_nascimento}
            onChange={handleChange}
            className="glass-input"
            disabled={loading}
          />
          {errors.data_nascimento && <p className="text-destructive text-sm">{errors.data_nascimento}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone" className="text-foreground/80">Telefone</Label>
          <Input
            id="telefone"
            name="telefone"
            placeholder="(11) 99999-9999"
            value={formData.telefone}
            onChange={handleChange}
            className="glass-input"
            disabled={loading}
          />
          {errors.telefone && <p className="text-destructive text-sm">{errors.telefone}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground/80">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={handleChange}
          className="glass-input"
          disabled={loading}
        />
        {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="login" className="text-foreground/80">Login (username)</Label>
        <Input
          id="login"
          name="login"
          placeholder="seu_usuario"
          value={formData.login}
          onChange={handleChange}
          className="glass-input"
          disabled={loading}
        />
        {errors.login && <p className="text-destructive text-sm">{errors.login}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground/80">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="glass-input pr-12"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-foreground/80">Confirmar Senha</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="glass-input pr-12"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full btn-gradient"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <UserPlus className="w-5 h-5 mr-2" />
        )}
        Criar Conta
      </Button>

      <p className="text-center text-muted-foreground">
        Já tem uma conta?{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Faça login
        </Link>
      </p>
    </form>
  );
}

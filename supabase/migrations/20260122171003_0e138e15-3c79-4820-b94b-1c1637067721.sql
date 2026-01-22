-- Criar enum para tipo de categoria
CREATE TYPE public.tipo_categoria AS ENUM ('entrada', 'saida');

-- Tabela: usuarios (perfil público vinculado ao auth.users)
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo TEXT NOT NULL,
    data_nascimento DATE,
    telefone TEXT,
    email TEXT UNIQUE NOT NULL,
    login TEXT UNIQUE NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: perfil_financeiro
CREATE TABLE public.perfil_financeiro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID UNIQUE NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    renda_mensal DECIMAL(15,2) DEFAULT 0,
    saldo_inicial DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: categorias_financeiras
CREATE TABLE public.categorias_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo tipo_categoria NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: movimentacoes_financeiras
CREATE TABLE public.movimentacoes_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES public.categorias_financeiras(id) ON DELETE RESTRICT,
    valor DECIMAL(15,2) NOT NULL,
    data_movimentacao DATE NOT NULL DEFAULT CURRENT_DATE,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- RLS Policies: usuarios
CREATE POLICY "Usuarios podem ver seu proprio perfil" ON public.usuarios
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuarios podem atualizar seu proprio perfil" ON public.usuarios
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuarios podem inserir seu proprio perfil" ON public.usuarios
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies: perfil_financeiro
CREATE POLICY "Usuarios podem ver seu perfil financeiro" ON public.perfil_financeiro
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar seu perfil financeiro" ON public.perfil_financeiro
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem inserir seu perfil financeiro" ON public.perfil_financeiro
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- RLS Policies: categorias_financeiras
CREATE POLICY "Usuarios podem ver suas categorias" ON public.categorias_financeiras
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem criar categorias" ON public.categorias_financeiras
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar suas categorias" ON public.categorias_financeiras
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem deletar suas categorias" ON public.categorias_financeiras
    FOR DELETE USING (auth.uid() = usuario_id);

-- RLS Policies: movimentacoes_financeiras
CREATE POLICY "Usuarios podem ver suas movimentacoes" ON public.movimentacoes_financeiras
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem criar movimentacoes" ON public.movimentacoes_financeiras
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar suas movimentacoes" ON public.movimentacoes_financeiras
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem deletar suas movimentacoes" ON public.movimentacoes_financeiras
    FOR DELETE USING (auth.uid() = usuario_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_perfil_financeiro_updated_at
    BEFORE UPDATE ON public.perfil_financeiro
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar perfil financeiro automaticamente após criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfil_financeiro (usuario_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_usuario_created
    AFTER INSERT ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
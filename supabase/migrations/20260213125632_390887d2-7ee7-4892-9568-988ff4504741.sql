
-- Add default closing date to perfil_financeiro
ALTER TABLE public.perfil_financeiro ADD COLUMN dia_fechamento_padrao integer NOT NULL DEFAULT 1;

-- Create contas_recorrentes table
CREATE TABLE public.contas_recorrentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor_total NUMERIC NOT NULL,
  categoria_id UUID NOT NULL,
  is_assinatura BOOLEAN NOT NULL DEFAULT false,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  quantidade_parcelas INTEGER,
  parcelas_pagas INTEGER NOT NULL DEFAULT 0,
  dia_fechamento INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT fk_categoria FOREIGN KEY (categoria_id) REFERENCES public.categorias_financeiras(id)
);

-- Add tracking columns to movimentacoes_financeiras
ALTER TABLE public.movimentacoes_financeiras ADD COLUMN conta_recorrente_id UUID REFERENCES public.contas_recorrentes(id) ON DELETE SET NULL;
ALTER TABLE public.movimentacoes_financeiras ADD COLUMN parcela_numero INTEGER;

-- Enable RLS
ALTER TABLE public.contas_recorrentes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Usuarios podem ver suas contas recorrentes"
ON public.contas_recorrentes FOR SELECT
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem criar contas recorrentes"
ON public.contas_recorrentes FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar suas contas recorrentes"
ON public.contas_recorrentes FOR UPDATE
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem deletar suas contas recorrentes"
ON public.contas_recorrentes FOR DELETE
USING (auth.uid() = usuario_id);

-- Trigger for updated_at
CREATE TRIGGER update_contas_recorrentes_updated_at
BEFORE UPDATE ON public.contas_recorrentes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

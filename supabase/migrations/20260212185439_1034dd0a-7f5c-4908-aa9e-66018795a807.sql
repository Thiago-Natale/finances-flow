
-- Create status enum for emprestimos
CREATE TYPE public.status_emprestimo AS ENUM ('pendente', 'pago');

-- Create emprestimos table
CREATE TABLE public.emprestimos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_criacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_pagamento DATE,
  status public.status_emprestimo NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT emprestimos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

-- Enable RLS
ALTER TABLE public.emprestimos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Usuarios podem ver seus emprestimos"
  ON public.emprestimos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem criar emprestimos"
  ON public.emprestimos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar seus emprestimos"
  ON public.emprestimos FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem deletar seus emprestimos"
  ON public.emprestimos FOR DELETE
  USING (auth.uid() = usuario_id);

-- Trigger for updated_at
CREATE TRIGGER update_emprestimos_updated_at
  BEFORE UPDATE ON public.emprestimos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

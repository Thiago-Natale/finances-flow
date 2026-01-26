-- Update the trigger function to also create default categories
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Create financial profile
    INSERT INTO public.perfil_financeiro (usuario_id)
    VALUES (NEW.id);
    
    -- Create default income categories (entradas)
    INSERT INTO public.categorias_financeiras (usuario_id, nome, tipo) VALUES
    (NEW.id, 'Salário', 'entrada'),
    (NEW.id, 'Renda Extra', 'entrada'),
    (NEW.id, 'Investimentos', 'entrada'),
    (NEW.id, 'Reembolsos', 'entrada'),
    (NEW.id, 'Outros Ganhos', 'entrada');
    
    -- Create default expense categories (saídas)
    INSERT INTO public.categorias_financeiras (usuario_id, nome, tipo) VALUES
    (NEW.id, 'Moradia', 'saida'),
    (NEW.id, 'Alimentação', 'saida'),
    (NEW.id, 'Transporte', 'saida'),
    (NEW.id, 'Contas Fixas', 'saida'),
    (NEW.id, 'Saúde', 'saida'),
    (NEW.id, 'Educação', 'saida'),
    (NEW.id, 'Lazer', 'saida'),
    (NEW.id, 'Compras', 'saida'),
    (NEW.id, 'Impostos / Taxas', 'saida'),
    (NEW.id, 'Outros Gastos', 'saida');
    
    RETURN NEW;
END;
$function$;
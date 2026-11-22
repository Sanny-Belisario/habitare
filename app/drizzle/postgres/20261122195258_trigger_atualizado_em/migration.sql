-- A sincronização (src/services/sincronizacao.ts) decide qual lado é o mais novo
-- por atualizado_em. Uma edição feita direto no banco (painel do Supabase, SQL)
-- não mexia nessa coluna, e o app nunca recebia a alteração.
-- O trigger preenche a coluna com now() quando o UPDATE não trouxe uma data nova.
-- Quando o app envia uma data (a da alteração no aparelho), ela é mantida.
CREATE OR REPLACE FUNCTION public.definir_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  coluna text := TG_ARGV[0];
BEGIN
  IF to_jsonb(NEW) -> coluna IS NOT DISTINCT FROM to_jsonb(OLD) -> coluna THEN
    NEW := jsonb_populate_record(NEW, jsonb_build_object(coluna, now()));
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER condominio_atualizado_em BEFORE UPDATE ON "condominio" FOR EACH ROW EXECUTE FUNCTION public.definir_atualizado_em('atualizado_em');
--> statement-breakpoint
CREATE TRIGGER usuario_atualizado_em BEFORE UPDATE ON "usuario" FOR EACH ROW EXECUTE FUNCTION public.definir_atualizado_em('atualizado_em');
--> statement-breakpoint
CREATE TRIGGER bloco_atualizado_em BEFORE UPDATE ON "bloco" FOR EACH ROW EXECUTE FUNCTION public.definir_atualizado_em('atualizado_em');
--> statement-breakpoint
CREATE TRIGGER apartamento_atualizado_em BEFORE UPDATE ON "apartamento" FOR EACH ROW EXECUTE FUNCTION public.definir_atualizado_em('atualizado_em');
--> statement-breakpoint
CREATE TRIGGER morador_apartamento_atualizado_em BEFORE UPDATE ON "morador_apartamento" FOR EACH ROW EXECUTE FUNCTION public.definir_atualizado_em('atualizado_em');
--> statement-breakpoint
CREATE TRIGGER categoria_ocorrencia_atualizado_em BEFORE UPDATE ON "categoria_ocorrencia" FOR EACH ROW EXECUTE FUNCTION public.definir_atualizado_em('atualizado_em');
--> statement-breakpoint
CREATE TRIGGER ocorrencia_atualizada_em BEFORE UPDATE ON "ocorrencia" FOR EACH ROW EXECUTE FUNCTION public.definir_atualizado_em('atualizada_em');
--> statement-breakpoint
CREATE TRIGGER tipo_comunicado_atualizado_em BEFORE UPDATE ON "tipo_comunicado" FOR EACH ROW EXECUTE FUNCTION public.definir_atualizado_em('atualizado_em');
--> statement-breakpoint
CREATE TRIGGER comunicado_atualizado_em BEFORE UPDATE ON "comunicado" FOR EACH ROW EXECUTE FUNCTION public.definir_atualizado_em('atualizado_em');

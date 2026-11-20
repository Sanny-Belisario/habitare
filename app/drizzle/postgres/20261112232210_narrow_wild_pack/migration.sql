ALTER TABLE "condominio" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "usuario" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "apartamento" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bloco" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "categoria_ocorrencia" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "comunicado" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "morador_apartamento" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ocorrencia" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "status_ocorrencia" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tipo_comunicado" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "condominio_anon_select_dev" ON "condominio" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "condominio_anon_insert_dev" ON "condominio" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "condominio_anon_update_dev" ON "condominio" AS PERMISSIVE FOR UPDATE TO "anon" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "usuario_anon_select_dev" ON "usuario" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "usuario_anon_insert_dev" ON "usuario" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "usuario_anon_update_dev" ON "usuario" AS PERMISSIVE FOR UPDATE TO "anon" USING (true) WITH CHECK (true);
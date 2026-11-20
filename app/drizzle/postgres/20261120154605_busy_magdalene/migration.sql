CREATE POLICY "apartamento_anon_select_dev" ON "apartamento" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "apartamento_anon_insert_dev" ON "apartamento" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "apartamento_anon_update_dev" ON "apartamento" AS PERMISSIVE FOR UPDATE TO "anon" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "bloco_anon_select_dev" ON "bloco" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "bloco_anon_insert_dev" ON "bloco" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "bloco_anon_update_dev" ON "bloco" AS PERMISSIVE FOR UPDATE TO "anon" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "categoria_ocorrencia_anon_select_dev" ON "categoria_ocorrencia" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "categoria_ocorrencia_anon_insert_dev" ON "categoria_ocorrencia" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "categoria_ocorrencia_anon_update_dev" ON "categoria_ocorrencia" AS PERMISSIVE FOR UPDATE TO "anon" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "comunicado_anon_select_dev" ON "comunicado" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "comunicado_anon_insert_dev" ON "comunicado" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "comunicado_anon_update_dev" ON "comunicado" AS PERMISSIVE FOR UPDATE TO "anon" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "morador_apartamento_anon_select_dev" ON "morador_apartamento" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "morador_apartamento_anon_insert_dev" ON "morador_apartamento" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "morador_apartamento_anon_update_dev" ON "morador_apartamento" AS PERMISSIVE FOR UPDATE TO "anon" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "ocorrencia_anon_select_dev" ON "ocorrencia" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "ocorrencia_anon_insert_dev" ON "ocorrencia" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "ocorrencia_anon_update_dev" ON "ocorrencia" AS PERMISSIVE FOR UPDATE TO "anon" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "status_ocorrencia_anon_select_dev" ON "status_ocorrencia" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "status_ocorrencia_anon_insert_dev" ON "status_ocorrencia" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "status_ocorrencia_anon_update_dev" ON "status_ocorrencia" AS PERMISSIVE FOR UPDATE TO "anon" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "tipo_comunicado_anon_select_dev" ON "tipo_comunicado" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "tipo_comunicado_anon_insert_dev" ON "tipo_comunicado" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "tipo_comunicado_anon_update_dev" ON "tipo_comunicado" AS PERMISSIVE FOR UPDATE TO "anon" USING (true) WITH CHECK (true);
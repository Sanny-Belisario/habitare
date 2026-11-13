CREATE TABLE "apartamento" (
	"id_apartamento" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"id_bloco" uuid NOT NULL,
	"nome" text NOT NULL,
	"status_ocupacao" boolean DEFAULT false NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone,
	CONSTRAINT "apartamento_id_bloco_nome_unique" UNIQUE("id_bloco","nome")
);
--> statement-breakpoint
CREATE TABLE "bloco" (
	"id_bloco" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"id_condominio" uuid NOT NULL,
	"nome" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone,
	CONSTRAINT "bloco_id_condominio_nome_unique" UNIQUE("id_condominio","nome")
);
--> statement-breakpoint
CREATE TABLE "categoria_ocorrencia" (
	"id_categoria" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"id_condominio" uuid NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "comunicado" (
	"id_comunicado" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"id_condominio" uuid NOT NULL,
	"id_tipo_comunicado" uuid NOT NULL,
	"id_autor" uuid NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text,
	"status" text,
	"publicado_em" timestamp with time zone,
	"expira_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "morador_apartamento" (
	"id_vinculo" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"id_usuario" uuid NOT NULL,
	"id_apartamento" uuid NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ocorrencia" (
	"id_ocorrencia" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"id_condominio" uuid NOT NULL,
	"id_autor" uuid NOT NULL,
	"id_bloco" uuid,
	"id_apartamento" uuid,
	"id_categoria" uuid NOT NULL,
	"id_status" uuid NOT NULL,
	"numero_protocolo" text NOT NULL UNIQUE,
	"titulo" text NOT NULL,
	"descricao" text,
	"aberta_em" timestamp with time zone DEFAULT now() NOT NULL,
	"iniciada_em" timestamp with time zone,
	"resolvida_em" timestamp with time zone,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizada_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "status_ocorrencia" (
	"id_status" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"nome" text NOT NULL UNIQUE,
	"cor_identificacao" text,
	"ordem_exibicao" integer,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tipo_comunicado" (
	"id_tipo_comunicado" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"id_condominio" uuid NOT NULL,
	"nome" text NOT NULL,
	"cor_identificacao" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "condominio" ALTER COLUMN "id_condominio" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "condominio" ALTER COLUMN "nome" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "condominio" ALTER COLUMN "numero" SET DATA TYPE text USING "numero"::text;--> statement-breakpoint
ALTER TABLE "condominio" ALTER COLUMN "uf" SET DATA TYPE varchar(2) USING "uf"::varchar(2);--> statement-breakpoint
ALTER TABLE "condominio" ALTER COLUMN "ativo" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "condominio" ALTER COLUMN "criado_em" SET DATA TYPE timestamp with time zone USING "criado_em"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "condominio" ALTER COLUMN "criado_em" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "condominio" ALTER COLUMN "criado_em" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "condominio" ALTER COLUMN "atualizado_em" SET DATA TYPE timestamp with time zone USING "atualizado_em"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "usuario" ALTER COLUMN "id_usuario" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "usuario" ALTER COLUMN "id_condominio" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "usuario" ALTER COLUMN "nome_completo" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "usuario" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "usuario" ALTER COLUMN "senha_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "usuario" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "usuario" ALTER COLUMN "is_sindico" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "usuario" ALTER COLUMN "is_sindico" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "usuario" ALTER COLUMN "criado_em" SET DATA TYPE timestamp with time zone USING "criado_em"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "usuario" ALTER COLUMN "criado_em" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "usuario" ALTER COLUMN "criado_em" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "usuario" ALTER COLUMN "atualizado_em" SET DATA TYPE timestamp with time zone USING "atualizado_em"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "apartamento" ADD CONSTRAINT "apartamento_id_bloco_bloco_id_bloco_fkey" FOREIGN KEY ("id_bloco") REFERENCES "bloco"("id_bloco");--> statement-breakpoint
ALTER TABLE "bloco" ADD CONSTRAINT "bloco_id_condominio_condominio_id_condominio_fkey" FOREIGN KEY ("id_condominio") REFERENCES "condominio"("id_condominio");--> statement-breakpoint
ALTER TABLE "categoria_ocorrencia" ADD CONSTRAINT "categoria_ocorrencia_6LhDpg5DcNer_fkey" FOREIGN KEY ("id_condominio") REFERENCES "condominio"("id_condominio");--> statement-breakpoint
ALTER TABLE "comunicado" ADD CONSTRAINT "comunicado_id_condominio_condominio_id_condominio_fkey" FOREIGN KEY ("id_condominio") REFERENCES "condominio"("id_condominio");--> statement-breakpoint
ALTER TABLE "comunicado" ADD CONSTRAINT "comunicado_KkiUxrNlyCC0_fkey" FOREIGN KEY ("id_tipo_comunicado") REFERENCES "tipo_comunicado"("id_tipo_comunicado");--> statement-breakpoint
ALTER TABLE "comunicado" ADD CONSTRAINT "comunicado_id_autor_usuario_id_usuario_fkey" FOREIGN KEY ("id_autor") REFERENCES "usuario"("id_usuario");--> statement-breakpoint
ALTER TABLE "morador_apartamento" ADD CONSTRAINT "morador_apartamento_id_usuario_usuario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario");--> statement-breakpoint
ALTER TABLE "morador_apartamento" ADD CONSTRAINT "morador_apartamento_m28Mz74G04EC_fkey" FOREIGN KEY ("id_apartamento") REFERENCES "apartamento"("id_apartamento");--> statement-breakpoint
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_id_condominio_condominio_id_condominio_fkey" FOREIGN KEY ("id_condominio") REFERENCES "condominio"("id_condominio");--> statement-breakpoint
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_id_autor_usuario_id_usuario_fkey" FOREIGN KEY ("id_autor") REFERENCES "usuario"("id_usuario");--> statement-breakpoint
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_id_bloco_bloco_id_bloco_fkey" FOREIGN KEY ("id_bloco") REFERENCES "bloco"("id_bloco");--> statement-breakpoint
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_id_apartamento_apartamento_id_apartamento_fkey" FOREIGN KEY ("id_apartamento") REFERENCES "apartamento"("id_apartamento");--> statement-breakpoint
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_id_categoria_categoria_ocorrencia_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categoria_ocorrencia"("id_categoria");--> statement-breakpoint
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_id_status_status_ocorrencia_id_status_fkey" FOREIGN KEY ("id_status") REFERENCES "status_ocorrencia"("id_status");--> statement-breakpoint
ALTER TABLE "tipo_comunicado" ADD CONSTRAINT "tipo_comunicado_id_condominio_condominio_id_condominio_fkey" FOREIGN KEY ("id_condominio") REFERENCES "condominio"("id_condominio");
CREATE TABLE "condominio" (
	"id_condominio" uuid PRIMARY KEY,
	"nome" text,
	"razao_social" text,
	"cnpj" text UNIQUE,
	"email" text,
	"telefone" text,
	"cep" text,
	"logradouro" text,
	"numero" integer,
	"complemento" text,
	"bairro" text,
	"cidade" text,
	"uf" text,
	"ativo" boolean DEFAULT true,
	"criado_em" text,
	"atualizado_em" text
);
--> statement-breakpoint
CREATE TABLE "usuario" (
	"id_usuario" uuid PRIMARY KEY,
	"id_condominio" uuid,
	"nome_completo" text,
	"email" text UNIQUE,
	"senha_hash" text,
	"codigo_acesso_hash" text,
	"telefone" text,
	"status" boolean DEFAULT true,
	"is_sindico" boolean,
	"criado_em" text,
	"atualizado_em" text
);
--> statement-breakpoint
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_condominio_condominio_id_condominio_fkey" FOREIGN KEY ("id_condominio") REFERENCES "condominio"("id_condominio");
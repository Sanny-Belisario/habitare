CREATE TABLE `condominio` (
	`id_condominio` integer PRIMARY KEY,
	`nome` text,
	`razao_social` text,
	`cnpj` integer UNIQUE,
	`email` text,
	`telefone` integer,
	`cep` integer,
	`logradouro` text,
	`numero` integer,
	`complemento` text,
	`bairro` text,
	`cidade` text,
	`uf` text,
	`ativo` integer DEFAULT true,
	`criado_em` text,
	`atualizado_em` text
);
--> statement-breakpoint
CREATE TABLE `usuario` (
	`id_usuario` integer PRIMARY KEY,
	`id_condominio` integer,
	`nome_completo` text,
	`email` text UNIQUE,
	`senha_hash` text,
	`codigo_acesso_hash` text,
	`telefone` integer,
	`status` integer DEFAULT true,
	`is_sindico` integer,
	`criado_em` text,
	`atualizado_em` text,
	CONSTRAINT `fk_usuario_id_condominio_condominio_id_condominio_fk` FOREIGN KEY (`id_condominio`) REFERENCES `condominio`(`id_condominio`)
);

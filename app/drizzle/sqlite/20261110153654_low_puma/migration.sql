PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_condominio` (
	`id_condominio` text PRIMARY KEY,
	`nome` text,
	`razao_social` text,
	`cnpj` text UNIQUE,
	`email` text,
	`telefone` text,
	`cep` text,
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
INSERT INTO `__new_condominio`(`id_condominio`, `nome`, `razao_social`, `cnpj`, `email`, `telefone`, `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `ativo`, `criado_em`, `atualizado_em`) SELECT `id_condominio`, `nome`, `razao_social`, `cnpj`, `email`, `telefone`, `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `ativo`, `criado_em`, `atualizado_em` FROM `condominio`;--> statement-breakpoint
DROP TABLE `condominio`;--> statement-breakpoint
ALTER TABLE `__new_condominio` RENAME TO `condominio`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_usuario` (
	`id_usuario` text PRIMARY KEY,
	`id_condominio` text,
	`nome_completo` text,
	`email` text UNIQUE,
	`senha_hash` text,
	`codigo_acesso_hash` text,
	`telefone` text,
	`status` integer DEFAULT true,
	`is_sindico` integer,
	`criado_em` text,
	`atualizado_em` text,
	CONSTRAINT `fk_usuario_id_condominio_condominio_id_condominio_fk` FOREIGN KEY (`id_condominio`) REFERENCES `condominio`(`id_condominio`)
);
--> statement-breakpoint
INSERT INTO `__new_usuario`(`id_usuario`, `id_condominio`, `nome_completo`, `email`, `senha_hash`, `codigo_acesso_hash`, `telefone`, `status`, `is_sindico`, `criado_em`, `atualizado_em`) SELECT `id_usuario`, `id_condominio`, `nome_completo`, `email`, `senha_hash`, `codigo_acesso_hash`, `telefone`, `status`, `is_sindico`, `criado_em`, `atualizado_em` FROM `usuario`;--> statement-breakpoint
DROP TABLE `usuario`;--> statement-breakpoint
ALTER TABLE `__new_usuario` RENAME TO `usuario`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
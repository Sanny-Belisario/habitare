CREATE TABLE `apartamento` (
	`id_apartamento` text PRIMARY KEY,
	`id_bloco` text NOT NULL,
	`nome` text NOT NULL,
	`status_ocupacao` integer DEFAULT false NOT NULL,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text,
	CONSTRAINT `fk_apartamento_id_bloco_bloco_id_bloco_fk` FOREIGN KEY (`id_bloco`) REFERENCES `bloco`(`id_bloco`),
	CONSTRAINT `apartamento_id_bloco_nome_unique` UNIQUE(`id_bloco`,`nome`)
);
--> statement-breakpoint
CREATE TABLE `bloco` (
	`id_bloco` text PRIMARY KEY,
	`id_condominio` text NOT NULL,
	`nome` text NOT NULL,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text,
	CONSTRAINT `fk_bloco_id_condominio_condominio_id_condominio_fk` FOREIGN KEY (`id_condominio`) REFERENCES `condominio`(`id_condominio`),
	CONSTRAINT `bloco_id_condominio_nome_unique` UNIQUE(`id_condominio`,`nome`)
);
--> statement-breakpoint
CREATE TABLE `categoria_ocorrencia` (
	`id_categoria` text PRIMARY KEY,
	`id_condominio` text NOT NULL,
	`nome` text NOT NULL,
	`descricao` text,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text,
	CONSTRAINT `fk_categoria_ocorrencia_id_condominio_condominio_id_condominio_fk` FOREIGN KEY (`id_condominio`) REFERENCES `condominio`(`id_condominio`)
);
--> statement-breakpoint
CREATE TABLE `comunicado` (
	`id_comunicado` text PRIMARY KEY,
	`id_condominio` text NOT NULL,
	`id_tipo_comunicado` text NOT NULL,
	`id_autor` text NOT NULL,
	`titulo` text NOT NULL,
	`descricao` text,
	`status` text,
	`publicado_em` text,
	`expira_em` text,
	`criado_em` text NOT NULL,
	`atualizado_em` text,
	CONSTRAINT `fk_comunicado_id_condominio_condominio_id_condominio_fk` FOREIGN KEY (`id_condominio`) REFERENCES `condominio`(`id_condominio`),
	CONSTRAINT `fk_comunicado_id_tipo_comunicado_tipo_comunicado_id_tipo_comunicado_fk` FOREIGN KEY (`id_tipo_comunicado`) REFERENCES `tipo_comunicado`(`id_tipo_comunicado`),
	CONSTRAINT `fk_comunicado_id_autor_usuario_id_usuario_fk` FOREIGN KEY (`id_autor`) REFERENCES `usuario`(`id_usuario`)
);
--> statement-breakpoint
CREATE TABLE `morador_apartamento` (
	`id_vinculo` text PRIMARY KEY,
	`id_usuario` text NOT NULL,
	`id_apartamento` text NOT NULL,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text,
	CONSTRAINT `fk_morador_apartamento_id_usuario_usuario_id_usuario_fk` FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`),
	CONSTRAINT `fk_morador_apartamento_id_apartamento_apartamento_id_apartamento_fk` FOREIGN KEY (`id_apartamento`) REFERENCES `apartamento`(`id_apartamento`)
);
--> statement-breakpoint
CREATE TABLE `ocorrencia` (
	`id_ocorrencia` text PRIMARY KEY,
	`id_condominio` text NOT NULL,
	`id_autor` text NOT NULL,
	`id_bloco` text,
	`id_apartamento` text,
	`id_categoria` text NOT NULL,
	`id_status` text NOT NULL,
	`numero_protocolo` text NOT NULL UNIQUE,
	`titulo` text NOT NULL,
	`descricao` text,
	`aberta_em` text NOT NULL,
	`iniciada_em` text,
	`resolvida_em` text,
	`criada_em` text NOT NULL,
	`atualizada_em` text,
	CONSTRAINT `fk_ocorrencia_id_condominio_condominio_id_condominio_fk` FOREIGN KEY (`id_condominio`) REFERENCES `condominio`(`id_condominio`),
	CONSTRAINT `fk_ocorrencia_id_autor_usuario_id_usuario_fk` FOREIGN KEY (`id_autor`) REFERENCES `usuario`(`id_usuario`),
	CONSTRAINT `fk_ocorrencia_id_bloco_bloco_id_bloco_fk` FOREIGN KEY (`id_bloco`) REFERENCES `bloco`(`id_bloco`),
	CONSTRAINT `fk_ocorrencia_id_apartamento_apartamento_id_apartamento_fk` FOREIGN KEY (`id_apartamento`) REFERENCES `apartamento`(`id_apartamento`),
	CONSTRAINT `fk_ocorrencia_id_categoria_categoria_ocorrencia_id_categoria_fk` FOREIGN KEY (`id_categoria`) REFERENCES `categoria_ocorrencia`(`id_categoria`),
	CONSTRAINT `fk_ocorrencia_id_status_status_ocorrencia_id_status_fk` FOREIGN KEY (`id_status`) REFERENCES `status_ocorrencia`(`id_status`)
);
--> statement-breakpoint
CREATE TABLE `status_ocorrencia` (
	`id_status` text PRIMARY KEY,
	`nome` text NOT NULL UNIQUE,
	`cor_identificacao` text,
	`ordem_exibicao` integer,
	`ativo` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tipo_comunicado` (
	`id_tipo_comunicado` text PRIMARY KEY,
	`id_condominio` text NOT NULL,
	`nome` text NOT NULL,
	`cor_identificacao` text,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text,
	CONSTRAINT `fk_tipo_comunicado_id_condominio_condominio_id_condominio_fk` FOREIGN KEY (`id_condominio`) REFERENCES `condominio`(`id_condominio`)
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_condominio` (
	`id_condominio` text PRIMARY KEY,
	`nome` text NOT NULL,
	`razao_social` text,
	`cnpj` text UNIQUE,
	`email` text,
	`telefone` text,
	`cep` text,
	`logradouro` text,
	`numero` text,
	`complemento` text,
	`bairro` text,
	`cidade` text,
	`uf` text(2),
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` text NOT NULL,
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
	`id_condominio` text NOT NULL,
	`nome_completo` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`senha_hash` text NOT NULL,
	`codigo_acesso_hash` text,
	`telefone` text,
	`status` integer DEFAULT true NOT NULL,
	`is_sindico` integer DEFAULT false NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text,
	CONSTRAINT `fk_usuario_id_condominio_condominio_id_condominio_fk` FOREIGN KEY (`id_condominio`) REFERENCES `condominio`(`id_condominio`)
);
--> statement-breakpoint
INSERT INTO `__new_usuario`(`id_usuario`, `id_condominio`, `nome_completo`, `email`, `senha_hash`, `codigo_acesso_hash`, `telefone`, `status`, `is_sindico`, `criado_em`, `atualizado_em`) SELECT `id_usuario`, `id_condominio`, `nome_completo`, `email`, `senha_hash`, `codigo_acesso_hash`, `telefone`, `status`, `is_sindico`, `criado_em`, `atualizado_em` FROM `usuario`;--> statement-breakpoint
DROP TABLE `usuario`;--> statement-breakpoint
ALTER TABLE `__new_usuario` RENAME TO `usuario`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
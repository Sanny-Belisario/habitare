PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_comunicado` (
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
	CONSTRAINT `fk_comunicado_id_autor_usuario_id_usuario_fk` FOREIGN KEY (`id_autor`) REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_comunicado`(`id_comunicado`, `id_condominio`, `id_tipo_comunicado`, `id_autor`, `titulo`, `descricao`, `status`, `publicado_em`, `expira_em`, `criado_em`, `atualizado_em`) SELECT `id_comunicado`, `id_condominio`, `id_tipo_comunicado`, `id_autor`, `titulo`, `descricao`, `status`, `publicado_em`, `expira_em`, `criado_em`, `atualizado_em` FROM `comunicado`;--> statement-breakpoint
DROP TABLE `comunicado`;--> statement-breakpoint
ALTER TABLE `__new_comunicado` RENAME TO `comunicado`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_morador_apartamento` (
	`id_vinculo` text PRIMARY KEY,
	`id_usuario` text NOT NULL,
	`id_apartamento` text NOT NULL,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text,
	CONSTRAINT `fk_morador_apartamento_id_usuario_usuario_id_usuario_fk` FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE,
	CONSTRAINT `fk_morador_apartamento_id_apartamento_apartamento_id_apartamento_fk` FOREIGN KEY (`id_apartamento`) REFERENCES `apartamento`(`id_apartamento`)
);
--> statement-breakpoint
INSERT INTO `__new_morador_apartamento`(`id_vinculo`, `id_usuario`, `id_apartamento`, `ativo`, `criado_em`, `atualizado_em`) SELECT `id_vinculo`, `id_usuario`, `id_apartamento`, `ativo`, `criado_em`, `atualizado_em` FROM `morador_apartamento`;--> statement-breakpoint
DROP TABLE `morador_apartamento`;--> statement-breakpoint
ALTER TABLE `__new_morador_apartamento` RENAME TO `morador_apartamento`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ocorrencia` (
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
	`ativo` integer DEFAULT true NOT NULL,
	`criada_em` text NOT NULL,
	`atualizada_em` text,
	CONSTRAINT `fk_ocorrencia_id_condominio_condominio_id_condominio_fk` FOREIGN KEY (`id_condominio`) REFERENCES `condominio`(`id_condominio`),
	CONSTRAINT `fk_ocorrencia_id_autor_usuario_id_usuario_fk` FOREIGN KEY (`id_autor`) REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE,
	CONSTRAINT `fk_ocorrencia_id_bloco_bloco_id_bloco_fk` FOREIGN KEY (`id_bloco`) REFERENCES `bloco`(`id_bloco`),
	CONSTRAINT `fk_ocorrencia_id_apartamento_apartamento_id_apartamento_fk` FOREIGN KEY (`id_apartamento`) REFERENCES `apartamento`(`id_apartamento`),
	CONSTRAINT `fk_ocorrencia_id_categoria_categoria_ocorrencia_id_categoria_fk` FOREIGN KEY (`id_categoria`) REFERENCES `categoria_ocorrencia`(`id_categoria`),
	CONSTRAINT `fk_ocorrencia_id_status_status_ocorrencia_id_status_fk` FOREIGN KEY (`id_status`) REFERENCES `status_ocorrencia`(`id_status`)
);
--> statement-breakpoint
INSERT INTO `__new_ocorrencia`(`id_ocorrencia`, `id_condominio`, `id_autor`, `id_bloco`, `id_apartamento`, `id_categoria`, `id_status`, `numero_protocolo`, `titulo`, `descricao`, `aberta_em`, `iniciada_em`, `resolvida_em`, `ativo`, `criada_em`, `atualizada_em`) SELECT `id_ocorrencia`, `id_condominio`, `id_autor`, `id_bloco`, `id_apartamento`, `id_categoria`, `id_status`, `numero_protocolo`, `titulo`, `descricao`, `aberta_em`, `iniciada_em`, `resolvida_em`, `ativo`, `criada_em`, `atualizada_em` FROM `ocorrencia`;--> statement-breakpoint
DROP TABLE `ocorrencia`;--> statement-breakpoint
ALTER TABLE `__new_ocorrencia` RENAME TO `ocorrencia`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
import { boolean, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { randomUUID } from "expo-crypto";

// Espelho de src/db/sqlite/schema.ts. Mantenha os dois em paralelo.

export const condominio = pgTable("condominio", {
  // Sem geração automática: o UUID vem do app, o mesmo usado no SQLite.
  id: uuid("id_condominio")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  nome: text(),
  razaoSocial: text("razao_social"),
  cnpj: text().unique(),
  email: text(),
  telefone: text(),
  cep: text(),
  logradouro: text(),
  numero: integer(),
  complemento: text(),
  bairro: text(),
  cidade: text(),
  uf: text(),
  ativo: boolean().default(true),
  criadoEm: text("criado_em").$defaultFn(() => new Date().toLocaleDateString()),
  atualizadoEm: text("atualizado_em"),
});

export const usuario = pgTable("usuario", {
  id: uuid("id_usuario").primaryKey(),
  idCondominio: uuid("id_condominio").references(() => condominio.id),
  nome: text("nome_completo"),
  email: text().unique(),
  senha: text("senha_hash"),
  codigoAcesso: text("codigo_acesso_hash"),
  telefone: text(),
  status: boolean().default(true),
  isSindico: boolean("is_sindico"),
  criadoEm: text("criado_em").$defaultFn(() => new Date().toLocaleDateString()),
  atualizadoEm: text("atualizado_em"),
});

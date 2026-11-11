import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { randomUUID } from "expo-crypto";

export const condominio = sqliteTable("condominio", {
  // UUID gerado no app com Crypto.randomUUID(), o mesmo usado no Postgres.
  id: text("id_condominio")
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
  ativo: integer({ mode: "boolean" }).default(true),
  criadoEm: text("criado_em").$defaultFn(() => new Date().toLocaleDateString()),
  atualizadoEm: text("atualizado_em"),
});

export const usuario = sqliteTable("usuario", {
  id: text("id_usuario")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  idCondominio: text("id_condominio").references(() => condominio.id),
  nome: text("nome_completo"),
  email: text().unique(),
  senha: text("senha_hash"),
  codigoAcesso: text("codigo_acesso_hash"),
  telefone: text(),
  status: integer({ mode: "boolean" }).default(true),
  isSindico: integer("is_sindico", { mode: "boolean" }),
  criadoEm: text("criado_em").$defaultFn(() => new Date().toLocaleDateString()),
  atualizadoEm: text("atualizado_em"),
});

export const bloco = sqliteTable("bloco", {
  id: text("id_bloco")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  idCondominio: text("id_condominio").references(() => condominio.id),
  nome: text(),
  ativo: integer({ mode: "boolean" }),
  criadoEm: text("criado_em").$defaultFn(() => new Date().toLocaleDateString()),
  atualizadoEm: text("atualizado_em"),
});

export const apartamento = sqliteTable("apartamento", {
  id: text("id_apartamento")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  idBloco: text("id_bloco").references(() => bloco.id),
  nome: text(),
  statusOcupacao: integer("status_ocupacao", { mode: "boolean" }),
  ativo: integer({ mode: "boolean" }),
  criadoEm: text("criado_em").$defaultFn(() => new Date().toLocaleDateString()),
  atualizadoEm: text("atualizado_em"),
});

import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Espelho de src/db/sqlite/schema.ts. Mantenha os dois em paralelo.
// O app grava aqui pelo supabase-js, que não passa pelo Drizzle: os defaults
// precisam existir no próprio banco (defaultRandom, defaultNow), e não em $defaultFn.
// O id vem do app, o mesmo usado no SQLite; o defaultRandom só cobre inserts sem id.

const dataHora = (nome: string) =>
  timestamp(nome, { withTimezone: true, mode: "string" });

const criadoEm = (nome = "criado_em") => dataHora(nome).notNull().defaultNow();
const atualizadoEm = (nome = "atualizado_em") => dataHora(nome);

export const condominio = pgTable("condominio", {
  id: uuid("id_condominio").primaryKey().defaultRandom(),
  nome: text().notNull(),
  razaoSocial: text("razao_social"),
  cnpj: text().unique(),
  email: text(),
  telefone: text(),
  cep: text(),
  logradouro: text(),
  numero: text(), // texto: aceita "S/N", "120A"
  complemento: text(),
  bairro: text(),
  cidade: text(),
  uf: varchar({ length: 2 }),
  ativo: boolean().notNull().default(true),
  criadoEm: criadoEm(),
  atualizadoEm: atualizadoEm(),
});

export const usuario = pgTable("usuario", {
  id: uuid("id_usuario").primaryKey().defaultRandom(),
  idCondominio: uuid("id_condominio")
    .notNull()
    .references(() => condominio.id),
  nome: text("nome_completo").notNull(),
  email: text().notNull().unique(),
  senha: text("senha_hash").notNull(),
  codigoAcesso: text("codigo_acesso_hash"),
  telefone: text(),
  status: boolean().notNull().default(true),
  isSindico: boolean("is_sindico").notNull().default(false),
  criadoEm: criadoEm(),
  atualizadoEm: atualizadoEm(),
});

export const bloco = pgTable(
  "bloco",
  {
    id: uuid("id_bloco").primaryKey().defaultRandom(),
    idCondominio: uuid("id_condominio")
      .notNull()
      .references(() => condominio.id),
    nome: text().notNull(),
    ativo: boolean().notNull().default(true),
    criadoEm: criadoEm(),
    atualizadoEm: atualizadoEm(),
  },
  (t) => [unique().on(t.idCondominio, t.nome)],
);

export const apartamento = pgTable(
  "apartamento",
  {
    id: uuid("id_apartamento").primaryKey().defaultRandom(),
    idBloco: uuid("id_bloco")
      .notNull()
      .references(() => bloco.id),
    nome: text().notNull(),
    statusOcupacao: boolean("status_ocupacao").notNull().default(false),
    ativo: boolean().notNull().default(true),
    criadoEm: criadoEm(),
    atualizadoEm: atualizadoEm(),
  },
  (t) => [unique().on(t.idBloco, t.nome)],
);

export const moradorApartamento = pgTable("morador_apartamento", {
  id: uuid("id_vinculo").primaryKey().defaultRandom(),
  idUsuario: uuid("id_usuario")
    .notNull()
    .references(() => usuario.id),
  idApartamento: uuid("id_apartamento")
    .notNull()
    .references(() => apartamento.id),
  ativo: boolean().notNull().default(true),
  criadoEm: criadoEm(),
  atualizadoEm: atualizadoEm(),
});

export const statusOcorrencia = pgTable("status_ocorrencia", {
  id: uuid("id_status").primaryKey().defaultRandom(),
  nome: text().notNull().unique(),
  corIdentificacao: text("cor_identificacao"),
  ordemExibicao: integer("ordem_exibicao"),
  ativo: boolean().notNull().default(true),
});

export const categoriaOcorrencia = pgTable("categoria_ocorrencia", {
  id: uuid("id_categoria").primaryKey().defaultRandom(),
  idCondominio: uuid("id_condominio")
    .notNull()
    .references(() => condominio.id),
  nome: text().notNull(),
  descricao: text(),
  ativo: boolean().notNull().default(true),
  criadoEm: criadoEm(),
  atualizadoEm: atualizadoEm(),
});

export const ocorrencia = pgTable("ocorrencia", {
  id: uuid("id_ocorrencia").primaryKey().defaultRandom(),
  idCondominio: uuid("id_condominio")
    .notNull()
    .references(() => condominio.id),
  idAutor: uuid("id_autor")
    .notNull()
    .references(() => usuario.id),
  idBloco: uuid("id_bloco").references(() => bloco.id), // local opcional
  idApartamento: uuid("id_apartamento").references(() => apartamento.id), // local opcional
  idCategoria: uuid("id_categoria")
    .notNull()
    .references(() => categoriaOcorrencia.id),
  idStatus: uuid("id_status")
    .notNull()
    .references(() => statusOcorrencia.id),
  numeroProtocolo: text("numero_protocolo").notNull().unique(),
  titulo: text().notNull(),
  descricao: text(),
  abertaEm: dataHora("aberta_em").notNull().defaultNow(),
  iniciadaEm: dataHora("iniciada_em"),
  resolvidaEm: dataHora("resolvida_em"),
  criadaEm: criadoEm("criada_em"),
  atualizadaEm: atualizadoEm("atualizada_em"),
});

export const tipoComunicado = pgTable("tipo_comunicado", {
  id: uuid("id_tipo_comunicado").primaryKey().defaultRandom(),
  idCondominio: uuid("id_condominio")
    .notNull()
    .references(() => condominio.id),
  nome: text().notNull(),
  corIdentificacao: text("cor_identificacao"),
  ativo: boolean().notNull().default(true),
  criadoEm: criadoEm(),
  atualizadoEm: atualizadoEm(),
});

export const comunicado = pgTable("comunicado", {
  id: uuid("id_comunicado").primaryKey().defaultRandom(),
  idCondominio: uuid("id_condominio")
    .notNull()
    .references(() => condominio.id),
  idTipoComunicado: uuid("id_tipo_comunicado")
    .notNull()
    .references(() => tipoComunicado.id),
  idAutor: uuid("id_autor")
    .notNull()
    .references(() => usuario.id),
  titulo: text().notNull(),
  descricao: text(),
  status: text(),
  publicadoEm: dataHora("publicado_em"),
  expiraEm: dataHora("expira_em"),
  criadoEm: criadoEm(),
  atualizadoEm: atualizadoEm(),
});

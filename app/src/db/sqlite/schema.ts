import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

// require tardio: o expo-crypto depende do React Native e quebraria o drizzle-kit,
// que lê este arquivo no Node.
const novoId = (): string =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require("expo-crypto") as typeof import("expo-crypto")).randomUUID();

// Datas em ISO 8601 (UTC): ordenáveis como texto e independentes do idioma do aparelho.
const agora = () => new Date().toISOString();

const criadoEm = (nome = "criado_em") => text(nome).notNull().$defaultFn(agora);
const atualizadoEm = (nome = "atualizado_em") => text(nome).$onUpdateFn(agora);

export const condominio = sqliteTable("condominio", {
  id: text("id_condominio").primaryKey().$defaultFn(novoId),
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
  uf: text({ length: 2 }),
  ativo: integer({ mode: "boolean" }).notNull().default(true),
  criadoEm: criadoEm(),
  atualizadoEm: atualizadoEm(),
});

export const usuario = sqliteTable("usuario", {
  id: text("id_usuario").primaryKey().$defaultFn(novoId),
  idCondominio: text("id_condominio")
    .notNull()
    .references(() => condominio.id),
  nome: text("nome_completo").notNull(),
  email: text().notNull().unique(),
  senha: text("senha_hash").notNull(),
  codigoAcesso: text("codigo_acesso_hash"),
  telefone: text(),
  status: integer({ mode: "boolean" }).notNull().default(true),
  isSindico: integer("is_sindico", { mode: "boolean" })
    .notNull()
    .default(false),
  criadoEm: criadoEm(),
  atualizadoEm: atualizadoEm(),
});

export const bloco = sqliteTable(
  "bloco",
  {
    id: text("id_bloco").primaryKey().$defaultFn(novoId),
    idCondominio: text("id_condominio")
      .notNull()
      .references(() => condominio.id),
    nome: text().notNull(),
    ativo: integer({ mode: "boolean" }).notNull().default(true),
    criadoEm: criadoEm(),
    atualizadoEm: atualizadoEm(),
  },
  (t) => [unique().on(t.idCondominio, t.nome)],
);

export const apartamento = sqliteTable(
  "apartamento",
  {
    id: text("id_apartamento").primaryKey().$defaultFn(novoId),
    idBloco: text("id_bloco")
      .notNull()
      .references(() => bloco.id),
    nome: text().notNull(),
    statusOcupacao: integer("status_ocupacao", { mode: "boolean" })
      .notNull()
      .default(false),
    ativo: integer({ mode: "boolean" }).notNull().default(true),
    criadoEm: criadoEm(),
    atualizadoEm: atualizadoEm(),
  },
  (t) => [unique().on(t.idBloco, t.nome)],
);

export const moradorApartamento = sqliteTable("morador_apartamento", {
  id: text("id_vinculo").primaryKey().$defaultFn(novoId),
  idUsuario: text("id_usuario")
    .notNull()
    .references(() => usuario.id),
  idApartamento: text("id_apartamento")
    .notNull()
    .references(() => apartamento.id),
  ativo: integer({ mode: "boolean" }).notNull().default(true),
  criadoEm: criadoEm(),
  atualizadoEm: atualizadoEm(),
});

export const statusOcorrencia = sqliteTable("status_ocorrencia", {
  id: text("id_status").primaryKey().$defaultFn(novoId),
  nome: text().notNull().unique(),
  corIdentificacao: text("cor_identificacao"),
  ordemExibicao: integer("ordem_exibicao"),
  ativo: integer({ mode: "boolean" }).notNull().default(true),
});

export const categoriaOcorrencia = sqliteTable("categoria_ocorrencia", {
  id: text("id_categoria").primaryKey().$defaultFn(novoId),
  idCondominio: text("id_condominio")
    .notNull()
    .references(() => condominio.id),
  nome: text().notNull(),
  descricao: text(),
  ativo: integer({ mode: "boolean" }).notNull().default(true),
  criadoEm: criadoEm(),
  atualizadoEm: atualizadoEm(),
});

export const ocorrencia = sqliteTable("ocorrencia", {
  id: text("id_ocorrencia").primaryKey().$defaultFn(novoId),
  idCondominio: text("id_condominio")
    .notNull()
    .references(() => condominio.id),
  idAutor: text("id_autor")
    .notNull()
    .references(() => usuario.id),
  idBloco: text("id_bloco").references(() => bloco.id),
  idApartamento: text("id_apartamento").references(() => apartamento.id),
  idCategoria: text("id_categoria")
    .notNull()
    .references(() => categoriaOcorrencia.id),
  idStatus: text("id_status")
    .notNull()
    .references(() => statusOcorrencia.id),
  numeroProtocolo: text("numero_protocolo").notNull().unique(),
  titulo: text().notNull(),
  descricao: text(),
  abertaEm: text("aberta_em").notNull().$defaultFn(agora),
  iniciadaEm: text("iniciada_em"),
  resolvidaEm: text("resolvida_em"),
  criadaEm: criadoEm("criada_em"),
  atualizadaEm: atualizadoEm("atualizada_em"),
});

export const tipoComunicado = sqliteTable("tipo_comunicado", {
  id: text("id_tipo_comunicado").primaryKey().$defaultFn(novoId),
  idCondominio: text("id_condominio")
    .notNull()
    .references(() => condominio.id),
  nome: text().notNull(),
  corIdentificacao: text("cor_identificacao"),
  ativo: integer({ mode: "boolean" }).notNull().default(true),
  criadoEm: criadoEm(),
  atualizadoEm: atualizadoEm(),
});

export const comunicado = sqliteTable("comunicado", {
  id: text("id_comunicado").primaryKey().$defaultFn(novoId),
  idCondominio: text("id_condominio")
    .notNull()
    .references(() => condominio.id),
  idTipoComunicado: text("id_tipo_comunicado")
    .notNull()
    .references(() => tipoComunicado.id),
  idAutor: text("id_autor")
    .notNull()
    .references(() => usuario.id),
  titulo: text().notNull(),
  descricao: text(),
  status: text(),
  publicadoEm: text("publicado_em"),
  expiraEm: text("expira_em"),
  criadoEm: criadoEm(),
  atualizadoEm: atualizadoEm(),
});

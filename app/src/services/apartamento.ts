import { and, asc, eq, exists, inArray, ne, notExists, sql } from "drizzle-orm";

import { dbSqlite } from "@/db/sqlite";
import { apartamento, bloco, moradorApartamento } from "@/db/sqlite/schema";
import { sessao } from "@/services/sessao";
import type { Apartamento } from "@/types";

type BancoLocal = NonNullable<typeof dbSqlite>;
type DadosFormulario = { numero: string; idBloco: string | null };

const mensagemDuplicado = "Já existe um apartamento com esse número no bloco.";
const mensagemAusente = "Apartamento não encontrado.";
export const TABELAS_APARTAMENTOS = ["apartamento", "bloco", "morador_apartamento"];

function exigirGestaoApartamentos() {
  const usuario = sessao.obter();
  if (!usuario?.isSindico) throw new Error("Entre como síndico para gerenciar apartamentos.");
  if (!dbSqlite) throw new Error("O gerenciamento está disponível no aplicativo móvel.");
  return { db: dbSqlite, idCondominio: usuario.idCondominio };
}

function vinculosAtivos(db: BancoLocal) {
  return db.select({ id: moradorApartamento.id }).from(moradorApartamento).where(and(
    eq(moradorApartamento.idApartamento, apartamento.id),
    eq(moradorApartamento.ativo, true),
  ));
}

function consultarApartamentos(db: BancoLocal) {
  return db.select({
    id: apartamento.id,
    numero: apartamento.nome,
    idBloco: apartamento.idBloco,
    bloco: bloco.nome,
    ocupado: sql<boolean>`(${apartamento.statusOcupacao} or ${exists(vinculosAtivos(db))})`.mapWith(Boolean),
  })
    .from(apartamento)
    .innerJoin(bloco, eq(apartamento.idBloco, bloco.id));
}

function apartamentoAtivo(db: BancoLocal, idCondominio: string, id?: string) {
  return and(
    id === undefined ? undefined : eq(apartamento.id, id),
    eq(apartamento.ativo, true),
    inArray(apartamento.idBloco, db.select({ id: bloco.id }).from(bloco).where(and(
      eq(bloco.idCondominio, idCondominio),
      eq(bloco.ativo, true),
    ))),
  );
}

export async function listarApartamentos(): Promise<Apartamento[]> {
  const usuario = sessao.obter();
  if (!usuario || !dbSqlite) return [];

  return consultarApartamentos(dbSqlite)
    .where(apartamentoAtivo(dbSqlite, usuario.idCondominio))
    .orderBy(asc(bloco.nome), asc(apartamento.nome));
}

export async function buscarApartamentoParaEdicao(id: string) {
  const { db, idCondominio } = exigirGestaoApartamentos();
  return consultarApartamentos(db).where(apartamentoAtivo(db, idCondominio, id)).get() ?? null;
}

function normalizarNumero(valor: string) {
  return valor.trim().normalize("NFC").replace(/^apartamento(?:\s+|$)/i, "").trim();
}

export function tituloApartamento(numero: string) {
  const identificacao = normalizarNumero(numero);
  return identificacao ? `Apartamento ${identificacao}` : "Apartamento";
}

function validarFormulario(
  db: BancoLocal,
  idCondominio: string,
  { numero, idBloco }: DadosFormulario,
  idIgnorado?: string,
) {
  const nome = normalizarNumero(numero);
  if (!nome) throw new Error("Informe o número do apartamento.");
  if (!idBloco) throw new Error("Selecione um bloco.");

  const blocoSelecionado = db.select({ id: bloco.id }).from(bloco).where(and(
    eq(bloco.id, idBloco),
    eq(bloco.idCondominio, idCondominio),
    eq(bloco.ativo, true),
  )).get();
  if (!blocoSelecionado) throw new Error("Selecione um bloco ativo do condomínio.");

  const existentes = db.select({ numero: apartamento.nome }).from(apartamento).where(and(
    eq(apartamento.idBloco, idBloco),
    idIgnorado === undefined ? undefined : ne(apartamento.id, idIgnorado),
  )).all();
  const comparacao = nome.toLocaleLowerCase("pt-BR");
  if (existentes.some((item) => normalizarNumero(item.numero).toLocaleLowerCase("pt-BR") === comparacao)) {
    throw new Error(mensagemDuplicado);
  }
  return { nome, idBloco };
}

export function cadastrarApartamento(dados: DadosFormulario) {
  const { db, idCondominio } = exigirGestaoApartamentos();
  const valores = validarFormulario(db, idCondominio, dados);
  const criado = db.insert(apartamento).values(valores)
    .onConflictDoNothing({ target: [apartamento.idBloco, apartamento.nome] })
    .returning({ id: apartamento.id }).get();
  if (!criado) throw new Error(mensagemDuplicado);
}

export function editarApartamento(id: string, dados: DadosFormulario) {
  const { db, idCondominio } = exigirGestaoApartamentos();
  const escopo = apartamentoAtivo(db, idCondominio, id);
  const atual = db.select({ nome: apartamento.nome, idBloco: apartamento.idBloco })
    .from(apartamento).where(escopo).get();
  if (!atual) throw new Error(mensagemAusente);

  const valores = validarFormulario(db, idCondominio, dados, id);
  if (valores.nome === atual.nome && valores.idBloco === atual.idBloco) return;

  const alterado = db.update(apartamento).set(valores).where(escopo)
    .returning({ id: apartamento.id }).get();
  if (!alterado) throw new Error(mensagemAusente);
}

export function excluirApartamento(id: string) {
  const { db, idCondominio } = exigirGestaoApartamentos();
  const escopo = apartamentoAtivo(db, idCondominio, id);
  // A desativação sincroniza sem apagar vínculos e ocorrências antigas.
  const excluido = db.update(apartamento).set({ ativo: false })
    .where(and(escopo, eq(apartamento.statusOcupacao, false), notExists(vinculosAtivos(db))))
    .returning({ id: apartamento.id }).get();
  if (excluido) return;

  if (!db.select({ id: apartamento.id }).from(apartamento).where(escopo).get()) {
    throw new Error(mensagemAusente);
  }
  throw new Error("Apenas apartamentos livres e sem moradores vinculados podem ser excluídos.");
}

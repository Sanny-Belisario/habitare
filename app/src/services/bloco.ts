import { and, asc, eq, ne, notExists } from "drizzle-orm";

import { dbSqlite } from "@/db/sqlite";
import { apartamento, bloco } from "@/db/sqlite/schema";
import { sessao } from "@/services/sessao";
import type { Bloco } from "@/types";

const mensagemDuplicado = "Já existe um bloco com esse nome no condomínio.";
const mensagemAusente = "Bloco não encontrado.";
const colunasBloco = { id: bloco.id, nome: bloco.nome };

function exigirGestaoBlocos() {
  const usuario = sessao.obter();
  if (!usuario?.isSindico) throw new Error("Entre como síndico para gerenciar blocos.");
  if (!dbSqlite) throw new Error("O gerenciamento de blocos está disponível no aplicativo móvel.");
  return { db: dbSqlite, idCondominio: usuario.idCondominio };
}

function blocoAtivo(idCondominio: string, id?: string) {
  return and(
    eq(bloco.idCondominio, idCondominio),
    eq(bloco.ativo, true),
    id === undefined ? undefined : eq(bloco.id, id),
  );
}

export async function listarBlocos(): Promise<Bloco[]> {
  const usuario = sessao.obter();
  if (!usuario || !dbSqlite) return [];

  return dbSqlite
    .select(colunasBloco)
    .from(bloco)
    .where(blocoAtivo(usuario.idCondominio))
    .orderBy(asc(bloco.nome));
}

function normalizarNome(nome: string) {
  return nome.trim().normalize("NFC");
}

export async function buscarBlocoParaEdicao(id: string): Promise<Bloco | null> {
  const { db, idCondominio } = exigirGestaoBlocos();
  return db.select(colunasBloco).from(bloco).where(blocoAtivo(idCondominio, id)).get() ?? null;
}

function validarNome(
  db: NonNullable<typeof dbSqlite>,
  idCondominio: string,
  valor: string,
  idIgnorado?: string,
) {
  const nome = normalizarNome(valor);
  if (!nome) throw new Error("Informe o nome do bloco.");

  const nomeComparado = nome.toLocaleLowerCase("pt-BR");
  const existentes = db
    .select({ nome: bloco.nome })
    .from(bloco)
    .where(and(
      eq(bloco.idCondominio, idCondominio),
      idIgnorado === undefined ? undefined : ne(bloco.id, idIgnorado),
    ))
    .all();
  if (existentes.some((item) => normalizarNome(item.nome).toLocaleLowerCase("pt-BR") === nomeComparado)) {
    throw new Error(mensagemDuplicado);
  }
  return nome;
}

export function cadastrarBloco(valor: string) {
  const { db, idCondominio } = exigirGestaoBlocos();
  const nome = validarNome(db, idCondominio, valor);

  const criado = db
    .insert(bloco)
    .values({ idCondominio, nome })
    .onConflictDoNothing({ target: [bloco.idCondominio, bloco.nome] })
    .returning({ id: bloco.id })
    .get();
  if (!criado) throw new Error(mensagemDuplicado);
}

export function editarBloco(id: string, valor: string) {
  const { db, idCondominio } = exigirGestaoBlocos();
  const escopo = blocoAtivo(idCondominio, id);
  const atual = db.select(colunasBloco).from(bloco).where(escopo).get();
  if (!atual) throw new Error(mensagemAusente);

  const nome = validarNome(db, idCondominio, valor, id);
  if (nome === atual.nome) return;

  db.update(bloco).set({ nome }).where(escopo).run();
}

export function excluirBloco(id: string) {
  const { db, idCondominio } = exigirGestaoBlocos();
  const escopo = blocoAtivo(idCondominio, id);
  const apartamentosAtivos = db
    .select({ id: apartamento.id })
    .from(apartamento)
    .where(and(eq(apartamento.idBloco, id), eq(apartamento.ativo, true)));

  // A desativação é sincronizada e conserva as referências do histórico.
  const excluido = db.update(bloco).set({ ativo: false })
    .where(and(escopo, notExists(apartamentosAtivos)))
    .returning({ id: bloco.id }).get();
  if (excluido) return;

  if (!db.select({ id: bloco.id }).from(bloco).where(escopo).get()) {
    throw new Error(mensagemAusente);
  }
  throw new Error("O bloco ainda possui apartamentos ativos vinculados.");
}

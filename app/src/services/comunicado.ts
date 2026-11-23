import { and, asc, desc, eq, isNull, ne, or } from "drizzle-orm";

import { dbSqlite } from "@/db/sqlite";
import { comunicado, tipoComunicado } from "@/db/sqlite/schema";
import { sessao } from "@/services/sessao";

export const STATUS_EXCLUIDO = "excluido";

// Aceita avisos antigos que ainda não têm status.
export const comunicadoNaoExcluido = or(
  isNull(comunicado.status),
  ne(comunicado.status, STATUS_EXCLUIDO),
);

function exigirSindico() {
  const usuario = sessao.obter();
  if (!usuario?.isSindico) throw new Error("Entre como síndico para gerenciar comunicados.");
  if (!dbSqlite) throw new Error("O gerenciamento de comunicados está disponível no aplicativo móvel.");
  return { db: dbSqlite, usuario };
}

export async function listarComunicadosDoSindico() {
  const { db, usuario } = exigirSindico();
  return db
    .select({
      id: comunicado.id,
      titulo: comunicado.titulo,
      descricao: comunicado.descricao,
      tipo: tipoComunicado.nome,
    })
    .from(comunicado)
    .innerJoin(tipoComunicado, eq(comunicado.idTipoComunicado, tipoComunicado.id))
    .where(and(eq(comunicado.idCondominio, usuario.idCondominio), comunicadoNaoExcluido))
    .orderBy(desc(comunicado.publicadoEm), desc(comunicado.criadoEm));
}

function comunicadoDoCondominio(id: string, idCondominio: string) {
  return and(eq(comunicado.id, id), eq(comunicado.idCondominio, idCondominio), comunicadoNaoExcluido);
}

export async function carregarFormularioComunicado(id?: string) {
  const { db, usuario } = exigirSindico();
  const aviso = id
    ? db.select().from(comunicado).where(comunicadoDoCondominio(id, usuario.idCondominio)).get()
    : undefined;
  if (id && !aviso) throw new Error("Comunicado não encontrado.");

  const tipos = await db
    .select({ id: tipoComunicado.id, nome: tipoComunicado.nome })
    .from(tipoComunicado)
    .where(and(
      eq(tipoComunicado.idCondominio, usuario.idCondominio),
      eq(tipoComunicado.ativo, true),
    ))
    .orderBy(asc(tipoComunicado.nome));

  return { aviso, tipos };
}

interface DadosComunicado {
  titulo: string;
  descricao: string;
  idTipoComunicado: string | null;
}

export async function salvarComunicado(dados: DadosComunicado, id?: string) {
  const { db, usuario } = exigirSindico();
  const titulo = dados.titulo.trim();
  const descricao = dados.descricao.trim();
  const { idTipoComunicado } = dados;
  if (!titulo || !descricao || !idTipoComunicado) {
    throw new Error("Preencha o título, o tipo e a descrição.");
  }

  const tipo = db.select({ id: tipoComunicado.id }).from(tipoComunicado).where(and(
    eq(tipoComunicado.id, idTipoComunicado),
    eq(tipoComunicado.idCondominio, usuario.idCondominio),
    eq(tipoComunicado.ativo, true),
  )).get();
  if (!tipo) throw new Error("Selecione um tipo de comunicado disponível no condomínio.");

  const campos = { titulo, descricao, idTipoComunicado };
  if (id) {
    const alterado = db.update(comunicado).set(campos)
      .where(comunicadoDoCondominio(id, usuario.idCondominio))
      .returning({ id: comunicado.id }).get();
    if (!alterado) throw new Error("Comunicado não encontrado.");
    return;
  }

  db.insert(comunicado).values({
    ...campos,
    idCondominio: usuario.idCondominio,
    idAutor: usuario.id,
    status: "publicado",
    publicadoEm: new Date().toISOString(),
  }).run();
}

export async function excluirComunicado(id: string) {
  const { db, usuario } = exigirSindico();
  // O sincronizador replica alterações, então a exclusão é guardada no status.
  db.update(comunicado).set({ status: STATUS_EXCLUIDO })
    .where(comunicadoDoCondominio(id, usuario.idCondominio)).run();
}

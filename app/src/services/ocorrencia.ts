import { and, asc, desc, eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";

import { dbSqlite } from "@/db/sqlite";
import {
  apartamento,
  bloco,
  categoriaOcorrencia,
  moradorApartamento,
  ocorrencia,
  statusOcorrencia,
} from "@/db/sqlite/schema";
import { sessao } from "./sessao";

export interface OcorrenciaResumo {
  id: string;
  protocolo: string;
  titulo: string;
  bloco: string | null;
  categoria: string;
  status: string;
  corStatus: string | null;
  criadaEm: string;
}

export interface OcorrenciaFormulario {
  titulo: string;
  idCategoria: string;
  idBloco: string;
  idApartamento: string | null;
  descricao: string;
}

export interface Opcao {
  id: string;
  nome: string;
}

export const TABELAS_OCORRENCIA = [
  "ocorrencia",
  "status_ocorrencia",
  "categoria_ocorrencia",
  "bloco",
];

const STATUS_INICIAL = "Aberta";

export const ehResolvida = (status: string) =>
  status.trim().toLowerCase() === "resolvida";

export const ehAberta = (status: string) =>
  status.trim().toLowerCase() === STATUS_INICIAL.toLowerCase();

function exigirBanco() {
  if (!dbSqlite) throw new Error("O banco local não está disponível nesta plataforma.");
  return dbSqlite;
}

function exigirUsuario() {
  const usuario = sessao.obter();
  if (!usuario) throw new Error("Faça login novamente para continuar.");
  return usuario;
}

// "HAB-2026-0012" -> "#0012"
export const protocoloCurto = (protocolo: string) =>
  `#${protocolo.split("-").pop()}`;

// Único entre aparelhos sem consultar o servidor (a coluna é unique no Postgres).
const novoProtocolo = () =>
  `HAB-${new Date().getFullYear()}-${randomUUID().slice(0, 6).toUpperCase()}`;

// Ocorrências ativas abertas pelo usuário logado, das mais novas para as mais antigas.
export async function listarMinhasOcorrencias(): Promise<OcorrenciaResumo[]> {
  const usuario = sessao.obter();
  if (!dbSqlite || !usuario) return [];

  return dbSqlite
    .select({
      id: ocorrencia.id,
      protocolo: ocorrencia.numeroProtocolo,
      titulo: ocorrencia.titulo,
      bloco: bloco.nome,
      categoria: categoriaOcorrencia.nome,
      status: statusOcorrencia.nome,
      corStatus: statusOcorrencia.corIdentificacao,
      criadaEm: ocorrencia.criadaEm,
    })
    .from(ocorrencia)
    .innerJoin(statusOcorrencia, eq(ocorrencia.idStatus, statusOcorrencia.id))
    .innerJoin(
      categoriaOcorrencia,
      eq(ocorrencia.idCategoria, categoriaOcorrencia.id),
    )
    .leftJoin(bloco, eq(ocorrencia.idBloco, bloco.id))
    .where(and(eq(ocorrencia.idAutor, usuario.id), eq(ocorrencia.ativo, true)))
    .orderBy(desc(ocorrencia.criadaEm));
}

export async function buscarOcorrencia(id: string) {
  const db = exigirBanco();
  const [linha] = await db
    .select({
      titulo: ocorrencia.titulo,
      idCategoria: ocorrencia.idCategoria,
      idBloco: ocorrencia.idBloco,
      idApartamento: ocorrencia.idApartamento,
      descricao: ocorrencia.descricao,
      status: statusOcorrencia.nome,
    })
    .from(ocorrencia)
    .innerJoin(statusOcorrencia, eq(ocorrencia.idStatus, statusOcorrencia.id))
    .where(eq(ocorrencia.id, id))
    .limit(1);
  return linha ?? null;
}

// Opções dos campos de seleção da tela de nova ocorrência.
export async function carregarOpcoesFormulario() {
  const db = exigirBanco();
  const usuario = exigirUsuario();

  const [categorias, blocos, apartamentos, vinculos] = await Promise.all([
    db
      .select({ id: categoriaOcorrencia.id, nome: categoriaOcorrencia.nome })
      .from(categoriaOcorrencia)
      .where(
        and(
          eq(categoriaOcorrencia.idCondominio, usuario.idCondominio),
          eq(categoriaOcorrencia.ativo, true),
        ),
      )
      .orderBy(asc(categoriaOcorrencia.nome)),
    db
      .select({ id: bloco.id, nome: bloco.nome })
      .from(bloco)
      .where(
        and(eq(bloco.idCondominio, usuario.idCondominio), eq(bloco.ativo, true)),
      )
      .orderBy(asc(bloco.nome)),
    db
      .select({
        id: apartamento.id,
        nome: apartamento.nome,
        idBloco: apartamento.idBloco,
      })
      .from(apartamento)
      .innerJoin(bloco, eq(apartamento.idBloco, bloco.id))
      .where(
        and(
          eq(bloco.idCondominio, usuario.idCondominio),
          eq(apartamento.ativo, true),
        ),
      )
      .orderBy(asc(apartamento.nome)),
    // Apartamento do morador, para já vir preenchido.
    db
      .select({ idApartamento: apartamento.id, idBloco: apartamento.idBloco })
      .from(moradorApartamento)
      .innerJoin(apartamento, eq(moradorApartamento.idApartamento, apartamento.id))
      .where(
        and(
          eq(moradorApartamento.idUsuario, usuario.id),
          eq(moradorApartamento.ativo, true),
        ),
      )
      .limit(1),
  ]);

  return { categorias, blocos, apartamentos, meuApartamento: vinculos[0] ?? null };
}

export async function criarOcorrencia(dados: OcorrenciaFormulario) {
  const db = exigirBanco();
  const usuario = exigirUsuario();

  const [status] = await db
    .select({ id: statusOcorrencia.id })
    .from(statusOcorrencia)
    .where(eq(statusOcorrencia.nome, STATUS_INICIAL))
    .limit(1);
  if (!status) {
    throw new Error(
      `O status "${STATUS_INICIAL}" ainda não foi sincronizado. Conecte-se à internet e tente novamente.`,
    );
  }

  await db.insert(ocorrencia).values({
    idCondominio: usuario.idCondominio,
    idAutor: usuario.id,
    idStatus: status.id,
    numeroProtocolo: novoProtocolo(),
    titulo: dados.titulo.trim(),
    idCategoria: dados.idCategoria,
    idBloco: dados.idBloco,
    idApartamento: dados.idApartamento,
    descricao: dados.descricao.trim() || null,
  });
}

export async function atualizarOcorrencia(id: string, dados: OcorrenciaFormulario) {
  const db = exigirBanco();
  const usuario = exigirUsuario();

  await db
    .update(ocorrencia)
    .set({
      titulo: dados.titulo.trim(),
      idCategoria: dados.idCategoria,
      idBloco: dados.idBloco,
      idApartamento: dados.idApartamento,
      descricao: dados.descricao.trim() || null,
    })
    .where(and(eq(ocorrencia.id, id), eq(ocorrencia.idAutor, usuario.id)));
}

// Exclusão lógica: a sincronização não propaga DELETE, então só desativa.
export async function excluirOcorrencia(id: string) {
  const db = exigirBanco();
  const usuario = exigirUsuario();

  await db
    .update(ocorrencia)
    .set({ ativo: false })
    .where(and(eq(ocorrencia.id, id), eq(ocorrencia.idAutor, usuario.id)));
}

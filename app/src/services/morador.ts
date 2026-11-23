import bcrypt from "bcryptjs";
import { and, asc, desc, eq, exists, inArray, isNotNull, ne } from "drizzle-orm";
import { getRandomBytesAsync } from "expo-crypto";

import { dbSqlite } from "@/db/sqlite";
import { apartamento, bloco, moradorApartamento, usuario } from "@/db/sqlite/schema";
import { guardarCodigoLocal, lerCodigoLocal, removerCodigoLocal } from "@/services/codigo-acesso-local";
import {
  codigosPendentes,
  desmarcarCodigoPendente,
  marcarCodigoPendente,
  operarCodigoRemoto,
} from "@/services/codigo-acesso-remoto";
import { sessao } from "@/services/sessao";
import { emailNormalizadoIgual } from "@/services/usuario";
import type { Morador } from "@/types";

export const TABELAS_MORADORES = ["usuario", "morador_apartamento", "apartamento", "bloco"];

interface DadosMorador {
  nome: string;
  email: string;
  telefone: string;
  idBloco: string | null;
  idApartamento: string | null;
}

type BancoLocal = NonNullable<typeof dbSqlite>;
type TransacaoLocal = Pick<BancoLocal, "select" | "insert" | "update">;
const mensagemAusente = "Morador não encontrado.";

function exigirGestaoMoradores() {
  const sindico = sessao.obter();
  if (!sindico?.isSindico) throw new Error("Entre como síndico para gerenciar moradores.");
  if (!dbSqlite) throw new Error("O gerenciamento está disponível no aplicativo móvel.");
  return { db: dbSqlite, sindico };
}

function moradoresDoCondominio(idCondominio: string) {
  return and(
    eq(usuario.idCondominio, idCondominio),
    eq(usuario.isSindico, false),
    eq(usuario.excluido, false),
  );
}

export async function listarMoradores(): Promise<Morador[]> {
  const sindico = sessao.obter();
  if (!sindico?.isSindico || !dbSqlite) return [];

  const registros = await dbSqlite.select({
    id: usuario.id,
    nome: usuario.nome,
    bloco: bloco.nome,
    apartamento: apartamento.nome,
    ativo: usuario.status,
    temCodigoAcesso: isNotNull(usuario.codigoAcesso).mapWith(Boolean),
  })
    .from(usuario)
    .leftJoin(moradorApartamento, and(
      eq(moradorApartamento.idUsuario, usuario.id),
      eq(moradorApartamento.ativo, true),
    ))
    .leftJoin(apartamento, eq(apartamento.id, moradorApartamento.idApartamento))
    .leftJoin(bloco, and(eq(bloco.id, apartamento.idBloco), eq(bloco.idCondominio, sindico.idCondominio)))
    .where(moradoresDoCondominio(sindico.idCondominio))
    .orderBy(asc(usuario.nome), desc(moradorApartamento.criadoEm), asc(moradorApartamento.id));

  const moradores = new Map<string, Morador>();
  for (const registro of registros) {
    if (moradores.has(registro.id)) continue;
    moradores.set(registro.id, registro.bloco ? registro : { ...registro, apartamento: null });
  }
  return [...moradores.values()];
}

function vinculosAtivos(idUsuario: string) {
  return and(eq(moradorApartamento.idUsuario, idUsuario), eq(moradorApartamento.ativo, true));
}

function buscarVinculos(tx: TransacaoLocal, idUsuario: string) {
  return tx.select({ idApartamento: moradorApartamento.idApartamento })
    .from(moradorApartamento)
    .where(vinculosAtivos(idUsuario))
    .orderBy(desc(moradorApartamento.criadoEm), asc(moradorApartamento.id))
    .all();
}

export async function buscarMoradorParaEdicao(id: string) {
  const { db, sindico } = exigirGestaoMoradores();
  const morador = db.select({ id: usuario.id, nome: usuario.nome, email: usuario.email, telefone: usuario.telefone })
    .from(usuario)
    .where(and(moradoresDoCondominio(sindico.idCondominio), eq(usuario.id, id)))
    .get();
  if (!morador) return null;

  const unidade = db.select({ idApartamento: apartamento.id, idBloco: bloco.id })
    .from(moradorApartamento)
    .innerJoin(apartamento, eq(apartamento.id, moradorApartamento.idApartamento))
    .innerJoin(bloco, eq(bloco.id, apartamento.idBloco))
    .where(and(
      vinculosAtivos(morador.id),
      eq(apartamento.ativo, true),
      eq(bloco.ativo, true),
      eq(bloco.idCondominio, sindico.idCondominio),
    ))
    .orderBy(desc(moradorApartamento.criadoEm), asc(moradorApartamento.id))
    .get();
  return {
    ...morador,
    idBloco: unidade?.idBloco ?? null,
    idApartamento: unidade?.idApartamento ?? null,
  };
}

function hexadecimal(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validarDados(dados: DadosMorador, editando: boolean) {
  const nome = dados.nome.trim();
  const email = dados.email.trim().toLowerCase();
  const telefone = dados.telefone.trim();

  if (!nome) throw new Error("Informe o nome completo.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Informe um e-mail válido.");
  const digitos = telefone.replace(/\D/g, "");
  if ((!editando || telefone) && (!/^\+?[\d\s().-]+$/.test(telefone) || digitos.length < 10 || digitos.length > 15)) {
    throw new Error("Informe um telefone válido com DDD.");
  }
  return { nome, email, telefone: telefone || null };
}

function validarUnidade(tx: TransacaoLocal, idCondominio: string, idBloco: string, idApartamento: string) {
  const unidade = tx.select({ id: apartamento.id }).from(apartamento)
    .innerJoin(bloco, eq(bloco.id, apartamento.idBloco))
    .where(and(
      eq(apartamento.id, idApartamento),
      eq(apartamento.ativo, true),
      eq(bloco.id, idBloco),
      eq(bloco.ativo, true),
      eq(bloco.idCondominio, idCondominio),
    )).get();
  if (!unidade) throw new Error("Selecione um apartamento ativo do bloco escolhido.");
}

function validarEmailDisponivel(tx: TransacaoLocal, email: string, idAtual?: string) {
  const duplicado = tx.select({ id: usuario.id }).from(usuario).where(and(
    emailNormalizadoIgual(email),
    idAtual === undefined ? undefined : ne(usuario.id, idAtual),
  )).get();
  if (duplicado) throw new Error("Já existe uma conta com esse e-mail.");
}

function recalcularOcupacao(tx: TransacaoLocal, idCondominio: string, ids: string[]) {
  if (!ids.length) return;
  const blocos = tx.select({ id: bloco.id }).from(bloco).where(eq(bloco.idCondominio, idCondominio));
  const ocupado = exists(tx.select({ id: moradorApartamento.id }).from(moradorApartamento).where(and(
    eq(moradorApartamento.idApartamento, apartamento.id),
    eq(moradorApartamento.ativo, true),
  )));
  tx.update(apartamento).set({ statusOcupacao: ocupado })
    .where(and(
      inArray(apartamento.id, ids),
      inArray(apartamento.idBloco, blocos),
      ne(apartamento.statusOcupacao, ocupado),
    )).run();
}

export async function cadastrarMorador(dados: DadosMorador, sinal?: AbortSignal) {
  const { db, sindico } = exigirGestaoMoradores();
  const valores = validarDados(dados, false);
  const { idBloco, idApartamento } = dados;
  if (!idBloco || !idApartamento) throw new Error("Selecione o bloco e o apartamento.");

  const bytes = await getRandomBytesAsync(44);
  const codigo = hexadecimal(bytes.subarray(0, 12)).toUpperCase();
  // A coluna da senha é obrigatória. A conta começa com acesso somente pelo código.
  const [senhaHash, codigoHash] = await Promise.all([
    bcrypt.hash(hexadecimal(bytes.subarray(12)), 10),
    bcrypt.hash(codigo, 10),
  ]);

  if (sinal?.aborted || sessao.obter() !== sindico) {
    throw new Error("O cadastro foi interrompido.");
  }

  const idMorador = db.transaction((tx) => {
    validarUnidade(tx, sindico.idCondominio, idBloco, idApartamento);
    validarEmailDisponivel(tx, valores.email);

    const morador = tx.insert(usuario).values({
      idCondominio: sindico.idCondominio,
      ...valores,
      senha: senhaHash,
      codigoAcesso: codigoHash,
    }).onConflictDoNothing({ target: usuario.email }).returning({ id: usuario.id }).get();
    if (!morador) throw new Error("Já existe uma conta com esse e-mail.");

    tx.insert(moradorApartamento).values({ idUsuario: morador.id, idApartamento }).run();
    recalcularOcupacao(tx, sindico.idCondominio, [idApartamento]);
    return morador.id;
  });

  let codigoGuardado = false;
  try {
    await guardarCodigoLocal(idMorador, codigoHash, codigo);
    marcarCodigoPendente(idMorador);
    codigoGuardado = true;
  } catch {
    // O cadastro local continua válido e o código fica disponível na confirmação.
  }
  return { email: valores.email, codigo, codigoGuardado };
}

function buscarHashCodigo(db: BancoLocal, id: string, idCondominio: string) {
  const morador = db.select({ hash: usuario.codigoAcesso }).from(usuario)
    .where(and(moradoresDoCondominio(idCondominio), eq(usuario.id, id)))
    .get();
  if (!morador) throw new Error(mensagemAusente);
  return morador.hash;
}

async function publicarCodigoLocal(id: string, hash: string, sinal?: AbortSignal) {
  const conta = sessao.obter();
  if (sinal?.aborted) return null;
  const codigo = await lerCodigoLocal(id, hash);
  if (sinal?.aborted || sessao.obter() !== conta) return null;
  if (!codigo) {
    desmarcarCodigoPendente(id);
    return null;
  }
  const publicado = await operarCodigoRemoto(id, "publicar", { codigo, hash }, sinal);
  if (publicado) {
    desmarcarCodigoPendente(id);
    void removerCodigoLocal(id, hash).catch(() => {});
  }
  return publicado;
}

export async function consultarCodigoMorador(id: string, sinal?: AbortSignal) {
  const { db, sindico } = exigirGestaoMoradores();
  const hash = buscarHashCodigo(db, id, sindico.idCondominio);
  const codigo = await operarCodigoRemoto(id, "consultar", undefined, sinal);
  if (codigo || !hash) return codigo;
  // Migra os códigos emitidos por versões que guardavam apenas no aparelho.
  const publicado = await publicarCodigoLocal(id, hash, sinal);
  return publicado ?? operarCodigoRemoto(id, "consultar", undefined, sinal);
}

export async function renovarCodigoMorador(id: string, sinal?: AbortSignal) {
  const { db, sindico } = exigirGestaoMoradores();
  const anterior = buscarHashCodigo(db, id, sindico.idCondominio);
  const codigo = await operarCodigoRemoto(id, "renovar", undefined, sinal);
  if (!codigo) throw new Error("O Supabase não retornou o novo código.");
  desmarcarCodigoPendente(id);
  if (anterior) void removerCodigoLocal(id, anterior).catch(() => {});
  return codigo;
}

export async function publicarCodigosPendentes() {
  const conta = sessao.obter();
  const db = dbSqlite;
  if (!conta?.isSindico || !db) return;
  const ids = codigosPendentes();
  if (ids.length === 0) return;

  const pendentes = db.select({ id: usuario.id, hash: usuario.codigoAcesso }).from(usuario)
    .where(and(moradoresDoCondominio(conta.idCondominio), inArray(usuario.id, ids))).all();
  for (const { id, hash } of pendentes) {
    if (sessao.obter() !== conta) return;
    if (!hash) continue;
    try {
      await publicarCodigoLocal(id, hash);
    } catch {
      // Conserva a fila para a próxima sincronização após uma falha de rede ou autorização.
    }
  }
}

export function editarMorador(id: string, dados: DadosMorador) {
  const { db, sindico } = exigirGestaoMoradores();
  const valores = validarDados(dados, true);
  const { idBloco, idApartamento } = dados;
  if (!!idBloco !== !!idApartamento) throw new Error("Selecione o bloco e o apartamento.");

  db.transaction((tx) => {
    const escopo = and(moradoresDoCondominio(sindico.idCondominio), eq(usuario.id, id));
    const atual = tx.select({ nome: usuario.nome, email: usuario.email, telefone: usuario.telefone })
      .from(usuario).where(escopo).get();
    if (!atual) throw new Error(mensagemAusente);
    if (idBloco && idApartamento) validarUnidade(tx, sindico.idCondominio, idBloco, idApartamento);

    const email = dados.email.trim() === atual.email.trim() ? atual.email : valores.email;
    if (email !== atual.email) validarEmailDisponivel(tx, email, id);
    if (valores.nome !== atual.nome || email !== atual.email || valores.telefone !== atual.telefone) {
      tx.update(usuario).set({ ...valores, email }).where(escopo).run();
    }

    const vinculos = buscarVinculos(tx, id);
    if ((vinculos[0]?.idApartamento ?? null) === idApartamento) return;

    const idsAfetados = vinculos.map((vinculo) => vinculo.idApartamento);
    tx.update(moradorApartamento).set({ ativo: false }).where(and(
      vinculosAtivos(id),
      idApartamento ? ne(moradorApartamento.idApartamento, idApartamento) : undefined,
    )).run();

    if (idApartamento) {
      if (!idsAfetados.includes(idApartamento)) {
        tx.insert(moradorApartamento).values({ idUsuario: id, idApartamento }).run();
        idsAfetados.push(idApartamento);
      }
    }
    recalcularOcupacao(tx, sindico.idCondominio, idsAfetados);
  });
}

export function excluirMorador(id: string) {
  const { db, sindico } = exigirGestaoMoradores();
  const hash = db.transaction((tx) => {
    const removido = tx.update(usuario).set({ status: false, excluido: true })
      .where(and(moradoresDoCondominio(sindico.idCondominio), eq(usuario.id, id)))
      .returning({ hash: usuario.codigoAcesso }).get();
    if (!removido) throw new Error(mensagemAusente);

    const vinculos = buscarVinculos(tx, id);
    tx.update(moradorApartamento).set({ ativo: false }).where(vinculosAtivos(id)).run();
    recalcularOcupacao(tx, sindico.idCondominio, vinculos.map((vinculo) => vinculo.idApartamento));
    return removido.hash;
  });
  desmarcarCodigoPendente(id);
  if (hash) void removerCodigoLocal(id, hash).catch(() => {});
}

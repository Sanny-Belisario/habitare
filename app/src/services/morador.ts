import bcrypt from "bcryptjs";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { getRandomBytesAsync } from "expo-crypto";

import { dbSqlite } from "@/db/sqlite";
import { apartamento, bloco, moradorApartamento, usuario } from "@/db/sqlite/schema";
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
    .where(and(eq(usuario.idCondominio, sindico.idCondominio), eq(usuario.isSindico, false)))
    .orderBy(asc(usuario.nome), desc(moradorApartamento.criadoEm), asc(moradorApartamento.id));

  const moradores = new Map<string, Morador>();
  for (const registro of registros) {
    if (moradores.has(registro.id)) continue;
    moradores.set(registro.id, registro.bloco ? registro : { ...registro, apartamento: null });
  }
  return [...moradores.values()];
}

function hexadecimal(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function cadastrarMorador(dados: DadosMorador, sinal?: AbortSignal) {
  const sindico = sessao.obter();
  if (!sindico?.isSindico) throw new Error("Entre como síndico para cadastrar moradores.");
  if (!dbSqlite) throw new Error("O cadastro está disponível no aplicativo móvel.");

  const nome = dados.nome.trim();
  const email = dados.email.trim().toLowerCase();
  const telefone = dados.telefone.trim();
  const { idBloco, idApartamento } = dados;

  if (!nome) throw new Error("Informe o nome completo.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Informe um e-mail válido.");
  const digitos = telefone.replace(/\D/g, "");
  if (!/^\+?[\d\s().-]+$/.test(telefone) || digitos.length < 10 || digitos.length > 15) {
    throw new Error("Informe um telefone válido com DDD.");
  }
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

  dbSqlite.transaction((tx) => {
    const unidade = tx.select({ id: apartamento.id }).from(apartamento)
      .innerJoin(bloco, eq(bloco.id, apartamento.idBloco))
      .where(and(
        eq(apartamento.id, idApartamento),
        eq(apartamento.ativo, true),
        eq(bloco.id, idBloco),
        eq(bloco.ativo, true),
        eq(bloco.idCondominio, sindico.idCondominio),
      )).get();
    if (!unidade) throw new Error("Selecione um apartamento ativo do bloco escolhido.");

    const duplicado = tx.select({ id: usuario.id }).from(usuario).where(emailNormalizadoIgual(email)).get();
    if (duplicado) throw new Error("Já existe uma conta com esse e-mail.");

    const morador = tx.insert(usuario).values({
      idCondominio: sindico.idCondominio,
      nome,
      email,
      telefone,
      senha: senhaHash,
      codigoAcesso: codigoHash,
    }).onConflictDoNothing({ target: usuario.email }).returning({ id: usuario.id }).get();
    if (!morador) throw new Error("Já existe uma conta com esse e-mail.");

    tx.insert(moradorApartamento).values({ idUsuario: morador.id, idApartamento }).run();
    tx.update(apartamento).set({ statusOcupacao: true })
      .where(and(eq(apartamento.id, idApartamento), eq(apartamento.statusOcupacao, false))).run();
  });

  return { email, codigo };
}

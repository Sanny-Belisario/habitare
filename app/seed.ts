// Popula o Postgres (Supabase) com dados de exemplo. Rode com `npm run db:seed`.
// Os aparelhos recebem esses dados pela sincronização (src/services/sincronizacao.ts).
//
// Pode rodar mais de uma vez: cada registro é procurado pela sua chave natural
// (e-mail, CNPJ, nome do bloco...) e só é inserido se ainda não existir.
//
// Logins criados:
//   síndico:  sindico@habitare.com / sindico123
//   morador:  joao@habitare.com    / morador123  (e luisa@, carlos@ com a mesma senha)

import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { and, eq, type InferInsertModel, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as s from "./src/db/postgres/schema";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida no .env.local");
}

const cliente = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle({ client: cliente });

// Devolve o id do registro que atende `onde`, inserindo `valores` se não existir.
async function garantir<T extends PgTable>(
  tabela: T,
  colunaId: PgColumn,
  onde: SQL | undefined,
  valores: InferInsertModel<T>,
): Promise<string> {
  const [existente] = await db
    .select({ id: colunaId })
    .from(tabela as PgTable)
    .where(onde)
    .limit(1);
  if (existente) return existente.id as string;

  const [novo] = await db
    .insert(tabela)
    .values(valores as never)
    .returning({ id: colunaId });
  return novo.id as string;
}

const horasAtras = (h: number) =>
  new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

async function main() {
  // Condomínio
  const idCondominio = await garantir(
    s.condominio,
    s.condominio.id,
    eq(s.condominio.cnpj, "12.345.678/0001-90"),
    {
      nome: "Condomínio Aurora",
      razaoSocial: "Condomínio Residencial Aurora",
      cnpj: "12.345.678/0001-90",
      email: "contato@condominioaurora.com.br",
      telefone: "(27) 3333-4444",
      cep: "29100-000",
      logradouro: "Rua das Palmeiras",
      numero: "120",
      bairro: "Centro",
      cidade: "Vila Velha",
      uf: "ES",
    },
  );

  // Blocos e apartamentos
  const blocos: Record<string, string> = {};
  const apartamentos: Record<string, string> = {};
  for (const letra of ["A", "B", "C"]) {
    const nomeBloco = `Bloco ${letra}`;
    blocos[letra] = await garantir(
      s.bloco,
      s.bloco.id,
      and(eq(s.bloco.idCondominio, idCondominio), eq(s.bloco.nome, nomeBloco)),
      { idCondominio, nome: nomeBloco },
    );
    for (const numero of ["101", "102", "201", "202", "301", "304"]) {
      apartamentos[`${letra}${numero}`] = await garantir(
        s.apartamento,
        s.apartamento.id,
        and(
          eq(s.apartamento.idBloco, blocos[letra]),
          eq(s.apartamento.nome, numero),
        ),
        { idBloco: blocos[letra], nome: numero },
      );
    }
  }

  // Usuários
  const senhaSindico = await bcrypt.hash("sindico123", 10);
  const senhaMorador = await bcrypt.hash("morador123", 10);

  const usuarios = [
    { email: "sindico@habitare.com", nome: "Ana Paula Souza", sindico: true, codigo: "100200", apto: null },
    { email: "joao@habitare.com", nome: "João Luís", sindico: false, codigo: "482913", apto: "A304" },
    { email: "luisa@habitare.com", nome: "Luísa Moraes", sindico: false, codigo: "731045", apto: "C201" },
    { email: "carlos@habitare.com", nome: "Carlos Henrique Lima", sindico: false, codigo: "559320", apto: "B102" },
  ];

  const idsUsuario: Record<string, string> = {};
  for (const u of usuarios) {
    idsUsuario[u.email] = await garantir(
      s.usuario,
      s.usuario.id,
      eq(s.usuario.email, u.email),
      {
        idCondominio,
        nome: u.nome,
        email: u.email,
        senha: u.sindico ? senhaSindico : senhaMorador,
        codigoAcesso: await bcrypt.hash(u.codigo, 10),
        isSindico: u.sindico,
      },
    );

    if (u.apto) {
      const idApartamento = apartamentos[u.apto];
      await garantir(
        s.moradorApartamento,
        s.moradorApartamento.id,
        and(
          eq(s.moradorApartamento.idUsuario, idsUsuario[u.email]),
          eq(s.moradorApartamento.idApartamento, idApartamento),
        ),
        { idUsuario: idsUsuario[u.email], idApartamento },
      );
      await db
        .update(s.apartamento)
        .set({ statusOcupacao: true, atualizadoEm: new Date().toISOString() })
        .where(
          and(
            eq(s.apartamento.id, idApartamento),
            eq(s.apartamento.statusOcupacao, false),
          ),
        );
    }
  }
  const idSindico = idsUsuario["sindico@habitare.com"];

  // Status das ocorrências
  const status: Record<string, string> = {};
  for (const [nome, cor, ordem] of [
    ["Aberta", "#D9822B", 1],
    ["Em andamento", "#2E8B7A", 2],
    ["Resolvida", "#2E7D32", 3],
  ] as const) {
    status[nome] = await garantir(
      s.statusOcorrencia,
      s.statusOcorrencia.id,
      eq(s.statusOcorrencia.nome, nome),
      { nome, corIdentificacao: cor, ordemExibicao: ordem },
    );
  }

  // Categorias
  const categorias: Record<string, string> = {};
  for (const [nome, descricao] of [
    ["Manutenção", "Reparos hidráulicos, elétricos e estruturais"],
    ["Limpeza", "Limpeza das áreas comuns"],
    ["Segurança", "Portões, câmeras e acesso"],
    ["Barulho", "Perturbação do sossego"],
  ]) {
    categorias[nome] = await garantir(
      s.categoriaOcorrencia,
      s.categoriaOcorrencia.id,
      and(
        eq(s.categoriaOcorrencia.idCondominio, idCondominio),
        eq(s.categoriaOcorrencia.nome, nome),
      ),
      { idCondominio, nome, descricao },
    );
  }

  // Ocorrências: 12 no total, 9 resolvidas (75% de resolução, 3 pendentes).
  const ocorrencias: {
    titulo: string;
    bloco: string | null;
    categoria: string;
    status: keyof typeof status;
    horas: number;
    autor: string;
  }[] = [
    { titulo: "Vazamento no corredor", bloco: "B", categoria: "Manutenção", status: "Aberta", horas: 2, autor: "carlos@habitare.com" },
    { titulo: "Portão da garagem", bloco: "A", categoria: "Segurança", status: "Em andamento", horas: 26, autor: "joao@habitare.com" },
    { titulo: "Luz do hall apagada", bloco: "C", categoria: "Manutenção", status: "Resolvida", horas: 30, autor: "luisa@habitare.com" },
    { titulo: "Interfone sem sinal", bloco: "A", categoria: "Manutenção", status: "Aberta", horas: 50, autor: "joao@habitare.com" },
    { titulo: "Lixo acumulado na lixeira", bloco: "B", categoria: "Limpeza", status: "Resolvida", horas: 72, autor: "carlos@habitare.com" },
    { titulo: "Som alto após as 22h", bloco: "C", categoria: "Barulho", status: "Resolvida", horas: 96, autor: "luisa@habitare.com" },
    { titulo: "Câmera da entrada desligada", bloco: null, categoria: "Segurança", status: "Resolvida", horas: 120, autor: "joao@habitare.com" },
    { titulo: "Infiltração na garagem", bloco: "A", categoria: "Manutenção", status: "Resolvida", horas: 168, autor: "joao@habitare.com" },
    { titulo: "Piscina sem limpeza", bloco: null, categoria: "Limpeza", status: "Resolvida", horas: 200, autor: "luisa@habitare.com" },
    { titulo: "Elevador parado", bloco: "B", categoria: "Manutenção", status: "Resolvida", horas: 240, autor: "carlos@habitare.com" },
    { titulo: "Lâmpada da escada queimada", bloco: "C", categoria: "Manutenção", status: "Resolvida", horas: 300, autor: "luisa@habitare.com" },
    { titulo: "Portão social travando", bloco: "A", categoria: "Segurança", status: "Resolvida", horas: 360, autor: "joao@habitare.com" },
  ];

  for (const [i, o] of ocorrencias.entries()) {
    const numeroProtocolo = `HAB-2026-${String(i + 1).padStart(4, "0")}`;
    const abertaEm = horasAtras(o.horas);
    await garantir(
      s.ocorrencia,
      s.ocorrencia.id,
      eq(s.ocorrencia.numeroProtocolo, numeroProtocolo),
      {
        idCondominio,
        idAutor: idsUsuario[o.autor],
        idBloco: o.bloco ? blocos[o.bloco] : null,
        idCategoria: categorias[o.categoria],
        idStatus: status[o.status],
        numeroProtocolo,
        titulo: o.titulo,
        descricao: `${o.titulo}. Registrada pelo morador pelo aplicativo.`,
        abertaEm,
        iniciadaEm: o.status === "Aberta" ? null : horasAtras(o.horas - 1),
        resolvidaEm: o.status === "Resolvida" ? horasAtras(o.horas - 12) : null,
        criadaEm: abertaEm,
      },
    );
  }

  // Tipos de comunicado e comunicados (os mesmos de src/data/comunicados.ts)
  const tipos: Record<string, string> = {};
  for (const [nome, cor] of [
    ["Manutenção", "#D9822B"],
    ["Reunião", "#243B7A"],
    ["Informação", "#2E8B7A"],
  ]) {
    tipos[nome] = await garantir(
      s.tipoComunicado,
      s.tipoComunicado.id,
      and(
        eq(s.tipoComunicado.idCondominio, idCondominio),
        eq(s.tipoComunicado.nome, nome),
      ),
      { idCondominio, nome, corIdentificacao: cor },
    );
  }

  for (const c of [
    {
      tipo: "Manutenção",
      titulo: "Manutenção programada",
      descricao:
        "A limpeza da caixa d'água do condomínio será realizada em 31/10. Durante o serviço, poderá haver interrupção temporária no abastecimento. Agradecemos a compreensão de todos.",
    },
    {
      tipo: "Reunião",
      titulo: "Assembleia de moradores",
      descricao:
        "Convidamos os moradores para a assembleia do condomínio, na quarta-feira, às 19h30, no salão de reuniões. Serão tratados assuntos de interesse comum. Contamos com a participação de todos.",
    },
    {
      tipo: "Informação",
      titulo: "Novo horário da piscina",
      descricao:
        "Informamos que a piscina passa a funcionar em novo horário, das 8h às 20h, todos os dias. Pedimos que as regras de uso e convivência sejam respeitadas.",
    },
  ]) {
    await garantir(
      s.comunicado,
      s.comunicado.id,
      and(
        eq(s.comunicado.idCondominio, idCondominio),
        eq(s.comunicado.titulo, c.titulo),
      ),
      {
        idCondominio,
        idTipoComunicado: tipos[c.tipo],
        idAutor: idSindico,
        titulo: c.titulo,
        descricao: c.descricao,
        status: "publicado",
        publicadoEm: new Date().toISOString(),
      },
    );
  }

  console.log("Seed concluído.");
}

main()
  .catch((erro) => {
    console.error("Erro no seed:", erro);
    process.exitCode = 1;
  })
  .finally(() => cliente.end());

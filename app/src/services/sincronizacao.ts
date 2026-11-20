import * as schema from "@/db/sqlite/schema";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getColumns, getTableName, type Column } from "drizzle-orm";
import type { SQLiteAsyncDatabase, SQLiteTable } from "drizzle-orm/sqlite-core";

// O banco local chega por parâmetro (e não importado de @/db/sqlite) para a
// sincronização também rodar fora do app, com outro driver SQLite, em testes.
type BancoLocal = SQLiteAsyncDatabase<"sync", unknown>;
type Linha = Record<string, unknown>;

type Coluna<T extends SQLiteTable> = keyof T["_"]["columns"] & string;

interface Tabela<T extends SQLiteTable> {
  tabela: T;
  // Colunas timestamptz no Postgres (texto ISO no SQLite).
  datas: Coluna<T>[];
  // [criação, última alteração]. Sem elas, só se copia o registro que falta:
  // não há como saber qual lado é o mais novo.
  versao?: [Coluna<T>, Coluna<T>];
  // Restrições unique além da PK, cada uma com suas colunas.
  unicos?: Coluna<T>[][];
}

type TabelaSincronizada = {
  tabela: SQLiteTable;
  datas: string[];
  versao?: [string, string];
  unicos?: string[][];
};

const tabela = <T extends SQLiteTable>(t: Tabela<T>) =>
  t as unknown as TabelaSincronizada;

// Em ordem de dependência: o pai chega ao destino antes do filho que aponta para ele.
const TABELAS: TabelaSincronizada[] = [
  tabela({
    tabela: schema.condominio,
    datas: ["criadoEm", "atualizadoEm"],
    versao: ["criadoEm", "atualizadoEm"],
    unicos: [["cnpj"]],
  }),
  tabela({
    tabela: schema.usuario,
    datas: ["criadoEm", "atualizadoEm"],
    versao: ["criadoEm", "atualizadoEm"],
    unicos: [["email"]],
  }),
  tabela({
    tabela: schema.bloco,
    datas: ["criadoEm", "atualizadoEm"],
    versao: ["criadoEm", "atualizadoEm"],
    unicos: [["idCondominio", "nome"]],
  }),
  tabela({
    tabela: schema.apartamento,
    datas: ["criadoEm", "atualizadoEm"],
    versao: ["criadoEm", "atualizadoEm"],
    unicos: [["idBloco", "nome"]],
  }),
  tabela({
    tabela: schema.moradorApartamento,
    datas: ["criadoEm", "atualizadoEm"],
    versao: ["criadoEm", "atualizadoEm"],
  }),
  tabela({
    tabela: schema.statusOcorrencia,
    datas: [],
    unicos: [["nome"]],
  }),
  tabela({
    tabela: schema.categoriaOcorrencia,
    datas: ["criadoEm", "atualizadoEm"],
    versao: ["criadoEm", "atualizadoEm"],
  }),
  tabela({
    tabela: schema.ocorrencia,
    datas: [
      "abertaEm",
      "iniciadaEm",
      "resolvidaEm",
      "criadaEm",
      "atualizadaEm",
    ],
    versao: ["criadaEm", "atualizadaEm"],
    unicos: [["numeroProtocolo"]],
  }),
  tabela({
    tabela: schema.tipoComunicado,
    datas: ["criadoEm", "atualizadoEm"],
    versao: ["criadoEm", "atualizadoEm"],
  }),
  tabela({
    tabela: schema.comunicado,
    datas: ["publicadoEm", "expiraEm", "criadoEm", "atualizadoEm"],
    versao: ["criadoEm", "atualizadoEm"],
  }),
];

// O PostgREST devolve no máximo 1000 linhas por requisição.
const TAMANHO_PAGINA = 1000;
const TAMANHO_LOTE_ENVIO = 500;

export interface ResultadoTabela {
  enviados: number; // SQLite -> Postgres
  recebidos: number; // Postgres -> SQLite
  conflitos: string[]; // ids diferentes com o mesmo valor de uma coluna unique
}

export type ResultadoSincronizacao = Record<string, ResultadoTabela>;

// O Postgres devolve microssegundos e "+00:00" ("2026-11-12T23:07:58.123456+00:00").
// Corta para milissegundos e converte para o mesmo ISO em UTC que o SQLite usa.
function normalizarData(data: unknown): string | null {
  if (typeof data !== "string" || !data) return null;
  return new Date(data.replace(/(\.\d{3})\d+/, "$1")).toISOString();
}

// Versão do registro: a última alteração, ou a criação se nunca foi alterado.
function versao(linha: Linha, [criacao, alteracao]: [string, string]) {
  const data = normalizarData(linha[alteracao] ?? linha[criacao]);
  return data ? new Date(data).getTime() : 0;
}

export class Sincronizacao {
  constructor(
    private readonly local: BancoLocal,
    private readonly remoto: SupabaseClient,
  ) {}

  // Sincroniza todas as tabelas nos dois sentidos, casando os registros pelo id.
  // Quem só existe de um lado é copiado para o outro; quem existe nos dois fica
  // com a versão de atualizado_em (ou criado_em) mais recente.
  // Exclusões não são propagadas: um registro apagado de um lado volta do outro.
  async sincronizar(): Promise<ResultadoSincronizacao> {
    const resultado: ResultadoSincronizacao = {};
    for (const t of TABELAS) {
      resultado[getTableName(t.tabela)] = await this.sincronizarTabela(t);
    }
    return resultado;
  }

  private async sincronizarTabela(
    t: TabelaSincronizada,
  ): Promise<ResultadoTabela> {
    const nome = getTableName(t.tabela);
    const colunas = Object.entries(getColumns(t.tabela)) as [string, Column][];
    const [chave, colunaChave] = colunas.find(([, c]) => c.primary)!;
    const datas = new Set(t.datas);

    // supabase-js usa os nomes das colunas no banco (id_usuario), o Drizzle os
    // nomes das propriedades do schema (id).
    const paraPostgres = (linha: Linha): Linha =>
      Object.fromEntries(colunas.map(([prop, c]) => [c.name, linha[prop]]));
    const paraSqlite = (linha: Linha): Linha =>
      Object.fromEntries(
        colunas.map(([prop, c]) => {
          const valor = linha[c.name];
          return [prop, datas.has(prop) ? normalizarData(valor) : valor];
        }),
      );

    const locais: Linha[] = await this.local.select().from(t.tabela);
    const remotos = (await this.buscarRemotos(nome, colunaChave.name)).map(
      paraSqlite,
    );

    const locaisPorId = new Map(locais.map((l) => [l[chave], l]));
    const remotosPorId = new Map(remotos.map((r) => [r[chave], r]));

    // Para cada unique, o valor -> id de quem o usa em cada lado.
    const chaveUnica = (linha: Linha, cols: string[]) =>
      JSON.stringify(cols.map((c) => linha[c]));
    const indexar = (linhas: Linha[]) =>
      (t.unicos ?? []).map(
        (cols) => new Map(linhas.map((l) => [chaveUnica(l, cols), l[chave]])),
      );
    const unicosLocais = indexar(locais);
    const unicosRemotos = indexar(remotos);

    // Um registro novo não pode ser copiado se o destino já tem outro id com o
    // mesmo valor numa coluna unique (o mesmo e-mail cadastrado nos dois lados).
    const conflitos = new Set<string>();
    const emConflito = (linha: Linha, destino: Map<string, unknown>[]) => {
      const bate = (t.unicos ?? []).find((cols, i) => {
        const id = destino[i].get(chaveUnica(linha, cols));
        return id !== undefined && id !== linha[chave];
      });
      if (bate) conflitos.add(`${bate.join("+")}=${chaveUnica(linha, bate)}`);
      return bate !== undefined;
    };

    const paraEnviar: Linha[] = [];
    const paraReceber: Linha[] = [];

    for (const local of locais) {
      const remoto = remotosPorId.get(local[chave]);
      if (!remoto) {
        if (!emConflito(local, unicosRemotos)) paraEnviar.push(local);
      } else if (t.versao) {
        const vLocal = versao(local, t.versao);
        const vRemoto = versao(remoto, t.versao);
        if (vLocal > vRemoto) paraEnviar.push(local);
        else if (vRemoto > vLocal) paraReceber.push(remoto);
      }
    }

    for (const remoto of remotos) {
      if (locaisPorId.has(remoto[chave])) continue;
      if (!emConflito(remoto, unicosLocais)) paraReceber.push(remoto);
    }

    if (conflitos.size > 0) {
      console.warn(`Sincronização de ${nome}: valores únicos em conflito`, [
        ...conflitos,
      ]);
    }

    for (let i = 0; i < paraEnviar.length; i += TAMANHO_LOTE_ENVIO) {
      const lote = paraEnviar.slice(i, i + TAMANHO_LOTE_ENVIO);
      const { error } = await this.remoto
        .from(nome)
        .upsert(lote.map(paraPostgres), { onConflict: colunaChave.name });
      if (error) {
        throw new Error(`Erro ao enviar ${nome} ao Postgres: ${error.message}`);
      }
    }

    if (paraReceber.length > 0) {
      // Drivers síncronos (expo-sqlite) não aceitam callback async na transação.
      this.local.transaction((tx) => {
        for (const remoto of paraReceber) {
          const { [chave]: _id, ...campos } = remoto;
          // atualizadoEm vai explícito para o $onUpdateFn não trocar pela hora atual.
          tx.insert(t.tabela)
            .values(remoto)
            .onConflictDoUpdate({ target: colunaChave, set: campos })
            .run();
        }
      });
    }

    return {
      enviados: paraEnviar.length,
      recebidos: paraReceber.length,
      conflitos: [...conflitos],
    };
  }

  private async buscarRemotos(nome: string, colunaChave: string) {
    const linhas: Linha[] = [];
    for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
      const { data, error } = await this.remoto
        .from(nome)
        .select("*")
        .order(colunaChave)
        .range(inicio, inicio + TAMANHO_PAGINA - 1);
      if (error) {
        throw new Error(`Erro ao buscar ${nome} no Postgres: ${error.message}`);
      }
      linhas.push(...(data as Linha[]));
      if (data.length < TAMANHO_PAGINA) return linhas;
    }
  }
}

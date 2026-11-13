import { supabase } from "@/db/postgres";
import { dbSqlite } from "@/db/sqlite";
import { condominio, usuario } from "@/db/sqlite/schema";
import { inArray } from "drizzle-orm";

// Linhas como o supabase-js devolve: chaves com o nome das colunas no Postgres.
interface UsuarioPostgres {
  id_usuario: string;
  id_condominio: string;
  nome_completo: string;
  email: string;
  senha_hash: string;
  codigo_acesso_hash: string | null;
  telefone: string | null;
  status: boolean;
  is_sindico: boolean;
  criado_em: string;
  atualizado_em: string | null;
}

interface CondominioPostgres {
  id_condominio: string;
  nome: string;
  razao_social: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string | null;
}

type UsuarioSqlite = typeof usuario.$inferSelect;
type CondominioSqlite = typeof condominio.$inferSelect;

export interface ResultadoSincronizacao {
  enviados: number; // SQLite -> Postgres
  recebidos: number; // Postgres -> SQLite
  conflitos: string[]; // e-mails com ids diferentes nos dois bancos
}

// O Postgres devolve microssegundos e "+00:00" ("2026-11-12T23:07:58.123456+00:00").
// Corta para milissegundos e converte para o mesmo ISO em UTC que o SQLite usa.
function normalizarData(data: string): string;
function normalizarData(data: string | null): string | null;
function normalizarData(data: string | null) {
  if (!data) return null;
  return new Date(data.replace(/(\.\d{3})\d+/, "$1")).toISOString();
}

// Versão do registro: a última alteração, ou a criação se nunca foi alterado.
const versao = (criadoEm: string, atualizadoEm: string | null) =>
  new Date(normalizarData(atualizadoEm ?? criadoEm)).getTime();

const usuarioParaSqlite = (u: UsuarioPostgres): UsuarioSqlite => ({
  id: u.id_usuario,
  idCondominio: u.id_condominio,
  nome: u.nome_completo,
  email: u.email,
  senha: u.senha_hash,
  codigoAcesso: u.codigo_acesso_hash,
  telefone: u.telefone,
  status: u.status,
  isSindico: u.is_sindico,
  criadoEm: normalizarData(u.criado_em),
  atualizadoEm: normalizarData(u.atualizado_em),
});

const usuarioParaPostgres = (u: UsuarioSqlite): UsuarioPostgres => ({
  id_usuario: u.id,
  id_condominio: u.idCondominio,
  nome_completo: u.nome,
  email: u.email,
  senha_hash: u.senha,
  codigo_acesso_hash: u.codigoAcesso,
  telefone: u.telefone,
  status: u.status,
  is_sindico: u.isSindico,
  criado_em: u.criadoEm,
  atualizado_em: u.atualizadoEm,
});

const condominioParaSqlite = (c: CondominioPostgres): CondominioSqlite => ({
  id: c.id_condominio,
  nome: c.nome,
  razaoSocial: c.razao_social,
  cnpj: c.cnpj,
  email: c.email,
  telefone: c.telefone,
  cep: c.cep,
  logradouro: c.logradouro,
  numero: c.numero,
  complemento: c.complemento,
  bairro: c.bairro,
  cidade: c.cidade,
  uf: c.uf,
  ativo: c.ativo,
  criadoEm: normalizarData(c.criado_em),
  atualizadoEm: normalizarData(c.atualizado_em),
});

const condominioParaPostgres = (c: CondominioSqlite): CondominioPostgres => ({
  id_condominio: c.id,
  nome: c.nome,
  razao_social: c.razaoSocial,
  cnpj: c.cnpj,
  email: c.email,
  telefone: c.telefone,
  cep: c.cep,
  logradouro: c.logradouro,
  numero: c.numero,
  complemento: c.complemento,
  bairro: c.bairro,
  cidade: c.cidade,
  uf: c.uf,
  ativo: c.ativo,
  criado_em: c.criadoEm,
  atualizado_em: c.atualizadoEm,
});

export class Sincronizacao {
  // Sincroniza a tabela usuario nos dois sentidos, casando os registros pelo id.
  // Quem só existe de um lado é copiado para o outro; quem existe nos dois fica
  // com a versão de atualizado_em (ou criado_em) mais recente.
  async usuarios(): Promise<ResultadoSincronizacao> {
    const locais = await dbSqlite.select().from(usuario);

    const { data, error } = await supabase.from("usuario").select("*");
    if (error) {
      throw new Error(`Erro ao buscar usuários no Postgres: ${error.message}`);
    }
    const remotos = (data ?? []) as UsuarioPostgres[];

    const locaisPorId = new Map(locais.map((u) => [u.id, u]));
    const remotosPorId = new Map(remotos.map((u) => [u.id_usuario, u]));
    const remotosPorEmail = new Map(remotos.map((u) => [u.email, u]));
    const locaisPorEmail = new Map(locais.map((u) => [u.email, u]));

    const paraEnviar: UsuarioSqlite[] = [];
    const paraReceber: UsuarioPostgres[] = [];
    const conflitos: string[] = [];

    for (const local of locais) {
      const remoto = remotosPorId.get(local.id);

      if (!remoto) {
        // O e-mail é unique: o mesmo e-mail com outro id não pode ser copiado.
        if (remotosPorEmail.has(local.email)) conflitos.push(local.email);
        else paraEnviar.push(local);
        continue;
      }

      const vLocal = versao(local.criadoEm, local.atualizadoEm);
      const vRemoto = versao(remoto.criado_em, remoto.atualizado_em);
      if (vLocal > vRemoto) paraEnviar.push(local);
      else if (vRemoto > vLocal) paraReceber.push(remoto);
    }

    for (const remoto of remotos) {
      if (locaisPorId.has(remoto.id_usuario)) continue;
      if (locaisPorEmail.has(remoto.email)) {
        if (!conflitos.includes(remoto.email)) conflitos.push(remoto.email);
      } else {
        paraReceber.push(remoto);
      }
    }

    if (conflitos.length > 0) {
      console.warn("Usuários com o mesmo e-mail e ids diferentes:", conflitos);
    }

    if (paraEnviar.length > 0) {
      await this.enviarCondominios(paraEnviar.map((u) => u.idCondominio));

      const { error: erroEnvio } = await supabase
        .from("usuario")
        .upsert(paraEnviar.map(usuarioParaPostgres), {
          onConflict: "id_usuario",
        });
      if (erroEnvio) {
        throw new Error(
          `Erro ao enviar usuários ao Postgres: ${erroEnvio.message}`,
        );
      }
    }

    if (paraReceber.length > 0) {
      await this.receberCondominios(paraReceber.map((u) => u.id_condominio));

      for (const remoto of paraReceber) {
        const { id, ...campos } = usuarioParaSqlite(remoto);
        // atualizadoEm vai explícito para o $onUpdateFn não trocar pela hora atual.
        await dbSqlite
          .insert(usuario)
          .values({ id, ...campos })
          .onConflictDoUpdate({ target: usuario.id, set: campos });
      }
    }

    return {
      enviados: paraEnviar.length,
      recebidos: paraReceber.length,
      conflitos,
    };
  }

  // A FK usuario -> condominio exige que o condomínio exista no destino.
  // Aqui só se copia o condomínio que falta; a sincronização completa da
  // tabela condominio fica para quando ela tiver o próprio método.
  private async enviarCondominios(ids: string[]) {
    const unicos = [...new Set(ids)];

    const { data, error } = await supabase
      .from("condominio")
      .select("id_condominio")
      .in("id_condominio", unicos);
    if (error) {
      throw new Error(`Erro ao buscar condomínios no Postgres: ${error.message}`);
    }

    const existentes = new Set(
      (data as Pick<CondominioPostgres, "id_condominio">[]).map(
        (c) => c.id_condominio,
      ),
    );
    const faltando = unicos.filter((id) => !existentes.has(id));
    if (faltando.length === 0) return;

    const locais = await dbSqlite
      .select()
      .from(condominio)
      .where(inArray(condominio.id, faltando));

    const { error: erroEnvio } = await supabase
      .from("condominio")
      .insert(locais.map(condominioParaPostgres));
    if (erroEnvio) {
      throw new Error(
        `Erro ao enviar condomínios ao Postgres: ${erroEnvio.message}`,
      );
    }
  }

  private async receberCondominios(ids: string[]) {
    const unicos = [...new Set(ids)];

    const existentes = new Set(
      (
        await dbSqlite
          .select({ id: condominio.id })
          .from(condominio)
          .where(inArray(condominio.id, unicos))
      ).map((c) => c.id),
    );
    const faltando = unicos.filter((id) => !existentes.has(id));
    if (faltando.length === 0) return;

    const { data, error } = await supabase
      .from("condominio")
      .select("*")
      .in("id_condominio", faltando);
    if (error) {
      throw new Error(`Erro ao buscar condomínios no Postgres: ${error.message}`);
    }

    const remotos = (data ?? []) as CondominioPostgres[];
    if (remotos.length > 0) {
      await dbSqlite.insert(condominio).values(remotos.map(condominioParaSqlite));
    }
  }
}

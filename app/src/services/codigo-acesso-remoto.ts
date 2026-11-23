import { criarClienteAdmin } from "@/db/postgres";
import { sessao, type UsuarioLogado } from "@/services/sessao";

type ClienteAdmin = NonNullable<ReturnType<typeof criarClienteAdmin>>;
let acesso: { conta: UsuarioLogado; cliente: ClienteAdmin; autenticado: Promise<boolean> } | null = null;

sessao.inscrever(() => {
  if (acesso && sessao.obter() !== acesso.conta) acesso = null;
});

export function iniciarAcessoAdministrativo(conta: UsuarioLogado, email: string, senha: string) {
  const cliente = criarClienteAdmin();
  if (!cliente) return;

  acesso = {
    conta,
    cliente,
    autenticado: cliente.auth.signInWithPassword({ email, password: senha })
      .then(({ data, error }) => !!data.session && !error, () => false),
  };
}

async function obterAcessoAdministrativo() {
  const atual = acesso;
  if (!atual || !(await atual.autenticado) || atual !== acesso || sessao.obter() !== atual.conta) {
    throw new Error("Entre com a senha de administrador cadastrada no Supabase para consultar os códigos.");
  }
  return atual;
}

export async function operarCodigoRemoto(
  id: string,
  acao: "consultar" | "publicar" | "renovar",
  dados?: { codigo: string; hash: string },
  sinal?: AbortSignal,
) {
  const atual = await obterAcessoAdministrativo();
  if (sinal?.aborted) throw new Error("A operação foi interrompida.");
  const consulta = atual.cliente.rpc("habitare_codigo_morador", {
    p_id: id,
    p_acao: acao,
    ...(dados ? { p_codigo: dados.codigo, p_hash: dados.hash } : {}),
  });
  const { data, error } = await (sinal ? consulta.abortSignal(sinal) : consulta);
  if (sinal?.aborted || sessao.obter() !== atual.conta) throw new Error("A operação foi interrompida.");
  if (error) {
    if (error.code === "42501") throw new Error("Esta conta administrativa não tem acesso ao código deste condomínio.");
    if (error.code === "PGRST202") throw new Error("O serviço de códigos ainda não foi ativado no Supabase.");
    if (error.code === "22023") throw new Error("A versão local do código ainda não corresponde ao cadastro sincronizado.");
    throw new Error("Não foi possível acessar os códigos no Supabase. Confira a conexão e tente novamente.");
  }
  return typeof data === "string" ? data : null;
}

const prefixo = "habitare.codigo-pendente.";

export function marcarCodigoPendente(id: string) {
  localStorage.setItem(prefixo + id, "1");
}

export function desmarcarCodigoPendente(id: string) {
  try {
    localStorage.removeItem(prefixo + id);
  } catch {
    // Uma falha local na limpeza não invalida uma operação confirmada no servidor.
  }
}

export function codigosPendentes() {
  const ids: string[] = [];
  if (!acesso || sessao.obter() !== acesso.conta) return ids;
  for (let i = 0; i < localStorage.length; i += 1) {
    const chave = localStorage.key(i);
    if (chave?.startsWith(prefixo)) ids.push(chave.slice(prefixo.length));
  }
  return ids;
}

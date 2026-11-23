import { supabase } from "@/db/postgres";
import { sessao, type UsuarioLogado } from "@/services/sessao";

// Credenciais do síndico, só em memória, usadas pelo servidor para autorizar o acesso aos códigos.
let acesso: { conta: UsuarioLogado; email: string; senha: string } | null = null;

sessao.inscrever(() => {
  if (acesso && sessao.obter() !== acesso.conta) acesso = null;
});

export function iniciarAcessoAdministrativo(conta: UsuarioLogado, email: string, senha: string) {
  acesso = { conta, email, senha };
}

export function acessoRemotoDisponivel() {
  return !!supabase && !!acesso && sessao.obter() === acesso.conta;
}

function obterAcessoAdministrativo() {
  const atual = acesso;
  if (!supabase) throw new Error("O Supabase não está configurado neste aplicativo.");
  if (!atual || sessao.obter() !== atual.conta) throw new Error("Entre novamente como síndico para consultar os códigos.");
  return { ...atual, cliente: supabase };
}

export async function operarCodigoRemoto(
  id: string,
  acao: "consultar" | "publicar" | "renovar",
  dados?: { codigo: string; hash: string },
  sinal?: AbortSignal,
) {
  const atual = obterAcessoAdministrativo();
  if (sinal?.aborted) throw new Error("A operação foi interrompida.");
  const consulta = atual.cliente.rpc("habitare_codigo_morador", {
    p_email: atual.email,
    p_senha: atual.senha,
    p_id: id,
    p_acao: acao,
    ...(dados ? { p_codigo: dados.codigo, p_hash: dados.hash } : {}),
  });
  const { data, error } = await (sinal ? consulta.abortSignal(sinal) : consulta);
  if (sinal?.aborted || sessao.obter() !== atual.conta) throw new Error("A operação foi interrompida.");
  if (error) {
    if (error.code === "42501") throw new Error("Não foi possível validar o síndico no Supabase. Aguarde a sincronização e tente novamente.");
    if (error.code === "P0002") throw new Error("Este morador ainda não foi sincronizado. Tente novamente em instantes.");
    if (error.code === "PGRST202") throw new Error("O serviço de códigos ainda não foi atualizado no Supabase.");
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
  if (!acessoRemotoDisponivel()) return ids;
  for (let i = 0; i < localStorage.length; i += 1) {
    const chave = localStorage.key(i);
    if (chave?.startsWith(prefixo)) ids.push(chave.slice(prefixo.length));
  }
  return ids;
}

// Usuário logado, só em memória: ao fechar o app é preciso logar de novo.
export interface UsuarioLogado {
  id: string;
  nome: string;
  idCondominio: string;
  isSindico: boolean;
}

let usuarioAtual: UsuarioLogado | null = null;
const ouvintes = new Set<() => void>();

function atualizar(usuario: UsuarioLogado | null) {
  if (usuarioAtual === usuario) return;
  usuarioAtual = usuario;
  for (const ouvir of ouvintes) ouvir();
}

export const sessao = {
  definir(usuario: UsuarioLogado) {
    atualizar(usuario);
  },
  obter() {
    return usuarioAtual;
  },
  limpar() {
    atualizar(null);
  },
  inscrever(ouvir: () => void) {
    ouvintes.add(ouvir);
    return () => { ouvintes.delete(ouvir); };
  },
};

// Usuário logado, só em memória: ao fechar o app é preciso logar de novo.
export interface UsuarioLogado {
  id: string;
  nome: string;
  idCondominio: string;
  isSindico: boolean;
}

let usuarioAtual: UsuarioLogado | null = null;

export const sessao = {
  definir(usuario: UsuarioLogado) {
    usuarioAtual = usuario;
  },
  obter() {
    return usuarioAtual;
  },
  limpar() {
    usuarioAtual = null;
  },
};

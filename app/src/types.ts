export type TabKey = 'blocos' | 'apartamentos' | 'moradores';

export type NavKey = 'inicio' | 'comunicados' | 'ocorrencias' | 'configuracoes';

export interface Bloco {
  id: string;
  nome: string;
}

export interface Apartamento {
  id: string;
  idBloco: string;
  numero: string;
  bloco: string;
  ocupado: boolean;
}

export interface Morador {
  id: string;
  nome: string;
  bloco: string | null;
  apartamento: string | null;
  ativo: boolean;
  temCodigoAcesso: boolean;
}

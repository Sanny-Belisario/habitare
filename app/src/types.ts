export type TabKey = 'blocos' | 'apartamentos' | 'moradores';

export type NavKey = 'inicio' | 'comunicados' | 'ocorrencias' | 'configuracoes';

export interface Bloco {
  id: string;
  nome: string;
}

export interface Apartamento {
  id: string;
  numero: string;
  bloco: string;
  ocupado: boolean;
}

export interface Morador {
  id: string;
  nome: string;
  bloco: string;
  apartamento: string;
  codigo: string;
  ativo: boolean;
}
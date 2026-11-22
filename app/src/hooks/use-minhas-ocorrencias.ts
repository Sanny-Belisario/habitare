import {
  listarMinhasOcorrencias,
  TABELAS_OCORRENCIA,
  type OcorrenciaResumo,
} from "@/services/ocorrencia";
import { useConsultaLocal } from "./use-consulta-local";

// Ocorrências do morador logado; atualiza quando o banco local muda.
export function useMinhasOcorrencias() {
  const { dados, carregando } = useConsultaLocal(
    listarMinhasOcorrencias,
    TABELAS_OCORRENCIA,
    [] as OcorrenciaResumo[],
  );
  return { ocorrencias: dados, carregando };
}

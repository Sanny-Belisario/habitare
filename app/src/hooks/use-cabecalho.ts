import { eq } from "drizzle-orm";

import { dbSqlite } from "@/db/sqlite";
import { condominio } from "@/db/sqlite/schema";
import { sessao } from "@/services/sessao";
import { useConsultaLocal } from "./use-consulta-local";

async function buscarNomeCondominio(): Promise<string | null> {
  const idCondominio = sessao.obter()?.idCondominio;
  if (!dbSqlite || !idCondominio) return null;

  const [linha] = await dbSqlite
    .select({ nome: condominio.nome })
    .from(condominio)
    .where(eq(condominio.id, idCondominio))
    .limit(1);
  return linha?.nome ?? null;
}

// Dados do topo das telas: "HABITARE / <CONDOMÍNIO>" e a inicial do usuário no avatar.
export function useCabecalho() {
  const { dados: nomeCondominio } = useConsultaLocal(
    buscarNomeCondominio,
    ["condominio"],
    null as string | null,
  );
  const nome = sessao.obter()?.nome?.trim();

  return {
    marca: `HABITARE / ${(nomeCondominio ?? "Condomínio").toUpperCase()}`,
    inicial: nome ? nome.charAt(0).toUpperCase() : "?",
  };
}

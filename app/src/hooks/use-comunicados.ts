import { and, desc, eq, gt, isNull, or } from "drizzle-orm";

import { dbSqlite } from "@/db/sqlite";
import { comunicado, tipoComunicado } from "@/db/sqlite/schema";
import { comunicadoNaoExcluido } from "@/services/comunicado";
import { sessao } from "@/services/sessao";
import { useConsultaLocal } from "./use-consulta-local";

export interface ComunicadoTela {
  id: string;
  category: string;
  title: string;
  details: string;
  body: string;
}

// "2026-11-22T13:00:00.000Z" -> "Publicado em 22/11/2026"
function descreverData(publicadoEm: string | null, criadoEm: string) {
  const data = new Date(publicadoEm ?? criadoEm);
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `Publicado em ${dia}/${mes}/${data.getFullYear()}`;
}

async function buscarComunicados(): Promise<ComunicadoTela[]> {
  if (!dbSqlite) return [];

  const idCondominio = sessao.obter()?.idCondominio;
  const agora = new Date().toISOString();

  const linhas = await dbSqlite
    .select({
      id: comunicado.id,
      titulo: comunicado.titulo,
      descricao: comunicado.descricao,
      publicadoEm: comunicado.publicadoEm,
      criadoEm: comunicado.criadoEm,
      tipo: tipoComunicado.nome,
    })
    .from(comunicado)
    .innerJoin(tipoComunicado, eq(comunicado.idTipoComunicado, tipoComunicado.id))
    .where(
      and(
        // Sem sessão (ex.: recarga em desenvolvimento) mostra de todos os condomínios.
        idCondominio ? eq(comunicado.idCondominio, idCondominio) : undefined,
        comunicadoNaoExcluido,
        // Esconde os expirados (datas em ISO UTC, comparáveis como texto).
        or(isNull(comunicado.expiraEm), gt(comunicado.expiraEm, agora)),
      ),
    )
    .orderBy(desc(comunicado.publicadoEm), desc(comunicado.criadoEm));

  return linhas.map((l) => ({
    id: l.id,
    category: l.tipo.toUpperCase(),
    title: l.titulo,
    details: descreverData(l.publicadoEm, l.criadoEm),
    body: l.descricao ?? "",
  }));
}

// Comunicados do condomínio do usuário logado, lidos do SQLite.
export function useComunicados() {
  const { dados, carregando } = useConsultaLocal(
    buscarComunicados,
    ["comunicado", "tipo_comunicado"],
    [] as ComunicadoTela[],
  );
  return { comunicados: dados, carregando };
}

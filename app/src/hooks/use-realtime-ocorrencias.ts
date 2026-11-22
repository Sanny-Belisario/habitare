import { useEffect } from "react";

import { supabase } from "@/db/postgres";
import { dbSqlite } from "@/db/sqlite";
import { sincronizarAgora } from "./use-sincronizacao";

// Escuta, pelo Supabase Realtime, qualquer insert/update de ocorrência do
// condomínio e sincroniza na hora, sem esperar o intervalo de 30 segundos.
// As telas leem do SQLite: o dado chega pela sincronização e a tela se atualiza
// pelo listener do banco local (useConsultaLocal).
// Requer a tabela `ocorrencia` na publicação `supabase_realtime` do Postgres;
// sem ela não chegam eventos e vale só a sincronização periódica.
export function useRealtimeOcorrencias(idCondominio: string | undefined) {
  useEffect(() => {
    if (!dbSqlite) return;

    const canal = supabase
      .channel(`ocorrencias-${idCondominio ?? "todas"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ocorrencia",
          ...(idCondominio ? { filter: `id_condominio=eq.${idCondominio}` } : {}),
        },
        () => {
          sincronizarAgora();
        },
      )
      .subscribe((status, erro) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("Realtime de ocorrências indisponível:", status, erro);
        }
      });

    return () => {
      supabase.removeChannel(canal);
    };
  }, [idCondominio]);
}

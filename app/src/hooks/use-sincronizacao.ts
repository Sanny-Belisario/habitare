import { useEffect } from "react";
import { AppState } from "react-native";

import { supabase } from "@/db/postgres";
import { dbSqlite } from "@/db/sqlite";
import { Sincronizacao } from "@/services/sincronizacao";

const INTERVALO_MS = 30_000;

// Sincroniza SQLite e Postgres ao abrir e a cada 30 segundos, só com o app em
// primeiro plano. `ativo` segura o início até as migrations do SQLite rodarem.
export function useSincronizacao(ativo: boolean) {
  useEffect(() => {
    if (!ativo || !dbSqlite) return;

    const sincronizacao = new Sincronizacao(dbSqlite, supabase);
    // Uma rodada lenta (rede ruim) não pode se sobrepor à próxima.
    let rodando = false;

    async function sincronizar() {
      if (rodando || AppState.currentState !== "active") return;
      rodando = true;
      try {
        const resultado = await sincronizacao.sincronizar();
        const alteradas = Object.entries(resultado).filter(
          ([, r]) => r.enviados > 0 || r.recebidos > 0,
        );
        if (alteradas.length > 0) {
          console.log("Sincronização:", Object.fromEntries(alteradas));
        }
      } catch (erro) {
        // Sem internet cai aqui; a próxima rodada tenta de novo.
        console.warn("Falha na sincronização:", erro);
      } finally {
        rodando = false;
      }
    }

    sincronizar();
    const intervalo = setInterval(sincronizar, INTERVALO_MS);
    // Ao voltar para o app, sincroniza na hora em vez de esperar o intervalo.
    const assinatura = AppState.addEventListener("change", (estado) => {
      if (estado === "active") sincronizar();
    });

    return () => {
      clearInterval(intervalo);
      assinatura.remove();
    };
  }, [ativo]);
}

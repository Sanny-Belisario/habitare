import { useEffect } from "react";
import { AppState } from "react-native";

import { supabase } from "@/db/postgres";
import { dbSqlite } from "@/db/sqlite";
import { Sincronizacao } from "@/services/sincronizacao";

const INTERVALO_MS = 30_000;

// Rodada de sincronização ativa (registrada pelo hook), para outras partes do
// app pedirem uma sincronização imediata, ex.: ao receber um evento do Realtime.
let sincronizarAtual: (() => Promise<void>) | null = null;

export function sincronizarAgora() {
  return sincronizarAtual?.() ?? Promise.resolve();
}

// Sincroniza SQLite e Postgres ao abrir e a cada 30 segundos, só com o app em
// primeiro plano. `ativo` segura o início até as migrations do SQLite rodarem.
export function useSincronizacao(ativo: boolean) {
  useEffect(() => {
    if (!ativo || !dbSqlite) return;

    const sincronizacao = new Sincronizacao(dbSqlite, supabase);
    // Uma rodada lenta (rede ruim) não pode se sobrepor à próxima; um pedido
    // feito durante uma rodada gera mais uma ao final, para não perder mudanças.
    let rodando = false;
    let pendente = false;

    async function sincronizar() {
      if (AppState.currentState !== "active") return;
      if (rodando) {
        pendente = true;
        return;
      }
      rodando = true;
      try {
        do {
          pendente = false;
          const resultado = await sincronizacao.sincronizar();
          const alteradas = Object.entries(resultado).filter(
            ([, r]) => r.enviados > 0 || r.recebidos > 0,
          );
          if (alteradas.length > 0) {
            console.log("Sincronização:", Object.fromEntries(alteradas));
          }
        } while (pendente);
      } catch (erro) {
        // Sem internet cai aqui; a próxima rodada tenta de novo.
        console.warn("Falha na sincronização:", erro);
      } finally {
        rodando = false;
      }
    }

    sincronizarAtual = sincronizar;
    sincronizar();
    const intervalo = setInterval(sincronizar, INTERVALO_MS);
    // Ao voltar para o app, sincroniza na hora em vez de esperar o intervalo.
    const assinatura = AppState.addEventListener("change", (estado) => {
      if (estado === "active") sincronizar();
    });

    return () => {
      if (sincronizarAtual === sincronizar) sincronizarAtual = null;
      clearInterval(intervalo);
      assinatura.remove();
    };
  }, [ativo]);
}

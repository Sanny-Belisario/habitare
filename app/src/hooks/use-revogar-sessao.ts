import { eq } from "drizzle-orm";
import { addDatabaseChangeListener } from "expo-sqlite";
import { useEffect } from "react";

import { dbSqlite } from "@/db/sqlite";
import { usuario } from "@/db/sqlite/schema";
import { sessao, type UsuarioLogado } from "@/services/sessao";

export function useRevogarSessao(conta: UsuarioLogado | null) {
  useEffect(() => {
    const db = dbSqlite;
    if (!conta || !db) return;

    function verificar() {
      if (!db || !conta || sessao.obter() !== conta) return;
      try {
        const atual = db.select({ ativo: usuario.status, excluido: usuario.excluido })
          .from(usuario).where(eq(usuario.id, conta.id)).get();
        if (!atual?.ativo || atual.excluido) sessao.limpar();
      } catch (erro) {
        console.warn("Não foi possível verificar a sessão local:", erro);
      }
    }

    const assinatura = addDatabaseChangeListener(({ tableName }) => {
      if (tableName === "usuario") verificar();
    });
    verificar();
    return () => assinatura.remove();
  }, [conta]);
}

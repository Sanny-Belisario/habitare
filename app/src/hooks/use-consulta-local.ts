import { addDatabaseChangeListener } from "expo-sqlite";
import { useEffect, useState } from "react";

import { dbSqlite } from "@/db/sqlite";

// Roda `buscar` no SQLite e repete sempre que uma das `tabelas` muda (inclusive
// quando a sincronização grava dados novos). `deps` refaz a consulta.
export function useConsultaLocal<T>(
  buscar: () => Promise<T>,
  tabelas: string[],
  inicial: T,
  deps: unknown[] = [],
) {
  const [dados, setDados] = useState<T>(inicial);
  const [carregando, setCarregando] = useState(true);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);

  useEffect(() => {
    let ativo = true;
    const observadas = new Set(tabelas);

    const carregar = () => {
      buscar()
        .then((resultado) => {
          if (!ativo) return;
          setDados(resultado);
          setAtualizadoEm(new Date());
        })
        .catch((erro) => console.warn("Erro ao consultar o SQLite:", erro))
        .finally(() => {
          if (ativo) setCarregando(false);
        });
    };

    carregar();
    const assinatura = dbSqlite
      ? addDatabaseChangeListener(({ tableName }) => {
          if (observadas.has(tableName)) carregar();
        })
      : null;

    return () => {
      ativo = false;
      assinatura?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { dados, carregando, atualizadoEm };
}

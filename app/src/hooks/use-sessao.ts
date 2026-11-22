import { useSyncExternalStore } from "react";

import { sessao } from "@/services/sessao";

export function useSessao() {
  return useSyncExternalStore(sessao.inscrever, sessao.obter, () => null);
}

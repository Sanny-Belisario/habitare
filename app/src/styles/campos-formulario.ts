import { StyleSheet } from "react-native";

import { colors } from "@/theme";

export const estilosCampo = StyleSheet.create({
  grupo: { gap: 8 },
  rotulo: { color: colors.dark, fontSize: 14, fontWeight: "700" },
  obrigatorio: { color: colors.trash },
  controle: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  texto: { color: colors.dark, fontSize: 14 },
});

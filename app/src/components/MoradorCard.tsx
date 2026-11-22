import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import CardActions from "@/components/CardActions";
import StatusBadge from "@/components/StatusBadge";
import { tituloApartamento } from "@/services/apartamento";
import { colors } from "@/theme";
import type { Morador } from "@/types";

export function MoradorCard({ morador }: { morador: Morador }) {
  const { nome, ativo, bloco, apartamento, temCodigoAcesso } = morador;

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{nome}</Text>
      <StatusBadge label={ativo ? "Ativo" : "Inativo"} variant={ativo ? "success" : "danger"} />
      <Text style={styles.details}>
        {bloco && apartamento ? `${bloco} • ${tituloApartamento(apartamento)}` : "Sem apartamento vinculado"}
      </Text>
      <View
        style={styles.code}
        accessible
        accessibilityLabel={temCodigoAcesso ? "Código de acesso oculto" : "Código de acesso não cadastrado"}
      >
        <Text style={styles.details}>
          Código de acesso: {temCodigoAcesso ? "******" : "Não cadastrado"}
        </Text>
        {temCodigoAcesso ? <Ionicons name="eye-off-outline" size={14} color={colors.muted} /> : null}
      </View>
      <CardActions editLabel={`Editar ${nome}`} deleteLabel={`Excluir ${nome}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
    marginBottom: 20,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    paddingRight: 76,
    marginBottom: 8,
  },
  details: { color: colors.muted, fontSize: 12 },
  code: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4, flexWrap: "wrap" },
});

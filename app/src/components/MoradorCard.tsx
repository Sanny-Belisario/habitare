import { StyleSheet, Text, View } from "react-native";

import CardActions from "@/components/CardActions";
import { CodigoAcessoMorador } from "@/components/CodigoAcessoMorador";
import StatusBadge from "@/components/StatusBadge";
import { tituloApartamento } from "@/services/apartamento";
import { colors } from "@/theme";
import type { Morador } from "@/types";

interface MoradorCardProps {
  morador: Morador;
  onEdit: () => void;
  onDelete: () => void;
}

export function MoradorCard({ morador, onEdit, onDelete }: MoradorCardProps) {
  const { nome, ativo, bloco, apartamento, temCodigoAcesso } = morador;

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{nome}</Text>
      <StatusBadge label={ativo ? "Ativo" : "Inativo"} variant={ativo ? "success" : "danger"} />
      <Text style={styles.details}>
        {bloco && apartamento ? `${bloco} • ${tituloApartamento(apartamento)}` : "Sem apartamento vinculado"}
      </Text>
      <CodigoAcessoMorador id={morador.id} nome={nome} temCodigoAcesso={temCodigoAcesso} />
      <CardActions
        editLabel={`Editar ${nome}`}
        deleteLabel={`Excluir ${nome}`}
        onEdit={onEdit}
        onDelete={onDelete}
      />
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
});

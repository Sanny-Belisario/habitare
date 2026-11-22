import { Ionicons } from "@expo/vector-icons";
import { MenuConta } from "@/components/MenuConta";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useCabecalho } from "@/hooks/use-cabecalho";
import { colors } from "@/theme";

interface Props {
  titulo: string;
  onVoltar?: () => void;
  protocolo?: string;
}

export function SindicoHeader({ titulo, onVoltar, protocolo }: Props) {
  const { marca } = useCabecalho();

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>{marca}</Text>
      <View style={styles.row}>
        <View style={styles.heading}>
          {onVoltar ? (
            <TouchableOpacity
              onPress={onVoltar}
              style={styles.back}
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={20} color={colors.muted} />
              <Text style={styles.eyebrow}>Voltar</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.eyebrow}>Gestão do condomínio</Text>
          )}
          {protocolo ? <Text style={styles.protocol}>{protocolo}</Text> : null}
          <Text style={styles.title} accessibilityRole="header">{titulo}</Text>
        </View>
        <MenuConta />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  brand: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  heading: { flex: 1, gap: 4 },
  back: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 8, minHeight: 30 },
  eyebrow: { color: colors.muted, fontSize: 14 },
  protocol: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  title: { color: colors.dark, fontSize: 30, fontWeight: "800" },
});

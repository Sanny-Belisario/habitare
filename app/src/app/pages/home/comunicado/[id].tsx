import { Ionicons } from "@expo/vector-icons";
import { MenuConta } from "@/components/MenuConta";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MoradorBottomNav } from "@/components/MoradorBottomNav";
import { useCabecalho } from "@/hooks/use-cabecalho";
import { useComunicados } from "@/hooks/use-comunicados";
import { colors } from "@/theme";

export default function DetalheComunicado() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { comunicados, carregando } = useComunicados();
  const { marca } = useCabecalho();
  const comunicado = comunicados.find((item) => item.id === id);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.brand}>{marca}</Text>

          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.navigate("/pages/home/comunicados-morador")}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Voltar para Comunicados"
            >
              <Ionicons name="arrow-back" size={20} color={colors.muted} />
              <Text style={styles.backLabel}>Voltar</Text>
            </TouchableOpacity>
            <MenuConta />
          </View>

          {comunicado ? (
            <>
              <Text style={styles.title}>{comunicado.title}</Text>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{comunicado.category}</Text>
              </View>
              <View style={styles.detailCard}>
                <Text style={styles.details}>{comunicado.details}</Text>
                <Text style={styles.body}>{comunicado.body}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.notFound}>
              {carregando ? "Carregando..." : "Comunicado não encontrado."}
            </Text>
          )}
        </ScrollView>

        <MoradorBottomNav active="comunicados" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  brand: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 30,
  },
  backLabel: {
    color: colors.muted,
    fontSize: 14,
  },
  title: {
    color: colors.dark,
    fontSize: 30,
    fontWeight: "800",
  },
  categoryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: colors.navActive,
  },
  categoryText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "700",
  },
  detailCard: {
    minHeight: 118,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    gap: 12,
  },
  details: {
    color: colors.muted,
    fontSize: 13,
  },
  body: {
    color: colors.dark,
    fontSize: 15,
    lineHeight: 22,
  },
  notFound: {
    color: colors.muted,
    fontSize: 13,
    paddingVertical: 20,
  },
});

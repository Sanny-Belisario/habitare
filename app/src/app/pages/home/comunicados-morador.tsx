import { router } from "expo-router";
import { MenuConta } from "@/components/MenuConta";
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

export default function ComunicadosMorador() {
  const { comunicados, carregando } = useComunicados();
  const { marca } = useCabecalho();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.brand}>{marca}</Text>

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>Seu condomínio</Text>
              <Text style={styles.title}>Comunicados</Text>
            </View>
            <MenuConta />
          </View>

          <Text style={styles.sectionTitle}>Avisos do condomínio</Text>
          <View style={styles.announcements}>
            {comunicados.length > 0 ? (
              comunicados.map((comunicado) => (
                <TouchableOpacity
                  key={comunicado.id}
                  style={styles.announcementCard}
                  onPress={() =>
                    router.navigate({
                      pathname: "/pages/home/comunicado/[id]",
                      params: { id: comunicado.id },
                    })
                  }
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver detalhes: ${comunicado.title}`}
                >
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryText}>
                      {comunicado.category}
                    </Text>
                  </View>
                  <Text style={styles.announcementTitle}>
                    {comunicado.title}
                  </Text>
                  <Text style={styles.announcementDetails}>
                    {comunicado.details}
                  </Text>
                  <View style={styles.cardDivider} />
                  <Text style={styles.detailsLink}>Ver detalhes →</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyState}>
                {carregando
                  ? "Carregando comunicados..."
                  : "Nenhum comunicado por enquanto"}
              </Text>
            )}
          </View>
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
    paddingBottom: 24,
  },
  brand: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 14,
  },
  header: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: { flex: 1 },
  eyebrow: {
    color: colors.muted,
    fontSize: 15,
    marginBottom: 2,
  },
  title: {
    color: colors.dark,
    fontSize: 30,
    fontWeight: "800",
  },
  sectionTitle: {
    color: colors.dark,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  announcements: {
    gap: 10,
  },
  announcementCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.card,
  },
  categoryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 7,
    borderRadius: 7,
    backgroundColor: colors.navActive,
  },
  categoryText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "700",
  },
  announcementTitle: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "700",
  },
  announcementDetails: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 3,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E6EBF2",
    marginTop: 12,
  },
  detailsLink: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 10,
  },
  emptyState: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
  },
});

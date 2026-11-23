import { Ionicons } from "@expo/vector-icons";
import { MenuConta } from "@/components/MenuConta";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MoradorBottomNav } from "@/components/MoradorBottomNav";
import { useCabecalho } from "@/hooks/use-cabecalho";
import { useComunicados } from "@/hooks/use-comunicados";
import { useMinhasOcorrencias } from "@/hooks/use-minhas-ocorrencias";
import { ehEmAndamento } from "@/services/ocorrencia";
import { colors } from "@/theme";

export default function InicioMorador() {
  const { comunicados, carregando } = useComunicados();
  const { ocorrencias } = useMinhasOcorrencias();
  const { marca } = useCabecalho();

  const emAndamento = ocorrencias.filter((o) => ehEmAndamento(o.status)).length;
  const resumoOcorrencias =
    emAndamento === 1
      ? "1 ocorrência em andamento"
      : `${emAndamento} ocorrências em andamento`;

  function openAnnouncement(id: string) {
    router.navigate("/pages/home/comunicados-morador");
    router.navigate({
      pathname: "/pages/home/comunicado/[id]",
      params: { id },
    });
  }

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
              <Text style={styles.title}>Início</Text>
            </View>
            <MenuConta />
          </View>

          <Text style={styles.sectionTitle}>Acesso rápido</Text>
          <View style={styles.quickAccess}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.navigate("/pages/home/nova-ocorrencia")}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <View style={styles.quickIcon}>
                <Ionicons name="add" size={18} color={colors.dark} />
              </View>
              <Text style={styles.quickLabel}>Nova ocorrência</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.navigate("/pages/home/ocorrencias-morador")}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <View style={styles.quickIcon}>
                <Ionicons
                  name="reorder-three-outline"
                  size={18}
                  color={colors.dark}
                />
              </View>
              <Text style={styles.quickLabel}>Minhas ocorrências</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, styles.announcementsHeading]}>
            Últimos comunicados
          </Text>
          <View style={styles.announcements}>
            {comunicados.slice(0, 2).map((comunicado) => (
              <TouchableOpacity
                key={comunicado.id}
                style={styles.announcementCard}
                onPress={() => openAnnouncement(comunicado.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Abrir comunicado: ${comunicado.title}`}
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
              </TouchableOpacity>
            ))}
            {comunicados.length === 0 ? (
              <Text style={styles.announcementDetails}>
                {carregando
                  ? "Carregando comunicados..."
                  : "Nenhum comunicado por enquanto"}
              </Text>
            ) : null}
          </View>
        </ScrollView>

        {emAndamento > 0 && (
          <TouchableOpacity
            style={styles.occurrenceSummary}
            onPress={() => router.navigate("/pages/home/ocorrencias-morador")}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.summaryTitle}>{resumoOcorrencias}</Text>
            <View style={styles.summaryLink}>
              <Text style={styles.summaryText}>Acompanhar solicitações</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
        )}

        <MoradorBottomNav active="inicio" />
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
    paddingBottom: 28,
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
    fontSize: 18,
    fontWeight: "800",
  },
  quickAccess: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  quickCard: {
    minHeight: 84,
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.card,
    justifyContent: "space-between",
    gap: 8,
  },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.navActive,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
  },
  announcementsHeading: {
    marginTop: 24,
    marginBottom: 12,
  },
  announcements: {
    gap: 10,
  },
  announcementCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.card,
    justifyContent: "center",
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
  occurrenceSummary: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.navActive,
  },
  summaryTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  summaryLink: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryText: {
    color: colors.primary,
    fontSize: 12,
    flexShrink: 1,
  },
});

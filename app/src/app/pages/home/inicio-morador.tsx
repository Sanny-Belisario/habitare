import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MoradorBottomNav } from "@/components/MoradorBottomNav";
import { comunicados } from "@/data/comunicados";
import { colors } from "@/theme";

export default function InicioMorador() {
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
          <Text style={styles.brand}>HABITARE / CONDOMÍNIO AURORA</Text>

          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Seu condomínio</Text>
              <Text style={styles.title}>Início</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => router.navigate("/pages/configuracoes")}
                accessibilityRole="button"
                accessibilityLabel="Configurações"
              >
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>A</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Acesso rápido</Text>
          <View style={styles.quickAccess}>
            <View style={styles.quickCard}>
              <View style={styles.quickIcon}>
                <Ionicons name="add" size={18} color={colors.dark} />
              </View>
              <Text style={styles.quickLabel}>Nova ocorrência</Text>
            </View>
            <View style={styles.quickCard}>
              <View style={styles.quickIcon}>
                <Ionicons
                  name="reorder-three-outline"
                  size={18}
                  color={colors.dark}
                />
              </View>
              <Text style={styles.quickLabel}>Minhas ocorrências</Text>
            </View>
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
          </View>
        </ScrollView>

        <View style={styles.occurrenceSummary}>
          <Text style={styles.summaryTitle}>1 ocorrência em andamento</Text>
          <View style={styles.summaryLink}>
            <Text style={styles.summaryText}>Acompanhar solicitação</Text>
            <Ionicons name="arrow-forward" size={10} color={colors.primary} />
          </View>
        </View>

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
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },
  brand: {
    color: colors.primary,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  header: {
    marginTop: 17,
    marginBottom: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 10,
    marginBottom: 4,
  },
  title: {
    color: colors.dark,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
  },
  avatar: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.navActive,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "700",
  },
  headerActions: {
    width: 48,
    height: 48,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: colors.dark,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
  },
  quickAccess: {
    flexDirection: "row",
    gap: 8,
    marginTop: 9,
  },
  quickCard: {
    height: 64,
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.card,
    justifyContent: "space-between",
  },
  quickIcon: {
    width: 21,
    height: 21,
    borderRadius: 7,
    backgroundColor: colors.navActive,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    color: colors.dark,
    fontSize: 8,
    fontWeight: "700",
  },
  announcementsHeading: {
    marginTop: 19,
    marginBottom: 9,
  },
  announcements: {
    gap: 7,
  },
  announcementCard: {
    minHeight: 78,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: colors.card,
    justifyContent: "center",
  },
  categoryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginBottom: 8,
    borderRadius: 6,
    backgroundColor: colors.navActive,
  },
  categoryText: {
    color: colors.primary,
    fontSize: 6,
    fontWeight: "700",
  },
  announcementTitle: {
    color: colors.dark,
    fontSize: 10,
    fontWeight: "700",
  },
  announcementDetails: {
    color: colors.muted,
    fontSize: 8,
    marginTop: 6,
  },
  occurrenceSummary: {
    marginHorizontal: 18,
    marginBottom: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: colors.navActive,
  },
  summaryTitle: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "700",
  },
  summaryLink: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryText: {
    color: colors.primary,
    fontSize: 8,
  },
});

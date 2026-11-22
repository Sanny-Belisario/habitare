import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MoradorBottomNav } from "@/components/MoradorBottomNav";
import { comunicados } from "@/data/comunicados";
import { colors } from "@/theme";

export default function ComunicadosMorador() {
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
              <Text style={styles.title}>Comunicados</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
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
                Nenhum comunicado por enquanto
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
    marginBottom: 16,
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
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: colors.navActive,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.dark,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
    marginBottom: 11,
  },
  announcements: {
    gap: 8,
  },
  announcementCard: {
    minHeight: 92,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 13,
    backgroundColor: colors.card,
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
    marginTop: 4,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E6EBF2",
    marginTop: 8,
  },
  detailsLink: {
    color: colors.primary,
    fontSize: 7,
    lineHeight: 10,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 6,
  },
  emptyState: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
  },
});

import { Ionicons } from "@expo/vector-icons";
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
import { comunicados } from "@/data/comunicados";
import { colors } from "@/theme";

export default function DetalheComunicado() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const comunicado = comunicados.find((item) => item.id === id);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.brand}>HABITARE / CONDOMÍNIO AURORA</Text>

          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                router.navigate("/pages/home/comunicados-morador")
              }
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Voltar para Comunicados"
            >
              <Ionicons name="arrow-back" size={18} color={colors.muted} />
              <Text style={styles.backLabel}>Voltar</Text>
            </TouchableOpacity>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
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
            <Text style={styles.notFound}>Comunicado não encontrado.</Text>
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
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
  },
  brand: {
    color: colors.primary,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  topRow: {
    height: 42,
    marginTop: 8,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 6,
  },
  backLabel: {
    color: colors.muted,
    fontSize: 10,
  },
  avatar: {
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
  title: {
    color: colors.dark,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "700",
    marginBottom: 9,
  },
  categoryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.navActive,
  },
  categoryText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "700",
  },
  detailCard: {
    minHeight: 100,
    marginTop: 12,
    paddingHorizontal: 13,
    paddingVertical: 14,
    borderRadius: 13,
    backgroundColor: colors.card,
    gap: 10,
  },
  details: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 16,
  },
  body: {
    color: colors.dark,
    fontSize: 10,
    lineHeight: 16,
  },
  notFound: {
    color: colors.muted,
    fontSize: 12,
    paddingVertical: 20,
  },
});

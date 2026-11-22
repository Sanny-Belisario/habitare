import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { MoradorBottomNav } from "@/components/MoradorBottomNav";
import { colors } from "@/theme";

export default function OcorrenciasMorador() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.brand}>HABITARE / CONDOMÍNIO AURORA</Text>
          <Text style={styles.eyebrow}>Seu condomínio</Text>
          <Text style={styles.title}>Ocorrências</Text>
          <Text style={styles.emptyState}>Nenhuma ocorrência por enquanto</Text>
        </ScrollView>
        <MoradorBottomNav active="ocorrencias" />
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
  },
  brand: {
    color: colors.primary,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.1,
    marginBottom: 17,
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
  emptyState: {
    marginTop: 22,
    padding: 18,
    borderRadius: 13,
    backgroundColor: colors.card,
    color: colors.muted,
    fontSize: 11,
    textAlign: "center",
  },
});

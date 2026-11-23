import { router } from "expo-router";
import { MenuConta } from "@/components/MenuConta";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import CardActions from "@/components/CardActions";
import { MoradorBottomNav } from "@/components/MoradorBottomNav";
import PrimaryButton from "@/components/PrimaryButton";
import { useCabecalho } from "@/hooks/use-cabecalho";
import { useMinhasOcorrencias } from "@/hooks/use-minhas-ocorrencias";
import {
  ehAberta,
  excluirOcorrencia,
  protocoloCurto,
  type OcorrenciaResumo,
} from "@/services/ocorrencia";
import { colors } from "@/theme";

const CORES_STATUS: Record<string, { bg: string; text: string }> = {
  aberta: { bg: "#FDE9D7", text: "#C46A1B" },
  "em andamento": { bg: colors.navActive, text: colors.primary },
  resolvida: colors.free,
};

function corDoStatus(status: string, cor: string | null) {
  const conhecida = CORES_STATUS[status.trim().toLowerCase()];
  if (conhecida) return conhecida;
  // Status cadastrado depois: fundo claro com a cor do banco.
  return cor ? { bg: `${cor}22`, text: cor } : { bg: colors.navActive, text: colors.muted };
}

function exigirAberta(o: OcorrenciaResumo) {
  if (ehAberta(o.status)) return true;
  Alert.alert(
    "Ocorrência em atendimento",
    `Só é possível alterar ocorrências abertas. Esta está "${o.status}".`,
  );
  return false;
}

function editar(o: OcorrenciaResumo) {
  if (!exigirAberta(o)) return;
  router.navigate({
    pathname: "/pages/home/nova-ocorrencia",
    params: { id: o.id },
  });
}

function excluir(o: OcorrenciaResumo) {
  if (!exigirAberta(o)) return;
  Alert.alert("Excluir ocorrência", `Deseja excluir "${o.titulo}"?`, [
    { text: "Cancelar", style: "cancel" },
    {
      text: "Excluir",
      style: "destructive",
      onPress: () =>
        excluirOcorrencia(o.id).catch((erro: Error) =>
          Alert.alert("Erro", erro.message),
        ),
    },
  ]);
}

export default function OcorrenciasMorador() {
  const { marca } = useCabecalho();
  const { ocorrencias, carregando } = useMinhasOcorrencias();

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
              <Text style={styles.title}>Ocorrências</Text>
            </View>
            <MenuConta />
          </View>

          <Text style={styles.sectionTitle}>Minhas ocorrências</Text>
          <PrimaryButton
            title="Registrar nova ocorrência"
            onPress={() => router.navigate("/pages/home/nova-ocorrencia")}
          />

          {ocorrencias.length === 0 ? (
            <Text style={styles.emptyState}>
              {carregando
                ? "Carregando ocorrências..."
                : "Você ainda não registrou nenhuma ocorrência."}
            </Text>
          ) : (
            ocorrencias.map((o) => {
              const cor = corDoStatus(o.status, o.corStatus);
              return (
                <View key={o.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.protocol}>{protocoloCurto(o.protocolo)}</Text>
                    <View style={[styles.badge, { backgroundColor: cor.bg }]}>
                      <Text style={[styles.badgeText, { color: cor.text }]}>
                        {o.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{o.titulo}</Text>
                  <Text style={styles.cardSub}>
                    {o.bloco ?? "Área comum"}  •  {o.categoria}
                  </Text>
                  {ehAberta(o.status) && (
                    <CardActions onEdit={() => editar(o)} onDelete={() => excluir(o)} />
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        <MoradorBottomNav active="ocorrencias" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 28 },
  brand: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 12,
  },
  headerText: { flex: 1 },
  eyebrow: { fontSize: 15, color: colors.muted, marginBottom: 2 },
  title: { fontSize: 30, fontWeight: "800", color: colors.dark },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    flexWrap: "wrap",
    gap: 8,
  },
  protocol: { fontSize: 12, fontWeight: "700", color: colors.muted },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 6 },
  cardSub: { fontSize: 13, color: colors.muted },
  emptyState: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.card,
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
  },
});

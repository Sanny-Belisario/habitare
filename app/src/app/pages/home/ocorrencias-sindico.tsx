import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "@/components/BottomNav";
import { OcorrenciaStatusBadge } from "@/components/OcorrenciaStatusBadge";
import { SindicoHeader } from "@/components/SindicoHeader";
import { useConsultaLocal } from "@/hooks/use-consulta-local";
import { useRealtimeOcorrencias } from "@/hooks/use-realtime-ocorrencias";
import {
  ehAberta,
  ehResolvida,
  listarOcorrenciasDoSindico,
  protocoloCurto,
  TABELAS_OCORRENCIA,
  type OcorrenciaResumo,
} from "@/services/ocorrencia";
import { sessao } from "@/services/sessao";
import { colors } from "@/theme";

const FILTROS = [
  { id: "todas", label: "Todas", inclui: () => true },
  { id: "abertas", label: "Abertas", inclui: ehAberta },
  { id: "resolvidas", label: "Resolvidas", inclui: ehResolvida },
] as const;

function normalizar(texto: string) {
  return texto.trim().normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export default function OcorrenciasSindico() {
  const usuario = sessao.obter();
  if (!usuario) return <Redirect href="/pages/auth/login" />;
  if (!usuario.isSindico) return <Redirect href="/pages/home/ocorrencias-morador" />;

  return <ListaOcorrencias key={usuario.idCondominio} idCondominio={usuario.idCondominio} />;
}

function ListaOcorrencias({ idCondominio }: { idCondominio: string }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>(FILTROS[0]);
  useRealtimeOcorrencias(idCondominio);
  const { dados: ocorrencias, carregando, erro } = useConsultaLocal(
    listarOcorrenciasDoSindico,
    TABELAS_OCORRENCIA,
    [],
    [idCondominio],
  );
  const termo = normalizar(busca);
  const abertas = ocorrencias.filter((item) => ehAberta(item.status)).length;
  const visiveis = ocorrencias.filter((item) =>
    filtro.inclui(item.status) && (
      !termo || [item.titulo, item.protocolo, protocoloCurto(item.protocolo),
        item.bloco ?? "Área comum", item.categoria].some((campo) => normalizar(campo).includes(termo))
    ),
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <SindicoHeader titulo="Ocorrências" />
        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput
            style={styles.input}
            accessibilityLabel="Buscar ocorrências"
            placeholder="Buscar ocorrências..."
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            returnKeyType="search"
            value={busca}
            onChangeText={setBusca}
          />
        </View>
        <View style={styles.filters}>
          {FILTROS.map((opcao) => {
            const selecionado = filtro.id === opcao.id;
            const quantidade = opcao.id === "todas" ? ocorrencias.length : abertas;
            return (
              <Pressable
                key={opcao.id}
                onPress={() => setFiltro(opcao)}
                style={[styles.filter, selecionado && styles.selected]}
                accessibilityRole="button"
                accessibilityState={{ selected: selecionado }}
                hitSlop={{ top: 7, bottom: 7 }}
              >
                <Text style={[styles.filterText, selecionado && styles.selectedText]}>
                  {opcao.label}{opcao.id !== "resolvidas" ? `  ${quantidade}` : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.sectionTitle} accessibilityRole="header">Ocorrências recentes</Text>
      </View>
      <FlatList
        data={visiveis}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <CartaoOcorrencia item={item} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {carregando ? "Carregando ocorrências..." : erro ?? "Nenhuma ocorrência encontrada."}
          </Text>
        }
      />
      <BottomNav active="ocorrencias" />
    </SafeAreaView>
  );
}

function CartaoOcorrencia({ item }: { item: OcorrenciaResumo }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityHint="Abre os detalhes da ocorrência"
      onPress={() => router.push({
        pathname: "/pages/home/ocorrencia/[id]",
        params: { id: item.id },
      })}
    >
      <View style={styles.cardTop}>
        <Text style={styles.protocol}>{protocoloCurto(item.protocolo)}</Text>
        <OcorrenciaStatusBadge status={item.status} cor={item.corStatus} />
      </View>
      <Text style={styles.cardTitle}>{item.titulo}</Text>
      <Text style={styles.cardSub}>{item.bloco ?? "Área comum"}  •  {item.categoria}</Text>
      <View style={styles.details}>
        <Text style={styles.detailsText}>Ver detalhes</Text>
        <Ionicons name="arrow-forward" size={12} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 20, gap: 16, paddingBottom: 10 },
  search: {
    flexDirection: "row", alignItems: "center", minHeight: 46, gap: 9, paddingHorizontal: 14,
    borderRadius: 13, backgroundColor: colors.card,
  },
  input: { flex: 1, color: colors.dark, fontSize: 14, paddingVertical: 10 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filter: { backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  selected: { backgroundColor: colors.dark },
  filterText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  selectedText: { color: colors.card },
  sectionTitle: { color: colors.dark, fontSize: 17, fontWeight: "700", marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 18, gap: 10 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16 },
  pressed: { opacity: 0.75 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  protocol: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  cardTitle: { color: colors.dark, fontSize: 16, fontWeight: "700", marginTop: 8 },
  cardSub: { color: colors.muted, fontSize: 13, marginTop: 6 },
  details: {
    flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 4,
    marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.navActive,
  },
  detailsText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  empty: { color: colors.muted, textAlign: "center", paddingVertical: 16 },
});

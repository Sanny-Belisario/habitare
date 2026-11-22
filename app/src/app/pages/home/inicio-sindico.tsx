import { Ionicons } from "@expo/vector-icons";
import { MenuConta } from "@/components/MenuConta";
import { and, desc, eq } from "drizzle-orm";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import BottomNav from "@/components/BottomNav";
import { dbSqlite } from "@/db/sqlite";
import { bloco, ocorrencia, statusOcorrencia } from "@/db/sqlite/schema";
import { useCabecalho } from "@/hooks/use-cabecalho";
import { useConsultaLocal } from "@/hooks/use-consulta-local";
import { useRealtimeOcorrencias } from "@/hooks/use-realtime-ocorrencias";
import { sincronizarAgora } from "@/hooks/use-sincronizacao";
import { ehResolvida } from "@/services/ocorrencia";
import { sessao } from "@/services/sessao";
import { colors } from "@/theme";

interface OcorrenciaPainel {
  id: string;
  titulo: string;
  criadaEm: string;
  bloco: string | null;
  status: string;
  corStatus: string | null;
}

// Tabelas lidas pelo painel: qualquer mudança nelas refaz a consulta.
const TABELAS_PAINEL = ["ocorrencia", "status_ocorrencia", "bloco"];

// Cores só para status sem cor_identificacao cadastrada no banco.
const CORES_PADRAO: Record<string, string> = {
  aberta: "#D9822B",
  "em andamento": "#2E8B7A",
  resolvida: "#2E7D32",
};

const corDoStatus = (nome: string, cor: string | null) =>
  cor ?? CORES_PADRAO[nome.trim().toLowerCase()] ?? colors.muted;

const doisDigitos = (n: number) => String(n).padStart(2, "0");

function tempoRelativo(dataIso: string, agora: number) {
  const minutos = Math.floor((agora - new Date(dataIso).getTime()) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return horas === 1 ? "há 1 hora" : `há ${horas} horas`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

// Ocorrências ativas do condomínio do síndico, das mais novas para as mais antigas.
async function buscarOcorrenciasDoCondominio(): Promise<OcorrenciaPainel[]> {
  if (!dbSqlite) return [];
  const idCondominio = sessao.obter()?.idCondominio;

  return dbSqlite
    .select({
      id: ocorrencia.id,
      titulo: ocorrencia.titulo,
      criadaEm: ocorrencia.criadaEm,
      bloco: bloco.nome,
      status: statusOcorrencia.nome,
      corStatus: statusOcorrencia.corIdentificacao,
    })
    .from(ocorrencia)
    .innerJoin(statusOcorrencia, eq(ocorrencia.idStatus, statusOcorrencia.id))
    .leftJoin(bloco, eq(ocorrencia.idBloco, bloco.id))
    .where(
      and(
        eq(ocorrencia.ativo, true),
        // Sem sessão (ex.: recarga em desenvolvimento) mostra todos os condomínios.
        idCondominio ? eq(ocorrencia.idCondominio, idCondominio) : undefined,
      ),
    )
    .orderBy(desc(ocorrencia.criadaEm));
}

// Relógio para o "há X min" das ocorrências avançar sem precisar de dado novo.
function useAgora(intervaloMs = 60_000) {
  const [agora, setAgora] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return agora;
}

export default function InicioSindico() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        {dbSqlite ? (
          <Painel />
        ) : (
          <Text style={styles.vazio}>O painel não está disponível na prévia web.</Text>
        )}
        <BottomNav active="inicio" />
      </View>
    </SafeAreaView>
  );
}

function Painel() {
  const idCondominio = sessao.obter()?.idCondominio;
  const { marca } = useCabecalho();
  const agora = useAgora();

  // Mudança no Supabase -> sincroniza na hora -> SQLite muda -> consulta refeita.
  useRealtimeOcorrencias(idCondominio);
  const [atualizando, setAtualizando] = useState(false);
  const { dados: ocorrencias, carregando, atualizadoEm } = useConsultaLocal(
    buscarOcorrenciasDoCondominio,
    TABELAS_PAINEL,
    [] as OcorrenciaPainel[],
    [idCondominio],
  );

  const registradas = ocorrencias.length;
  const resolvidas = ocorrencias.filter((o) => ehResolvida(o.status)).length;
  const pendentes = registradas - resolvidas;
  const taxa = registradas > 0 ? Math.round((resolvidas / registradas) * 100) : 0;
  const recentes = ocorrencias.slice(0, 3);

  // Puxar a tela para baixo busca no Supabase na hora.
  async function atualizar() {
    setAtualizando(true);
    try {
      await sincronizarAgora();
    } finally {
      setAtualizando(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={atualizar}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <Text style={styles.brand}>{marca}</Text>

      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Gestão do condomínio</Text>
          <Text style={styles.title}>Visão geral</Text>
          {atualizadoEm ? (
            <Text style={styles.updatedAt}>
              Atualizado às{" "}
              {atualizadoEm.toTimeString().slice(0, 5)}
            </Text>
          ) : null}
        </View>
        <MenuConta />
      </View>

      <Text style={styles.sectionTitle}>Panorama das solicitações</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{doisDigitos(registradas)}</Text>
          <Text style={styles.statLabel}>Registradas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{doisDigitos(pendentes)}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
      </View>

      <View style={styles.rateCard}>
        <Text style={styles.rateLabel}>Taxa de resolução</Text>
        <View style={styles.rateRow}>
          <Text style={styles.rateValue}>{taxa}%</Text>
          <View
            style={styles.progressTrack}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: taxa }}
          >
            <View style={[styles.progressFill, { width: `${taxa}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitleInline}>Ocorrências recentes</Text>
        <TouchableOpacity
          onPress={() => router.push("/pages/home/ocorrencias-sindico")}
          hitSlop={8}
          accessibilityRole="button"
        >
          <View style={styles.seeAll}>
            <Text style={styles.seeAllText}>Ver ocorrências</Text>
            <Ionicons name="arrow-forward" size={11} color={colors.primary} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.recentList}>
        {recentes.length === 0 ? (
          <Text style={styles.vazio}>
            {carregando ? "Carregando ocorrências..." : "Nenhuma ocorrência registrada."}
          </Text>
        ) : (
          recentes.map((o) => {
            const cor = corDoStatus(o.status, o.corStatus);
            return (
              <View key={o.id} style={styles.recentCard}>
                <View style={[styles.recentBar, { backgroundColor: cor }]} />
                <View style={styles.recentBody}>
                  <Text style={styles.recentTitle} numberOfLines={1}>
                    {o.titulo}
                  </Text>
                  <Text style={styles.recentMeta}>
                    {o.bloco ? `${o.bloco} · ` : ""}
                    {tempoRelativo(o.criadaEm, agora)}
                  </Text>
                  <Text style={[styles.recentStatus, { color: cor }]}>
                    {o.status}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
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
  },
  eyebrow: { fontSize: 15, color: colors.muted, marginBottom: 2 },
  title: { fontSize: 30, fontWeight: "800", color: colors.dark },
  updatedAt: { fontSize: 11, color: colors.muted, marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.dark,
    marginBottom: 12,
  },
  sectionTitleInline: { fontSize: 18, fontWeight: "800", color: colors.dark },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  statNumber: { fontSize: 30, fontWeight: "800", color: colors.dark },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 6 },
  rateCard: {
    marginTop: 10,
    backgroundColor: colors.navActive,
    borderRadius: 16,
    padding: 16,
  },
  rateLabel: { fontSize: 13, fontWeight: "700", color: colors.primary },
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  rateValue: { fontSize: 26, fontWeight: "800", color: colors.dark },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C3DCD6",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: colors.primary },
  recentHeader: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 4 },
  seeAllText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  recentList: { gap: 10 },
  recentCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  recentBar: { width: 4, borderRadius: 2 },
  recentBody: { flex: 1 },
  recentTitle: { fontSize: 15, fontWeight: "700", color: colors.dark },
  recentMeta: { fontSize: 12, color: colors.muted, marginTop: 4 },
  recentStatus: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 6,
  },
  vazio: {
    padding: 20,
    textAlign: "center",
    color: colors.muted,
    fontSize: 13,
  },
});

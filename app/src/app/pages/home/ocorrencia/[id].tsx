import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "@/components/BottomNav";
import { OcorrenciaStatusBadge } from "@/components/OcorrenciaStatusBadge";
import PrimaryButton from "@/components/PrimaryButton";
import { SindicoHeader } from "@/components/SindicoHeader";
import { useConsultaLocal } from "@/hooks/use-consulta-local";
import { useRealtimeOcorrencias } from "@/hooks/use-realtime-ocorrencias";
import { sincronizarAgora } from "@/hooks/use-sincronizacao";
import {
  avancarStatusOcorrencia,
  buscarOcorrenciaDoSindico,
  proximoStatusOcorrencia,
  protocoloCurto,
  TABELAS_OCORRENCIA,
} from "@/services/ocorrencia";
import { sessao } from "@/services/sessao";
import { colors } from "@/theme";

function voltar() {
  router.dismissTo("/pages/home/ocorrencias-sindico");
}

export default function OcorrenciaDetalhes() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const usuario = sessao.obter();
  if (!usuario) return <Redirect href="/pages/auth/login" />;
  if (!usuario.isSindico) return <Redirect href="/pages/home/ocorrencias-morador" />;

  return <Detalhes key={`${usuario.idCondominio}/${id}`} id={id} idCondominio={usuario.idCondominio} />;
}

function Detalhes({ id, idCondominio }: { id: string; idCondominio: string }) {
  const [salvando, setSalvando] = useState(false);
  useRealtimeOcorrencias(idCondominio);
  const { dados: ocorrencia, carregando, erro } = useConsultaLocal(
    () => buscarOcorrenciaDoSindico(id),
    TABELAS_OCORRENCIA,
    null,
    [id, idCondominio],
  );
  const proximo = ocorrencia ? proximoStatusOcorrencia(ocorrencia.status) : null;

  async function avancar(status: string) {
    setSalvando(true);
    try {
      await avancarStatusOcorrencia(id, status);
      void sincronizarAgora();
    } catch (falha) {
      Alert.alert("Não foi possível atualizar o status", (falha as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SindicoHeader
          titulo={ocorrencia?.titulo ?? "Detalhes da ocorrência"}
          protocolo={ocorrencia ? protocoloCurto(ocorrencia.protocolo) : undefined}
          onVoltar={voltar}
        />
        {ocorrencia ? (
          <>
            <OcorrenciaStatusBadge status={ocorrencia.status} cor={ocorrencia.corStatus} />
            <View style={styles.card}>
              <Text style={styles.meta}>{ocorrencia.bloco ?? "Área comum"}  •  {ocorrencia.categoria}</Text>
              <Text style={styles.description}>{ocorrencia.descricao?.trim() || "Sem descrição."}</Text>
            </View>
            {proximo ? (
              <PrimaryButton
                title={`Mudar status para: ${proximo}`}
                disabled={salvando}
                onPress={() => avancar(ocorrencia.status)}
              />
            ) : null}
          </>
        ) : (
          <Text style={styles.meta}>
            {carregando ? "Carregando ocorrência..." : erro ?? "Ocorrência não encontrada."}
          </Text>
        )}
      </ScrollView>
      <BottomNav active="ocorrencias" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16 },
  card: { borderRadius: 16, backgroundColor: colors.card, padding: 16, minHeight: 118, gap: 12 },
  meta: { color: colors.muted, fontSize: 13 },
  description: { color: colors.muted, fontSize: 15, lineHeight: 22 },
});

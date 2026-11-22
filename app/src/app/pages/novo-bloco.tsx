import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState, type ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "@/components/BottomNav";
import PrimaryButton from "@/components/PrimaryButton";
import { SindicoHeader } from "@/components/SindicoHeader";
import { useConsultaLocal } from "@/hooks/use-consulta-local";
import { useSessao } from "@/hooks/use-sessao";
import { sincronizarAgora } from "@/hooks/use-sincronizacao";
import { buscarBlocoParaEdicao, cadastrarBloco, editarBloco } from "@/services/bloco";
import { colors } from "@/theme";
import type { Bloco } from "@/types";

const listaBlocos = {
  pathname: "/pages/configuracoes",
  params: { aba: "blocos" },
} as const;

export default function NovoBloco() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const usuario = useSessao();

  if (!usuario) return <Redirect href="/pages/auth/login" />;
  if (!usuario.isSindico) return <Redirect href={listaBlocos} />;

  return id === undefined ? (
    <TelaBloco titulo="Novo bloco"><FormularioBloco /></TelaBloco>
  ) : (
    <EdicaoBloco key={id} id={id} />
  );
}

function voltar() {
  router.dismissTo(listaBlocos);
}

function EdicaoBloco({ id }: { id: string }) {
  const { dados: bloco, carregando, erro } = useConsultaLocal(
    () => buscarBlocoParaEdicao(id),
    ["bloco"],
    null,
    [id],
  );

  return (
    <TelaBloco titulo="Editar bloco">
      {bloco ? <FormularioBloco bloco={bloco} /> : (
        <Text style={styles.subtitle}>
          {carregando ? "Carregando bloco..." : erro ?? "Bloco não encontrado."}
        </Text>
      )}
    </TelaBloco>
  );
}

function TelaBloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior="padding" style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SindicoHeader titulo={titulo} onVoltar={voltar} />
          {children}
        </ScrollView>
        <BottomNav active="configuracoes" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormularioBloco({ bloco }: { bloco?: Bloco }) {
  const [nome, setNome] = useState(bloco?.nome ?? "");
  const [erro, setErro] = useState<string | null>(null);

  function salvar() {
    try {
      if (bloco) editarBloco(bloco.id, nome);
      else cadastrarBloco(nome);
      void sincronizarAgora();
      voltar();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível salvar o bloco.");
    }
  }

  return (
    <>
      <Text style={styles.subtitle}>Preencha o campo abaixo.</Text>
      <View style={styles.field}>
        <Text style={styles.label}>
          Bloco<Text style={styles.required}> *</Text>
        </Text>
        <TextInput
          style={styles.input}
          accessibilityLabel="Nome do bloco"
          placeholder="Ex.: Bloco C"
          placeholderTextColor={colors.muted}
          value={nome}
          onChangeText={(valor) => {
            setNome(valor);
            setErro(null);
          }}
          returnKeyType="done"
          onSubmitEditing={salvar}
        />
        {erro ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">{erro}</Text>
        ) : null}
      </View>
      <PrimaryButton title={bloco ? "Salvar alterações" : "Cadastrar bloco"} onPress={salvar} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  content: { padding: 20 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 18, marginBottom: 16 },
  field: { gap: 8, marginBottom: 16 },
  label: { color: colors.dark, fontSize: 14, fontWeight: "700" },
  required: { color: colors.trash },
  input: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.dark,
    fontSize: 14,
  },
  error: { color: colors.trash, fontSize: 13 },
});

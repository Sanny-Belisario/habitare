import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState, type ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "@/components/BottomNav";
import PrimaryButton from "@/components/PrimaryButton";
import { SelectField } from "@/components/SelectField";
import { SindicoHeader } from "@/components/SindicoHeader";
import { useConsultaLocal } from "@/hooks/use-consulta-local";
import { useSessao } from "@/hooks/use-sessao";
import { sincronizarAgora } from "@/hooks/use-sincronizacao";
import {
  buscarApartamentoParaEdicao,
  cadastrarApartamento,
  editarApartamento,
  TABELAS_APARTAMENTOS,
} from "@/services/apartamento";
import { listarBlocos } from "@/services/bloco";
import { colors } from "@/theme";

type ApartamentoEdicao = NonNullable<Awaited<ReturnType<typeof buscarApartamentoParaEdicao>>>;

const listaApartamentos = {
  pathname: "/pages/configuracoes",
  params: { aba: "apartamentos" },
} as const;

function voltar() {
  router.dismissTo(listaApartamentos);
}

export default function NovoApartamento() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const usuario = useSessao();

  if (!usuario) return <Redirect href="/pages/auth/login" />;
  if (!usuario.isSindico) return <Redirect href={listaApartamentos} />;

  return id === undefined ? (
    <TelaApartamento titulo="Novo apartamento">
      <FormularioApartamento />
    </TelaApartamento>
  ) : (
    <EdicaoApartamento key={id} id={id} />
  );
}

function EdicaoApartamento({ id }: { id: string }) {
  const { dados: apartamento, carregando, erro } = useConsultaLocal(
    () => buscarApartamentoParaEdicao(id),
    TABELAS_APARTAMENTOS,
    null,
    [id],
  );

  return (
    <TelaApartamento titulo="Editar apartamento">
      {apartamento ? <FormularioApartamento apartamento={apartamento} /> : (
        <Text style={styles.subtitle}>
          {carregando ? "Carregando apartamento..." : erro ?? "Apartamento não encontrado."}
        </Text>
      )}
    </TelaApartamento>
  );
}

function TelaApartamento({ titulo, children }: { titulo: string; children: ReactNode }) {
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

function FormularioApartamento({ apartamento }: { apartamento?: ApartamentoEdicao }) {
  const [numero, setNumero] = useState(apartamento?.numero ?? "");
  const [idBloco, setIdBloco] = useState<string | null>(apartamento?.idBloco ?? null);
  const [erro, setErro] = useState<string | null>(null);
  const { dados: blocos, carregando, erro: erroBlocos } = useConsultaLocal(listarBlocos, ["bloco"], []);

  function salvar() {
    try {
      const dados = { numero, idBloco };
      if (apartamento) editarApartamento(apartamento.id, dados);
      else cadastrarApartamento(dados);
      void sincronizarAgora();
      voltar();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível salvar o apartamento.");
    }
  }

  return (
    <>
      <Text style={styles.subtitle}>Preencha os campos abaixo.</Text>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>
            Apartamento<Text style={styles.required}> *</Text>
          </Text>
          <TextInput
            style={styles.input}
            accessibilityLabel="Número do apartamento"
            placeholder="Ex.: Apartamento 201"
            placeholderTextColor={colors.muted}
            value={numero}
            onChangeText={(valor) => {
              setNumero(valor);
              setErro(null);
            }}
            returnKeyType="done"
          />
        </View>
        <SelectField
          label="Bloco"
          placeholder={carregando ? "Carregando blocos..." : "Selecione um bloco"}
          opcoes={blocos}
          valor={idBloco}
          onChange={(valor) => {
            setIdBloco(valor);
            setErro(null);
          }}
          obrigatorio
          desabilitado={carregando}
          vazio={erroBlocos ?? "Cadastre um bloco antes de cadastrar um apartamento."}
        />
        {erro ? <Text style={styles.error} accessibilityLiveRegion="polite">{erro}</Text> : null}
        <PrimaryButton
          title={apartamento ? "Salvar alterações" : "Cadastrar apartamento"}
          onPress={salvar}
          disabled={carregando}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  content: { padding: 20 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 18, marginBottom: 16 },
  form: { gap: 16 },
  field: { gap: 8 },
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

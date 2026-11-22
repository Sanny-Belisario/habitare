import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "@/components/BottomNav";
import { SindicoHeader } from "@/components/SindicoHeader";
import PrimaryButton from "@/components/PrimaryButton";
import { SelectField } from "@/components/SelectField";
import { sincronizarAgora } from "@/hooks/use-sincronizacao";
import { carregarFormularioComunicado, salvarComunicado } from "@/services/comunicado";
import { sessao } from "@/services/sessao";
import { colors } from "@/theme";

type Formulario = Awaited<ReturnType<typeof carregarFormularioComunicado>>;

function voltar() {
  if (router.canGoBack()) router.back();
  else router.replace("/pages/home/comunicados-sindico");
}

export default function NovoComunicado() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const usuario = sessao.obter();
  if (!usuario) return <Redirect href="/pages/auth/login" />;
  if (!usuario.isSindico) return <Redirect href="/pages/home/comunicados-morador" />;

  return <TelaFormulario key={id ?? "novo"} id={id} />;
}

function TelaFormulario({ id }: { id?: string }) {
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    carregarFormularioComunicado(id)
      .then((dados) => {
        if (ativo) setFormulario(dados);
      })
      .catch((falha: Error) => {
        if (ativo) setErro(falha.message);
      });
    return () => { ativo = false; };
  }, [id]);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SindicoHeader
            titulo={id ? "Editar comunicado" : "Novo comunicado"}
            onVoltar={voltar}
          />
          {formulario ? (
            <CamposComunicado formulario={formulario} />
          ) : (
            <Text style={styles.subtitle}>{erro ?? "Carregando formulário..."}</Text>
          )}
        </ScrollView>
        <BottomNav active="comunicados" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CamposComunicado({ formulario }: { formulario: Formulario }) {
  const { aviso, tipos } = formulario;
  const [titulo, setTitulo] = useState(aviso?.titulo ?? "");
  const [idTipoComunicado, setIdTipoComunicado] = useState(aviso?.idTipoComunicado ?? null);
  const [descricao, setDescricao] = useState(aviso?.descricao ?? "");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    try {
      await salvarComunicado({ titulo, idTipoComunicado, descricao }, aviso?.id);
      void sincronizarAgora();
      voltar();
    } catch (erro) {
      Alert.alert("Não foi possível salvar", (erro as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <Text style={styles.subtitle}>Preencha os campos abaixo.</Text>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Título<Text style={styles.required}> *</Text></Text>
          <TextInput
            style={styles.input}
            accessibilityLabel="Título"
            placeholder="Ex.: Manutenção"
            placeholderTextColor={colors.muted}
            value={titulo}
            onChangeText={setTitulo}
          />
        </View>
        <SelectField
          label="Tipo"
          placeholder="Selecione um tipo"
          opcoes={tipos}
          valor={idTipoComunicado}
          onChange={setIdTipoComunicado}
          vazio="Nenhum tipo de comunicado cadastrado"
          obrigatorio
        />
        <View style={styles.field}>
          <Text style={styles.label}>Descrição<Text style={styles.required}> *</Text></Text>
          <TextInput
            style={[styles.input, styles.description]}
            accessibilityLabel="Descrição"
            placeholder="Adicione os detalhes do comunicado"
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            value={descricao}
            onChangeText={setDescricao}
          />
        </View>
        <PrimaryButton
          title={aviso ? "Salvar alterações" : "Registrar comunicado"}
          onPress={salvar}
          disabled={salvando}
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
  description: { minHeight: 112 },
});

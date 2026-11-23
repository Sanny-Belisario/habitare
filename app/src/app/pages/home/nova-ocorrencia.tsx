import { Ionicons } from "@expo/vector-icons";
import { MenuConta } from "@/components/MenuConta";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MoradorBottomNav } from "@/components/MoradorBottomNav";
import { SelectField, type OpcaoSelect } from "@/components/SelectField";
import { useCabecalho } from "@/hooks/use-cabecalho";
import {
  atualizarOcorrencia,
  buscarOcorrencia,
  carregarOpcoesFormulario,
  criarOcorrencia,
  ehAberta,
} from "@/services/ocorrencia";
import { colors } from "@/theme";

type Apartamento = OpcaoSelect & { idBloco: string };

function voltar() {
  if (router.canGoBack()) router.back();
  else router.replace("/pages/home/ocorrencias-morador");
}

export default function NovaOcorrencia() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = typeof id === "string" && id.length > 0;
  const { marca } = useCabecalho();

  const [titulo, setTitulo] = useState("");
  const [idCategoria, setIdCategoria] = useState<string | null>(null);
  const [idBloco, setIdBloco] = useState<string | null>(null);
  const [idApartamento, setIdApartamento] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");

  const [categorias, setCategorias] = useState<OpcaoSelect[]>([]);
  const [blocos, setBlocos] = useState<OpcaoSelect[]>([]);
  const [apartamentos, setApartamentos] = useState<Apartamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const opcoes = await carregarOpcoesFormulario();
        if (!ativo) return;
        setCategorias(opcoes.categorias);
        setBlocos(opcoes.blocos);
        setApartamentos(opcoes.apartamentos);

        if (editando) {
          const atual = await buscarOcorrencia(id);
          if (!ativo) return;
          if (!atual) {
            Alert.alert("Ocorrência não encontrada");
            voltar();
            return;
          }
          if (!ehAberta(atual.status)) {
            Alert.alert(
              "Ocorrência em atendimento",
              "Só é possível alterar ocorrências abertas.",
            );
            voltar();
            return;
          }
          setTitulo(atual.titulo);
          setIdCategoria(atual.idCategoria);
          setIdBloco(atual.idBloco);
          setIdApartamento(atual.idApartamento);
          setDescricao(atual.descricao ?? "");
        } else if (opcoes.meuApartamento) {
          // Começa com o apartamento do morador.
          setIdBloco(opcoes.meuApartamento.idBloco);
          setIdApartamento(opcoes.meuApartamento.idApartamento);
        }
      } catch (erro) {
        if (ativo) Alert.alert("Erro", (erro as Error).message);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [editando, id]);

  const apartamentosDoBloco = useMemo(
    () => apartamentos.filter((a) => a.idBloco === idBloco),
    [apartamentos, idBloco],
  );

  function trocarBloco(novo: string | null) {
    setIdBloco(novo);
    // O apartamento escolhido pode não pertencer ao novo bloco.
    if (!apartamentos.some((a) => a.id === idApartamento && a.idBloco === novo)) {
      setIdApartamento(null);
    }
  }

  async function salvar() {
    if (!titulo.trim()) return Alert.alert("Campo obrigatório", "Informe o título.");
    if (!idCategoria) return Alert.alert("Campo obrigatório", "Selecione uma categoria.");
    if (!idBloco) return Alert.alert("Campo obrigatório", "Selecione um bloco.");

    const dados = { titulo, idCategoria, idBloco, idApartamento, descricao };
    setSalvando(true);
    try {
      if (editando) await atualizarOcorrencia(id, dados);
      else await criarOcorrencia(dados);
      voltar();
    } catch (erro) {
      Alert.alert("Não foi possível salvar", (erro as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.brand}>{marca}</Text>

          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={voltar}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color={colors.muted} />
              <Text style={styles.backLabel}>Voltar</Text>
            </TouchableOpacity>
            <MenuConta />
          </View>

          <Text style={styles.title}>
            {editando ? "Editar ocorrência" : "Nova ocorrência"}
          </Text>
          <Text style={styles.subtitle}>Preencha os campos abaixo.</Text>

          {carregando ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : (
            <View style={styles.form}>
              <View style={styles.group}>
                <Text style={styles.label}>
                  Título<Text style={styles.required}> *</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={titulo}
                  onChangeText={setTitulo}
                  placeholder="Ex.: Vazamento na garagem"
                  placeholderTextColor={colors.muted}
                  maxLength={120}
                />
              </View>

              <SelectField
                label="Categoria"
                placeholder="Selecione uma categoria"
                obrigatorio
                opcoes={categorias}
                valor={idCategoria}
                onChange={setIdCategoria}
                vazio="Nenhuma categoria cadastrada"
              />

              <SelectField
                label="Bloco"
                placeholder="Selecione um bloco"
                obrigatorio
                opcoes={blocos}
                valor={idBloco}
                onChange={trocarBloco}
                vazio="Nenhum bloco cadastrado"
              />

              <SelectField
                label="Apartamento"
                placeholder={idBloco ? "Selecione um apartamento" : "Selecione um bloco primeiro"}
                opcoes={apartamentosDoBloco}
                valor={idApartamento}
                onChange={setIdApartamento}
                desabilitado={!idBloco}
                vazio="Nenhum apartamento neste bloco"
              />

              <View style={styles.group}>
                <Text style={styles.label}>Descrição</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={descricao}
                  onChangeText={setDescricao}
                  placeholder="Descreva a situação encontrada..."
                  placeholderTextColor={colors.muted}
                  multiline
                  textAlignVertical="top"
                  maxLength={1000}
                />
              </View>

              <TouchableOpacity
                style={[styles.submit, salvando && styles.submitDisabled]}
                onPress={salvar}
                disabled={salvando}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                {salvando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>
                    {editando ? "Salvar alterações" : "Registrar ocorrência"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <MoradorBottomNav active="ocorrencias" />
      </KeyboardAvoidingView>
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
  },
  topRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 30 },
  backLabel: { fontSize: 14, color: colors.muted },
  title: { fontSize: 30, fontWeight: "800", color: colors.dark },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 18, marginBottom: 16 },
  loading: { marginTop: 40 },
  form: { gap: 16 },
  group: { gap: 8 },
  label: { fontSize: 14, fontWeight: "700", color: colors.dark },
  required: { color: "#D64242" },
  input: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.dark,
  },
  textArea: { minHeight: 112 },
  submit: {
    minHeight: 52,
    paddingVertical: 12,
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});

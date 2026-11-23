import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { estilosCampo } from "@/styles/campos-formulario";
import { colors } from "@/theme";

export interface OpcaoSelect {
  id: string;
  nome: string;
}

interface SelectFieldProps {
  label: string;
  placeholder: string;
  opcoes: OpcaoSelect[];
  valor: string | null;
  onChange: (id: string | null) => void;
  obrigatorio?: boolean;
  desabilitado?: boolean;
  vazio?: string; // texto quando não há opções
}

// Campo de seleção: abre a lista de opções numa folha na parte de baixo da tela.
export function SelectField({
  label,
  placeholder,
  opcoes,
  valor,
  onChange,
  obrigatorio,
  desabilitado,
  vazio = "Nenhuma opção disponível",
}: SelectFieldProps) {
  const [aberto, setAberto] = useState(false);
  const selecionada = opcoes.find((o) => o.id === valor);

  const escolher = (id: string | null) => {
    onChange(id);
    setAberto(false);
  };

  return (
    <View style={estilosCampo.grupo}>
      <Text style={estilosCampo.rotulo}>
        {label}
        {obrigatorio ? <Text style={estilosCampo.obrigatorio}> *</Text> : null}
      </Text>
      <TouchableOpacity
        style={[estilosCampo.controle, styles.input, desabilitado && styles.inputDisabled]}
        onPress={() => setAberto(true)}
        disabled={desabilitado}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selecionada?.nome ?? placeholder}`}
      >
        <Text style={[estilosCampo.texto, styles.inputText, !selecionada && styles.placeholder]}>
          {selecionada?.nome ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.muted} />
      </TouchableOpacity>

      <Modal
        visible={aberto}
        transparent
        animationType="fade"
        onRequestClose={() => setAberto(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setAberto(false)}>
          <SafeAreaView edges={["bottom"]} style={styles.sheet}>
            <Pressable>
              <Text style={styles.sheetTitle}>{label}</Text>
              <FlatList
                data={opcoes}
                keyExtractor={(o) => o.id}
                style={styles.list}
                ListHeaderComponent={
                  !obrigatorio && valor ? (
                    <TouchableOpacity
                      style={styles.option}
                      onPress={() => escolher(null)}
                    >
                      <Text style={styles.optionClear}>Nenhum</Text>
                    </TouchableOpacity>
                  ) : undefined
                }
                ListEmptyComponent={<Text style={styles.empty}>{vazio}</Text>}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => escolher(item.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: item.id === valor }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        item.id === valor && styles.optionSelected,
                      ]}
                    >
                      {item.nome}
                    </Text>
                    {item.id === valor ? (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                )}
              />
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputDisabled: { opacity: 0.55 },
  inputText: { flex: 1 },
  placeholder: { color: colors.muted },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(11, 31, 58, 0.35)",
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.dark,
    marginBottom: 8,
  },
  list: { maxHeight: 360 },
  option: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6EBF2",
  },
  optionText: { fontSize: 15, color: colors.dark },
  optionSelected: { fontWeight: "700", color: colors.primary },
  optionClear: { fontSize: 15, color: colors.muted },
  empty: { paddingVertical: 20, textAlign: "center", color: colors.muted },
});

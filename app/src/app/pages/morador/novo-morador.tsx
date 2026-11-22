import { SafeAreaView } from "react-native-safe-area-context";
import { MenuConta } from "@/components/MenuConta";
import { router } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { navegarPelaBarra } from "@/components/BottomNav";
import type { NavKey } from "@/types";

const fields = [
  { label: "Nome Completo", placeholder: "Informe o nome do novo morador" },
  { label: "E-mail", placeholder: "Informe o e-mail do morador" },
  { label: "Telefone", placeholder: "Informe o telefone do morador" },
  { label: "Bloco", placeholder: "Selecione um bloco", dropdown: true },
  {
    label: "Apartamento",
    placeholder: "Selecione um apartamento",
    dropdown: true,
  },
];

const navigationItems = [
  { label: "Início", icon: "⌂" },
  { label: "Comunicados", icon: "≡" },
  { label: "Ocorrências", icon: "□" },
  { label: "Configurações", icon: "⚙", selected: true },
];

export default function NovoMorador() {
  function navegar(label: string) {
    const chaves: Record<string, NavKey> = {
      Início: "inicio",
      Comunicados: "comunicados",
      Ocorrências: "ocorrencias",
      Configurações: "configuracoes",
    };
    navegarPelaBarra(chaves[label]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.brand}>HABITARE / CONDOMÍNIO AURORA</Text>

          <View style={styles.topRow}>
            <Pressable
              style={styles.backRow}
              onPress={() => router.replace("/pages/configuracoes")}
              accessibilityRole="button"
            >
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backText}>Voltar</Text>
            </Pressable>
            <MenuConta />
          </View>

          <Text style={styles.title}>Novo morador</Text>
          <Text style={styles.subtitle}>Preencha o campo abaixo.</Text>

          <View style={styles.form}>
            {fields.map((field) => (
              <View key={field.label} style={styles.fieldGroup}>
                <Text style={styles.label}>
                  {field.label}
                  <Text style={styles.required}> *</Text>
                </Text>
                <View style={styles.input}>
                  <Text style={styles.placeholder}>{field.placeholder}</Text>
                  {field.dropdown ? (
                    <Text style={styles.dropdownMark}>⌄</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          <Pressable
            style={styles.submitButton}
            onPress={() =>
              Alert.alert(
                "Cadastro não implementado",
                "Este formulário está disponível apenas para conferência visual.",
              )
            }
            accessibilityRole="button"
          >
            <Text style={styles.submitText}>Cadastrar morador</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.bottomBar}>
          {navigationItems.map((item) => (
            <Pressable
              key={item.label}
              style={[
                styles.navigationItem,
                item.selected && styles.selectedItem,
              ]}
              onPress={() => navegar(item.label)}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.navigationIcon,
                  item.selected && styles.selectedText,
                ]}
              >
                {item.icon}
              </Text>
              <Text
                style={[
                  styles.navigationLabel,
                  item.selected && styles.selectedText,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7FA",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F4F7FA",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 22,
  },
  brand: {
    color: "#263B50",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  topRow: {
    height: 36,
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  backArrow: {
    color: "#8393A3",
    fontSize: 19,
    lineHeight: 22,
  },
  backText: {
    color: "#8393A3",
    fontSize: 9,
  },
  title: {
    color: "#1E3348",
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "700",
    marginTop: -1,
  },
  subtitle: {
    color: "#7D8C9C",
    fontSize: 9,
    marginTop: 14,
    marginBottom: 11,
  },
  form: {
    gap: 9,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    color: "#172D40",
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "700",
  },
  required: {
    color: "#D64242",
  },
  input: {
    height: 36,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  placeholder: {
    color: "#8897A6",
    fontSize: 8,
  },
  dropdownMark: {
    color: "#6F8091",
    fontSize: 13,
    marginRight: 1,
  },
  submitButton: {
    height: 36,
    marginTop: 13,
    borderRadius: 9,
    backgroundColor: "#2B4183",
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  bottomBar: {
    minHeight: 48,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E6EBF0",
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navigationItem: {
    minWidth: 42,
    height: 35,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    flex: 1,
  },
  selectedItem: {
    backgroundColor: "#DFEAF1",
  },
  navigationIcon: {
    color: "#536B82",
    fontSize: 13,
    lineHeight: 15,
  },
  navigationLabel: {
    color: "#7B8998",
    fontSize: 6,
  },
  selectedText: {
    color: "#29447F",
  },
});

import { Redirect, router } from "expo-router";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "@/components/BottomNav";
import CardActions from "@/components/CardActions";
import { SindicoHeader } from "@/components/SindicoHeader";
import PrimaryButton from "@/components/PrimaryButton";
import { useConsultaLocal } from "@/hooks/use-consulta-local";
import { sincronizarAgora } from "@/hooks/use-sincronizacao";
import { excluirComunicado, listarComunicadosDoSindico } from "@/services/comunicado";
import { sessao } from "@/services/sessao";
import { colors } from "@/theme";

const TABELAS = ["comunicado", "tipo_comunicado"];

function confirmarExclusao(id: string, titulo: string) {
  Alert.alert("Excluir comunicado?", `O comunicado “${titulo}” será removido dos avisos do condomínio.`, [
    { text: "Cancelar", style: "cancel" },
    {
      text: "Excluir",
      style: "destructive",
      onPress: async () => {
        try {
          await excluirComunicado(id);
          void sincronizarAgora();
        } catch (erro) {
          Alert.alert("Não foi possível excluir", (erro as Error).message);
        }
      },
    },
  ]);
}

export default function ComunicadosSindico() {
  const usuario = sessao.obter();
  if (!usuario) return <Redirect href="/pages/auth/login" />;
  if (!usuario.isSindico) return <Redirect href="/pages/home/comunicados-morador" />;

  return <ListaComunicados idCondominio={usuario.idCondominio} />;
}

function ListaComunicados({ idCondominio }: { idCondominio: string }) {
  const { dados, carregando, erro } = useConsultaLocal(
    listarComunicadosDoSindico,
    TABELAS,
    [],
    [idCondominio],
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <FlatList
        data={dados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={Separador}
        ListHeaderComponent={
          <>
            <SindicoHeader titulo="Comunicados" />
            <Text style={styles.sectionTitle} accessibilityRole="header">Avisos do condomínio</Text>
            <PrimaryButton
              title="Criar Novo Comunicado"
              onPress={() => router.push("/pages/home/novo-comunicado")}
            />
          </>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {carregando ? "Carregando comunicados..." : erro ?? "Nenhum comunicado por enquanto."}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.category}>{item.tipo.toLocaleUpperCase("pt-BR")}</Text>
            <Text style={styles.title}>{item.titulo}</Text>
            {item.descricao ? (
              <Text style={styles.description} numberOfLines={1}>{item.descricao}</Text>
            ) : null}
            <CardActions
              editLabel={`Editar ${item.titulo}`}
              deleteLabel={`Excluir ${item.titulo}`}
              onEdit={() => router.push({
                pathname: "/pages/home/novo-comunicado",
                params: { id: item.id },
              })}
              onDelete={() => confirmarExclusao(item.id, item.titulo)}
            />
          </View>
        )}
      />
      <BottomNav active="comunicados" />
    </SafeAreaView>
  );
}

function Separador() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 24 },
  sectionTitle: { color: colors.dark, fontSize: 17, fontWeight: "700", marginTop: 20, marginBottom: 16 },
  card: { backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  category: {
    alignSelf: "flex-start",
    backgroundColor: colors.navActive,
    color: colors.primary,
    borderRadius: 7,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 10,
    fontWeight: "700",
  },
  title: { color: colors.dark, fontSize: 16, fontWeight: "700", marginTop: 7 },
  description: { color: colors.muted, fontSize: 13, marginTop: 3 },
  empty: { color: colors.muted, textAlign: "center", paddingVertical: 16 },
  separator: { height: 10 },
});

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState, type ComponentRef } from "react";
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { useSessao } from "@/hooks/use-sessao";
import { sessao } from "@/services/sessao";
import { colors } from "@/theme";

const LARGURA_MENU = 144;
const MARGEM = 8;

export function MenuConta() {
  const usuario = useSessao();
  const ancora = useRef<ComponentRef<typeof View>>(null);
  const { width: larguraTela } = useWindowDimensions();
  const [posicao, setPosicao] = useState<{ direita: number; topo: number } | null>(null);

  if (!usuario) return null;

  const nome = usuario.nome.trim().normalize("NFC");
  const inicial = Array.from(nome)[0]?.toLocaleUpperCase("pt-BR") ?? "?";
  const esquerda = posicao
    ? Math.max(MARGEM, Math.min(posicao.direita, larguraTela - MARGEM) - LARGURA_MENU)
    : MARGEM;

  function abrir() {
    ancora.current?.measureInWindow((x, y, largura, altura) => {
      if (!largura || !altura) return;
      setPosicao({ direita: x + largura, topo: y + altura + MARGEM });
    });
  }

  function fechar() {
    setPosicao(null);
  }

  function sair() {
    fechar();
    sessao.limpar();
    router.dismissTo("/pages/auth/login");
  }

  return (
    <View ref={ancora} collapsable={false} style={styles.anchor}>
      <Pressable
        style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
        onPress={abrir}
        accessibilityRole="button"
        accessibilityLabel={nome ? `Menu da conta de ${nome}` : "Menu da conta"}
        accessibilityState={{ expanded: posicao !== null }}
      >
        <Text style={styles.initial}>{inicial}</Text>
      </Pressable>
      {posicao ? (
        <Modal transparent statusBarTranslucent navigationBarTranslucent onRequestClose={fechar}>
          <View style={styles.overlay} accessibilityViewIsModal>
            <Pressable style={StyleSheet.absoluteFill} onPress={fechar} accessible={false} />
            <Pressable
              style={({ pressed }) => [
                styles.menu,
                { top: posicao.topo, left: esquerda },
                pressed && styles.pressed,
              ]}
              onPress={sair}
              accessibilityRole="button"
            >
              <Ionicons name="log-out-outline" size={20} color={colors.trash} />
              <Text style={styles.exit}>Sair</Text>
            </Pressable>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { alignSelf: "flex-start" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.navActive,
  },
  initial: { color: colors.primary, fontWeight: "700", fontSize: 16 },
  overlay: { flex: 1 },
  menu: {
    position: "absolute",
    width: LARGURA_MENU,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.navActive,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: colors.dark,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  exit: { color: colors.trash, fontWeight: "700", fontSize: 14 },
  pressed: { opacity: 0.72 },
});

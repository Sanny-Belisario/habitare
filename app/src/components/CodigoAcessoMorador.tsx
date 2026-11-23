import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Alert, Animated, AppState, Pressable, StyleSheet, Text, View } from "react-native";

import { sincronizarAgora } from "@/hooks/use-sincronizacao";
import { consultarCodigoMorador, renovarCodigoMorador } from "@/services/morador";
import { colors } from "@/theme";

interface Props {
  id: string;
  nome: string;
  temCodigoAcesso: boolean;
}

export function CodigoAcessoMorador({ id, nome, temCodigoAcesso }: Props) {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [opacidade] = useState(() => new Animated.Value(1));
  const pedidoAtual = useRef<AbortController | null>(null);
  const emFoco = useRef(false);

  const ocultar = useCallback(() => {
    pedidoAtual.current?.abort();
    pedidoAtual.current = null;
    opacidade.stopAnimation();
    opacidade.setValue(1);
    setCodigo(null);
    setCarregando(false);
  }, [opacidade]);

  useFocusEffect(useCallback(() => {
    emFoco.current = true;
    return () => {
      emFoco.current = false;
      ocultar();
    };
  }, [ocultar]));

  useEffect(() => {
    if (!codigo && !carregando) return;
    const assinatura = AppState.addEventListener("change", (estado) => {
      if (estado !== "active") ocultar();
    });
    return () => assinatura.remove();
  }, [codigo, carregando, ocultar]);

  function mudarVisibilidade(valor: string | null) {
    opacidade.setValue(0);
    setCodigo(valor);
    Animated.timing(opacidade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }

  async function carregarCodigo(renovar = false) {
    if (!emFoco.current || pedidoAtual.current) return;
    const pedido = new AbortController();
    pedidoAtual.current = pedido;
    setCarregando(true);

    try {
      const valor = await (renovar
        ? renovarCodigoMorador(id, pedido.signal)
        : consultarCodigoMorador(id, pedido.signal));
      if (pedido.signal.aborted) return;
      if (renovar) void sincronizarAgora();

      if (valor) {
        mudarVisibilidade(valor);
      } else {
        Alert.alert(
          temCodigoAcesso ? "Código não encontrado" : "Gerar código de acesso?",
          temCodigoAcesso
            ? "Você pode gerar um novo código. O anterior perde a validade após a sincronização."
            : "O novo código poderá ser usado pelo morador para entrar com o e-mail cadastrado.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Gerar novo código", onPress: () => void carregarCodigo(true) },
          ],
        );
      }
    } catch (erro) {
      if (!pedido.signal.aborted) {
        Alert.alert("Não foi possível acessar o código", erro instanceof Error ? erro.message : "Tente novamente.");
      }
    } finally {
      if (pedidoAtual.current === pedido) {
        pedidoAtual.current = null;
        setCarregando(false);
      }
    }
  }

  async function copiarCodigo() {
    if (!codigo || !emFoco.current) return;

    const copiado = await Clipboard.setStringAsync(codigo, {
      android: { isSensitive: true },
    }).catch(() => false);
    if (!emFoco.current) return;

    if (copiado) {
      AccessibilityInfo.announceForAccessibility("Código de acesso copiado.");
    } else {
      Alert.alert("Não foi possível copiar o código", "Tente novamente.");
    }
  }

  const valor = codigo ?? (temCodigoAcesso ? "******" : "Não cadastrado");
  const acao = codigo ? "Ocultar" : temCodigoAcesso ? "Mostrar" : "Gerar";

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.value, { opacity: opacidade }]}>
        <Text style={styles.text} selectable={codigo !== null}>
          Código de acesso: {valor}
        </Text>
      </Animated.View>
      <Pressable
        onPress={() => codigo ? mudarVisibilidade(null) : void carregarCodigo()}
        disabled={carregando}
        accessibilityRole="button"
        accessibilityLabel={`${acao} código de acesso de ${nome}`}
        accessibilityState={{ busy: carregando, disabled: carregando }}
        hitSlop={8}
        style={styles.iconButton}
      >
        <Ionicons name={codigo ? "eye-outline" : "eye-off-outline"} size={17} color={colors.muted} />
      </Pressable>
      {codigo && (
        <Pressable
          onPress={copiarCodigo}
          accessibilityRole="button"
          accessibilityLabel={`Copiar código de acesso de ${nome}`}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Ionicons name="copy-outline" size={17} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  value: { flexShrink: 1 },
  text: { color: colors.muted, fontSize: 12 },
  iconButton: { minWidth: 28, minHeight: 28, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.5 },
});

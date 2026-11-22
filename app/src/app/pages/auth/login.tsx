import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, type ComponentRef } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { styles } from "@/styles";
import { CardLogin } from "@/components/card-login";
import { Usuario } from "@/services/usuario";
import { router } from "expo-router";

interface AcessoLogin {
  email: string;
  senha: string;
}

export default function Login() {
  const logo = require("../../../../assets/images/logo-habitare.png");
  const usuarios = new Usuario();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  // Com o teclado aberto, rola até o fim para o campo de senha e o botão
  // "Entrar" ficarem acima dele.
  useEffect(() => {
    const assinatura = Keyboard.addListener("keyboardDidShow", () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => assinatura.remove();
  }, []);

  async function acessoLogin(data: AcessoLogin) {
    if (!data.email.trim()) {
      Alert.alert("Login", "E-mail não pode ser vazio");
      return;
    } else if (!data.senha || data.senha.length < 6) {
      Alert.alert(
        "Login",
        "A senha ou o código de acesso deve ter, no mínimo, 6 caracteres",
      );
      return;
    }

    let login;
    try {
      login = await usuarios.login(data);
    } catch (erro) {
      console.error("Erro ao fazer login:", erro);
      Alert.alert("Login", "Não foi possível fazer login. Tente novamente.");
      return;
    }

    if (!login.sucesso) {
      Alert.alert("Login", login.message);
      return;
    }

    // Redirect é um componente (usa hooks): fora do render, navegue pelo router.
    // replace: o botão voltar não deve retornar ao login.
    router.replace(
      login.isSindico
        ? "/pages/home/inicio-sindico"
        : "/pages/home/inicio-morador",
    );
  }
  return (
    // Android é edge-to-edge: a janela não encolhe com o teclado, então o
    // KeyboardAvoidingView precisa de behavior nas duas plataformas.
    <KeyboardAvoidingView style={styles.loginScreen} behavior="padding">
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.loginContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image source={logo} style={styles.logo} />
        <CardLogin acessoLogin={acessoLogin} />
      </ScrollView>
      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

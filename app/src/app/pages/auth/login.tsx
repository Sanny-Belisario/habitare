import { Alert } from "react-native";
import { CardLogin } from "@/components/card-login";
import { TelaAutenticacao } from "@/components/TelaAutenticacao";
import { Usuario } from "@/services/usuario";
import { router } from "expo-router";

interface AcessoLogin {
  email: string;
  senha: string;
}

export default function Login() {
  const usuarios = new Usuario();

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

    router.replace("/");
  }
  return (
    <TelaAutenticacao>
      <CardLogin acessoLogin={acessoLogin} />
    </TelaAutenticacao>
  );
}

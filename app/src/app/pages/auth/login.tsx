import { StatusBar } from "expo-status-bar";
import { View, Image } from "react-native";
import { styles } from "@/styles";
import { CardLogin } from "@/components/card-login";
import { Usuario } from "@/services/usuario";
import { Redirect } from "expo-router";

interface AcessoLogin {
  email: string;
  senha: string;
}

export default function Login() {
  const logo = require("../../../../assets/images/logo-habitare.png");
  const usuarios = new Usuario();
  async function acessoLogin(data: AcessoLogin) {
    if (!data.email) {
      console.log("E-mail não pode ser vazio");
    } else if (!data.senha || data.senha.length < 6) {
      console.log("Senha deve conter, no minimo 6 caracteres");
    }

    const login = await usuarios.login(data);

    if (!login.sucesso) {
      console.log(login.message);
    }

    console.log(login.message);

    Redirect({ href: "pages/home/visao-geral" });
  }
  return (
    <View style={styles.loginContainer}>
      <Image source={logo} style={styles.logo} />
      <CardLogin acessoLogin={acessoLogin} />
      <StatusBar style="auto" />
    </View>
  );
}

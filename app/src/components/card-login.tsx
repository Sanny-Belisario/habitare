import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { useState } from "react";
import { Link } from "expo-router";

interface Dados {
  email: string;
  senha: string;
}
interface Login {
  acessoLogin: (data: Dados) => Promise<void>;
}

export function CardLogin({ acessoLogin }: Login) {
  const [email, setEmail] = useState<string>("");
  const [senha, setSenha] = useState<string>("");

  return (
    <View style={cardLogin.card}>
      <View style={cardLogin.contentInput}>
        <Text style={cardLogin.textInput}>E-mail:</Text>
        <TextInput
          placeholder="Digite o seu e-mail"
          style={cardLogin.input}
          onChangeText={(e) => setEmail(e)}
        />
      </View>
      <View style={cardLogin.contentInput}>
        <Text style={cardLogin.textInput}>Senha/Código de acesso:</Text>
        <TextInput
          placeholder="Digite sua senha ou código de acesso"
          style={cardLogin.input}
          onChangeText={(e) => setSenha(e)}
        />
        <Pressable
          style={{
            display: "flex",
            alignContent: "flex-end",
            width: "90%",
          }}
        >
          <Text
            style={{
              textAlign: "end",
              ...cardLogin.text,
            }}
          >
            Esqueci a senha/código de acesso
          </Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => acessoLogin({ email, senha })}
        style={cardLogin.buttonLogin}
      >
        <Text style={cardLogin.textButton}>Entrar</Text>
      </Pressable>
      <Link href={"pages/home/visao-geral"}>
        <Text
          style={{
            ...cardLogin.text,
            textAlign: "center",
          }}
        >
          Ver criadores
        </Text>
      </Link>
    </View>
  );
}

const cardLogin = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    width: "75%",
    height: "45%",
    borderRadius: "4%",
    padding: 10,
    display: "flex",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    opacity: 0.8,
  },
  input: {
    backgroundColor: "#fff",
    width: "90%",
    height: "50%",
    borderRadius: 10,
    fontSize: 12,
    padding: 12,
  },
  contentInput: {
    display: "flex",
    gap: 5,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    width: "100%",
    height: "30%",
  },
  textInput: {
    textAlign: "start",
    fontSize: 12,
    fontWeight: "bold",
    width: "90%",
    color: "#172D40",
  },
  buttonLogin: {
    display: "flex",
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
    width: "90%",
    height: "12%",
    borderRadius: 10,
    textAlign: "center",
    backgroundColor: "#001B2E",
  },

  text: {
    fontSize: 12,
    color: "#2F4B5E",
  },

  textButton: {
    color: "#fff",
    fontWeight: "bold",
  },
});

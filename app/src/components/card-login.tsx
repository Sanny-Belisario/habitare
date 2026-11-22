import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Keyboard,
} from "react-native";
import { useRef, useState, type ComponentRef } from "react";
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
  // Campo em foco, para destacar a borda e o rótulo de quem está sendo digitado.
  const [focado, setFocado] = useState<"email" | "senha" | null>(null);
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const senhaRef = useRef<ComponentRef<typeof TextInput>>(null);

  function entrar() {
    Keyboard.dismiss();
    acessoLogin({ email, senha });
  }

  return (
    <View style={cardLogin.card}>
      <View style={cardLogin.contentInput}>
        <Text
          style={[cardLogin.textInput, focado === "email" && cardLogin.labelFocado]}
          onPress={() => emailRef.current?.focus()}
        >
          E-mail:
        </Text>
        <TextInput
          ref={emailRef}
          placeholder="Digite o seu e-mail"
          style={[cardLogin.input, focado === "email" && cardLogin.inputFocado]}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onFocus={() => setFocado("email")}
          onBlur={() => setFocado((f) => (f === "email" ? null : f))}
          onSubmitEditing={() => senhaRef.current?.focus()}
          onChangeText={(e) => setEmail(e)}
        />
      </View>
      <View style={cardLogin.contentInput}>
        <Text
          style={[cardLogin.textInput, focado === "senha" && cardLogin.labelFocado]}
          onPress={() => senhaRef.current?.focus()}
        >
          Senha/Código de acesso:
        </Text>
        <TextInput
          ref={senhaRef}
          placeholder="Digite sua senha ou código de acesso"
          style={[cardLogin.input, focado === "senha" && cardLogin.inputFocado]}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onFocus={() => setFocado("senha")}
          onBlur={() => setFocado((f) => (f === "senha" ? null : f))}
          onSubmitEditing={entrar}
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
        onPress={entrar}
        style={cardLogin.buttonLogin}
      >
        <Text style={cardLogin.textButton}>Entrar</Text>
      </Pressable>
      <Link href="/pages/auth/criadores">
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
    maxWidth: 420,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 24,
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
    height: 46,
    borderRadius: 10,
    fontSize: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#D5DDE6",
  },
  inputFocado: {
    borderColor: "#243B7A",
    backgroundColor: "#F5F8FF",
  },
  labelFocado: {
    color: "#243B7A",
  },
  contentInput: {
    display: "flex",
    gap: 5,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    width: "100%",
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
    height: 46,
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

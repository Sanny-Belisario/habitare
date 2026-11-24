import {
  View,
  Text,
  TextInput,
  Pressable,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState, type ComponentRef } from "react";
import { Link } from "expo-router";
import { cardLogin } from "@/styles/card-login";
import { colors } from "@/theme";

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
  const [senhaVisivel, setSenhaVisivel] = useState(false);
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
          placeholderTextColor={colors.muted}
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
        <View style={cardLogin.campoSenha}>
          <TextInput
            ref={senhaRef}
            placeholder="Digite sua senha ou código de acesso"
            style={[cardLogin.input, cardLogin.inputSenha, focado === "senha" && cardLogin.inputFocado]}
            placeholderTextColor={colors.muted}
            secureTextEntry={!senhaVisivel}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onFocus={() => setFocado("senha")}
            onBlur={() => setFocado((f) => (f === "senha" ? null : f))}
            onSubmitEditing={entrar}
            value={senha}
            onChangeText={setSenha}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={senhaVisivel ? "Ocultar senha ou código de acesso" : "Mostrar senha ou código de acesso"}
            onPress={() => setSenhaVisivel((visivel) => !visivel)}
            style={cardLogin.botaoVisibilidadeSenha}
          >
            <Ionicons name={senhaVisivel ? "eye-outline" : "eye-off-outline"} size={17} color={colors.muted} />
          </Pressable>
        </View>
        <Link asChild href="/pages/auth/esqueci-a-senha">
          <Pressable style={{ width: "90%" }}>
            <Text style={[cardLogin.text, { textAlign: "end" }]}>
              Esqueci a senha/código de acesso
            </Text>
          </Pressable>
        </Link>
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

import { Link } from "expo-router";
import { useRef, useState } from "react";
import { Keyboard, Pressable, Text, TextInput, View } from "react-native";

import { TelaAutenticacao } from "@/components/TelaAutenticacao";
import { sincronizarAgora } from "@/hooks/use-sincronizacao";
import { Usuario } from "@/services/usuario";
import { cardLogin } from "@/styles/card-login";
import { colors } from "@/theme";

const usuarios = new Usuario();

function CampoSenha({ rotulo, valor, alterar, editavel, enviar }: {
  rotulo: string;
  valor: string;
  alterar: (valor: string) => void;
  editavel: boolean;
  enviar?: () => void;
}) {
  const [focado, setFocado] = useState(false);

  return (
    <View style={cardLogin.contentInput}>
      <Text style={[cardLogin.textInput, focado && cardLogin.labelFocado]}>{rotulo}</Text>
      <TextInput
        accessibilityLabel={rotulo}
        style={[cardLogin.input, focado && cardLogin.inputFocado]}
        placeholderTextColor={colors.muted}
        value={valor}
        onChangeText={alterar}
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
        onSubmitEditing={enviar}
        editable={editavel}
        secureTextEntry
        autoComplete="new-password"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

export default function EsqueciASenha() {
  const [etapa, setEtapa] = useState<"email" | "senha" | "concluido">("email");
  const [email, setEmail] = useState("");
  const [focado, setFocado] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);
  const gravando = useRef(false);

  function consultar() {
    Keyboard.dismiss();
    if (!email.trim()) {
      setMensagem("Informe seu e-mail.");
      return;
    }

    try {
      const perfil = usuarios.consultarRecuperacao(email);
      if (perfil === "morador") {
        setMensagem("Peça o código de acesso ao síndico do seu condomínio.");
        return;
      }
      setMensagem("");
      setEtapa("senha");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível consultar o cadastro.");
    }
  }

  async function salvar() {
    if (gravando.current) return;
    if (senha.length < 6) {
      setMensagem("A senha deve ter, no mínimo, 6 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setMensagem("As senhas precisam ser iguais.");
      return;
    }

    Keyboard.dismiss();
    gravando.current = true;
    setSalvando(true);
    setMensagem("");
    try {
      await usuarios.redefinirSenha(email, senha);
      setSenha("");
      setConfirmacao("");
      setEtapa("concluido");
      setMensagem("Senha redefinida. Use a nova senha para entrar.");
      void sincronizarAgora();
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível redefinir a senha.");
    } finally {
      gravando.current = false;
      setSalvando(false);
    }
  }

  return (
    <TelaAutenticacao>
      <View style={cardLogin.card}>
        <Text accessibilityRole="header" style={[cardLogin.textInput, { fontSize: 16 }]}>
          {etapa === "senha" ? "Redefinir senha" : "Esqueci a senha"}
        </Text>
        {etapa === "email" && (
          <View style={cardLogin.contentInput}>
            <Text style={[cardLogin.textInput, focado && cardLogin.labelFocado]}>E-mail</Text>
            <TextInput
              accessibilityLabel="E-mail"
              placeholder="Digite o seu e-mail"
              style={[cardLogin.input, focado && cardLogin.inputFocado]}
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(valor) => {
                setEmail(valor);
                setMensagem("");
              }}
              onFocus={() => setFocado(true)}
              onBlur={() => setFocado(false)}
              onSubmitEditing={consultar}
            />
          </View>
        )}
        {etapa === "senha" && (
          <>
            <CampoSenha rotulo="Nova senha" valor={senha} alterar={setSenha} editavel={!salvando} />
            <CampoSenha
              rotulo="Confirme a nova senha"
              valor={confirmacao}
              alterar={setConfirmacao}
              editavel={!salvando}
              enviar={salvar}
            />
          </>
        )}
        {!!mensagem && (
          <Text accessibilityLiveRegion="polite" style={[cardLogin.text, { width: "90%" }]}>
            {mensagem}
          </Text>
        )}
        {etapa !== "concluido" && (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: salvando, busy: salvando }}
            disabled={salvando}
            onPress={etapa === "email" ? consultar : salvar}
            style={cardLogin.buttonLogin}
          >
            <Text style={cardLogin.textButton}>
              {etapa === "email" ? "Continuar" : salvando ? "Salvando..." : "Redefinir senha"}
            </Text>
          </Pressable>
        )}
        {!salvando && (
          <Link dismissTo href="/pages/auth/login" style={cardLogin.text}>
            Voltar ao login
          </Link>
        )}
      </View>
    </TelaAutenticacao>
  );
}

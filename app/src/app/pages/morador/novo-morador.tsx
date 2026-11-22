import { Redirect, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "@/components/BottomNav";
import { CampoTexto } from "@/components/CampoTexto";
import PrimaryButton from "@/components/PrimaryButton";
import { SelectField } from "@/components/SelectField";
import { SindicoHeader } from "@/components/SindicoHeader";
import { useConsultaLocal } from "@/hooks/use-consulta-local";
import { useSessao } from "@/hooks/use-sessao";
import { sincronizarAgora } from "@/hooks/use-sincronizacao";
import { listarApartamentos, TABELAS_APARTAMENTOS, tituloApartamento } from "@/services/apartamento";
import { listarBlocos } from "@/services/bloco";
import { cadastrarMorador } from "@/services/morador";
import { estilosCampo } from "@/styles/campos-formulario";
import { colors } from "@/theme";

const listaMoradores = {
  pathname: "/pages/configuracoes",
  params: { aba: "moradores" },
} as const;

function voltar() {
  router.dismissTo(listaMoradores);
}

export default function NovoMorador() {
  const usuario = useSessao();
  if (!usuario) return <Redirect href="/pages/auth/login" />;
  if (!usuario.isSindico) return <Redirect href={listaMoradores} />;

  return <CadastroMorador key={usuario.id} />;
}

function CadastroMorador() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [idBloco, setIdBloco] = useState<string | null>(null);
  const [idApartamento, setIdApartamento] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [acesso, setAcesso] = useState<Awaited<ReturnType<typeof cadastrarMorador>> | null>(null);
  const pendente = useRef<AbortController | null>(null);
  useEffect(() => () => pendente.current?.abort(), []);

  const { dados: blocos, carregando: carregandoBlocos, erro: erroBlocos } = useConsultaLocal(
    listarBlocos, ["bloco"], [],
  );
  const { dados: apartamentos, carregando: carregandoApartamentos, erro: erroApartamentos } = useConsultaLocal(
    listarApartamentos, TABELAS_APARTAMENTOS, [],
  );
  const opcoesApartamentos = apartamentos
    .filter((apartamento) => apartamento.idBloco === idBloco)
    .map((apartamento) => ({ id: apartamento.id, nome: tituloApartamento(apartamento.numero) }));

  async function salvar() {
    if (pendente.current || acesso) return;
    const pedido = new AbortController();
    pendente.current = pedido;
    setSalvando(true);
    setErro(null);
    Keyboard.dismiss();
    try {
      const resultado = await cadastrarMorador({ nome, email, telefone, idBloco, idApartamento }, pedido.signal);
      if (pedido.signal.aborted) return;
      setAcesso(resultado);
      void sincronizarAgora();
    } catch (falha) {
      if (!pedido.signal.aborted) {
        setErro(falha instanceof Error ? falha.message : "Não foi possível cadastrar o morador.");
      }
    } finally {
      pendente.current = null;
      if (!pedido.signal.aborted) setSalvando(false);
    }
  }

  const falha = erro ?? erroBlocos ?? erroApartamentos;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior="padding" style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SindicoHeader titulo={acesso ? "Morador cadastrado" : "Novo morador"} onVoltar={voltar} />
          {acesso ? (
            <>
              <Text style={styles.subtitle}>O morador entra com o e-mail e o código abaixo. Guarde o código, pois ele é exibido apenas agora.</Text>
              <View style={styles.accessCard}>
                <Text style={estilosCampo.rotulo}>E-mail</Text>
                <Text style={[estilosCampo.texto, styles.accessValue]} selectable>{acesso.email}</Text>
                <Text style={estilosCampo.rotulo}>Código de acesso</Text>
                <Text style={styles.code} selectable>{acesso.codigo}</Text>
              </View>
              <PrimaryButton title="Concluir" onPress={voltar} />
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>Preencha os campos abaixo.</Text>
              <View style={styles.form}>
                <CampoTexto
                  label="Nome completo"
                  obrigatorio
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                  autoComplete="name"
                  editable={!salvando}
                  placeholder="Informe o nome do novo morador"
                />
                <CampoTexto
                  label="E-mail"
                  obrigatorio
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  autoCorrect={false}
                  editable={!salvando}
                  placeholder="Informe o e-mail do morador"
                />
                <CampoTexto
                  label="Telefone"
                  obrigatorio
                  value={telefone}
                  onChangeText={setTelefone}
                  autoComplete="tel"
                  keyboardType="phone-pad"
                  editable={!salvando}
                  placeholder="Informe o telefone do morador"
                />
                <SelectField
                  label="Bloco"
                  placeholder={carregandoBlocos ? "Carregando blocos..." : "Selecione um bloco"}
                  opcoes={blocos}
                  valor={idBloco}
                  onChange={(id) => {
                    setIdBloco(id);
                    setIdApartamento(null);
                    setErro(null);
                  }}
                  obrigatorio
                  desabilitado={salvando || carregandoBlocos}
                  vazio="Nenhum bloco ativo no condomínio."
                />
                <SelectField
                  label="Apartamento"
                  placeholder={idBloco ? "Selecione um apartamento" : "Selecione um bloco primeiro"}
                  opcoes={opcoesApartamentos}
                  valor={idApartamento}
                  onChange={(id) => {
                    setIdApartamento(id);
                    setErro(null);
                  }}
                  obrigatorio
                  desabilitado={salvando || carregandoApartamentos || !idBloco}
                  vazio="Nenhum apartamento ativo neste bloco."
                />
                {falha ? <Text style={styles.error} accessibilityLiveRegion="polite">{falha}</Text> : null}
                <PrimaryButton
                  title={salvando ? "Cadastrando morador..." : "Cadastrar morador"}
                  onPress={salvar}
                  disabled={salvando || carregandoBlocos || carregandoApartamentos}
                />
              </View>
            </>
          )}
        </ScrollView>
        <BottomNav active="configuracoes" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  content: { padding: 20 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 18, marginBottom: 16 },
  form: { gap: 16 },
  accessCard: { backgroundColor: colors.card, padding: 16, borderRadius: 12, gap: 8, marginBottom: 16 },
  accessValue: { marginBottom: 8 },
  code: { color: colors.primary, fontSize: 16, fontWeight: "700" },
  error: { color: colors.trash, fontSize: 13 },
});

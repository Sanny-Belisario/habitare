import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { buscarMoradorParaEdicao, cadastrarMorador, editarMorador, TABELAS_MORADORES } from "@/services/morador";
import { estilosCampo } from "@/styles/campos-formulario";
import { colors } from "@/theme";

const listaMoradores = {
  pathname: "/pages/configuracoes",
  params: { aba: "moradores" },
} as const;

type MoradorEdicao = NonNullable<Awaited<ReturnType<typeof buscarMoradorParaEdicao>>>;

function voltar() {
  router.dismissTo(listaMoradores);
}

export default function NovoMorador() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const usuario = useSessao();
  if (!usuario) return <Redirect href="/pages/auth/login" />;
  if (!usuario.isSindico) return <Redirect href={listaMoradores} />;

  return id === undefined
    ? <FormularioMorador key={usuario.id} />
    : <EdicaoMorador key={`${usuario.id}/${id}`} id={id} />;
}

function EdicaoMorador({ id }: { id: string }) {
  const { dados: morador, carregando, erro } = useConsultaLocal(
    () => buscarMoradorParaEdicao(id), TABELAS_MORADORES, null, [id],
  );
  if (morador) return <FormularioMorador morador={morador} />;

  return (
    <TelaMorador titulo="Editar morador">
      <Text style={styles.subtitle}>
        {carregando ? "Carregando morador..." : erro ?? "Morador não encontrado."}
      </Text>
    </TelaMorador>
  );
}

function FormularioMorador({ morador }: { morador?: MoradorEdicao }) {
  const [nome, setNome] = useState(morador?.nome ?? "");
  const [email, setEmail] = useState(morador?.email ?? "");
  const [telefone, setTelefone] = useState(morador?.telefone ?? "");
  const [idBloco, setIdBloco] = useState<string | null>(morador?.idBloco ?? null);
  const [idApartamento, setIdApartamento] = useState<string | null>(morador?.idApartamento ?? null);
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
      const dados = { nome, email, telefone, idBloco, idApartamento };
      if (morador) {
        editarMorador(morador.id, dados);
        void sincronizarAgora();
        voltar();
        return;
      }
      const resultado = await cadastrarMorador(dados, pedido.signal);
      if (pedido.signal.aborted) return;
      setAcesso(resultado);
      void sincronizarAgora();
    } catch (falha) {
      if (!pedido.signal.aborted) {
        setErro(falha instanceof Error ? falha.message : "Não foi possível salvar o morador.");
      }
    } finally {
      pendente.current = null;
      if (!pedido.signal.aborted) setSalvando(false);
    }
  }

  const falha = erro ?? erroBlocos ?? erroApartamentos;

  const titulo = morador ? "Editar morador" : acesso ? "Morador cadastrado" : "Novo morador";
  const rotuloSalvar = morador ? "Salvar alterações" : "Cadastrar morador";

  return (
    <TelaMorador titulo={titulo}>
      {acesso ? (
        <>
          <Text style={styles.subtitle}>
            O morador entra com o e-mail e o código abaixo. {acesso.codigoGuardado
              ? "O código ficará disponível na lista de moradores após a sincronização."
              : "Guarde o código antes de sair desta tela."}
          </Text>
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
              placeholder="Informe o nome do morador"
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
              obrigatorio={!morador}
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
                if (id === idBloco) return;
                setIdBloco(id);
                setIdApartamento(null);
                setErro(null);
              }}
              obrigatorio={!morador}
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
              obrigatorio={!morador || !!idBloco}
              desabilitado={salvando || carregandoApartamentos || !idBloco}
              vazio="Nenhum apartamento ativo neste bloco."
            />
            {falha ? <Text style={styles.error} accessibilityLiveRegion="polite">{falha}</Text> : null}
            <PrimaryButton
              title={salvando ? "Salvando..." : rotuloSalvar}
              onPress={salvar}
              disabled={salvando || carregandoBlocos || carregandoApartamentos}
            />
          </View>
        </>
      )}
    </TelaMorador>
  );
}

function TelaMorador({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior="padding" style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SindicoHeader titulo={titulo} onVoltar={voltar} />
          {children}
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

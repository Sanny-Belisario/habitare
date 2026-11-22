import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { useConsultaLocal } from '@/hooks/use-consulta-local';
import { useSessao } from '@/hooks/use-sessao';
import { sincronizarAgora } from '@/hooks/use-sincronizacao';
import { excluirApartamento, listarApartamentos, TABELAS_APARTAMENTOS, tituloApartamento } from '@/services/apartamento';
import { excluirBloco, listarBlocos } from '@/services/bloco';

import { colors } from '../theme';
import type { Morador, TabKey } from '../types';
import ConfigHeader from '../components/ConfigHeader';
import ConfigTabs from '../components/ConfigTabs';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import CardActions from '../components/CardActions';
import BottomNav from '../components/BottomNav';

const MORADORES_INICIAIS: Morador[] = [
  { id: 'm1', nome: 'João Luís', bloco: 'Bloco A', apartamento: '304', codigo: '482913', ativo: true },
  { id: 'm2', nome: 'Luísa Moraes', bloco: 'Bloco C', apartamento: '201', codigo: '731045', ativo: false },
];

export default function ConfiguracoesScreen() {
  const { aba } = useLocalSearchParams<{ aba?: TabKey }>();
  const tab = aba === 'blocos' || aba === 'moradores' ? aba : 'apartamentos';
  const usuario = useSessao();
  const { dados: blocos, carregando: carregandoBlocos, erro: erroBlocos } = useConsultaLocal(
    listarBlocos, ['bloco'], [], [usuario?.idCondominio],
  );
  const { dados: apartamentos, carregando: carregandoApartamentos, erro: erroApartamentos } = useConsultaLocal(
    listarApartamentos, TABELAS_APARTAMENTOS, [], [usuario?.idCondominio],
  );
  const [moradores, setMoradores] = useState<Morador[]>(MORADORES_INICIAIS);
  const [codigosVisiveis, setCodigosVisiveis] = useState<Record<string, boolean>>({});

  const confirmarExclusao = (titulo: string, onConfirm: () => void) => {
    Alert.alert('Excluir', `Deseja excluir ${titulo}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: onConfirm },
    ]);
  };

  const editar = (titulo: string) =>
    Alert.alert('Editar', `Aqui abrirá a edição de ${titulo}.`);

  const alternarCodigo = (id: string) =>
    setCodigosVisiveis((prev) => ({ ...prev, [id]: !prev[id] }));

  function executarExclusao(excluir: () => void) {
    try {
      excluir();
      void sincronizarAgora();
    } catch (falha) {
      Alert.alert(
        'Não foi possível excluir',
        falha instanceof Error ? falha.message : 'Tente novamente.',
      );
    }
  }

  const renderBlocos = () => (
    <>
      {usuario?.isSindico ? (
        <PrimaryButton
          title="Adicionar novo bloco"
          onPress={() => router.push('/pages/novo-bloco')}
        />
      ) : null}
      {blocos.map((b) => (
        <View key={b.id} style={styles.card}>
          <Text style={styles.cardTitle}>{b.nome}</Text>
          {usuario?.isSindico ? (
            <CardActions
              editLabel={`Editar ${b.nome}`}
              deleteLabel={`Excluir ${b.nome}`}
              onEdit={() => router.push({ pathname: '/pages/novo-bloco', params: { id: b.id } })}
              onDelete={() =>
                confirmarExclusao(`o bloco “${b.nome}”`, () => executarExclusao(() => excluirBloco(b.id)))
              }
            />
          ) : null}
        </View>
      ))}
      {blocos.length === 0 ? (
        <Text style={styles.empty}>
          {carregandoBlocos ? 'Carregando blocos...' : erroBlocos ?? 'Nenhum bloco cadastrado.'}
        </Text>
      ) : null}
    </>
  );

  const renderApartamentos = () => (
    <>
      {usuario?.isSindico ? (
        <PrimaryButton
          title="Adicionar novo apartamento"
          onPress={() => router.push('/pages/novo-apartamento')}
        />
      ) : null}
      {apartamentos.map((a) => {
        const titulo = tituloApartamento(a.numero);
        return (
          <View key={a.id} style={styles.card}>
            <StatusBadge
              label={a.ocupado ? 'Ocupado' : 'Livre'}
              variant={a.ocupado ? 'danger' : 'success'}
            />
            <Text style={[styles.cardTitle, styles.apartmentTitle]}>{titulo}</Text>
            <Text style={styles.cardSub}>{a.bloco}</Text>
            {usuario?.isSindico ? (
              <CardActions
                editLabel={`Editar ${titulo}, ${a.bloco}`}
                deleteLabel={`Excluir ${titulo}, ${a.bloco}`}
                onEdit={() => router.push({ pathname: '/pages/novo-apartamento', params: { id: a.id } })}
                onDelete={() => confirmarExclusao(
                  `“${titulo}” do bloco “${a.bloco}”`,
                  () => executarExclusao(() => excluirApartamento(a.id)),
                )}
              />
            ) : null}
          </View>
        );
      })}
      {apartamentos.length === 0 ? (
        <Text style={styles.empty}>
          {carregandoApartamentos ? 'Carregando apartamentos...' : erroApartamentos ?? 'Nenhum apartamento cadastrado.'}
        </Text>
      ) : null}
    </>
  );

  const renderMoradores = () => (
    <>
      <PrimaryButton
        title="Adicionar novo morador"
        onPress={() => router.navigate('/pages/morador/novo-morador')}
      />
      {moradores.map((m) => {
        const visivel = !!codigosVisiveis[m.id];
        return (
          <View key={m.id} style={styles.card}>
            <StatusBadge
              label={m.ativo ? 'Ativo' : 'Inativo'}
              variant={m.ativo ? 'success' : 'danger'}
            />
            <Text style={styles.cardTitle}>{m.nome}</Text>
            <Text style={styles.cardSub}>
              {m.bloco} • Apartamento {m.apartamento}
            </Text>
            <View style={styles.codigoRow}>
              <Text style={styles.cardSub}>
                Código de Acesso: {visivel ? m.codigo : '******'}
              </Text>
              <TouchableOpacity onPress={() => alternarCodigo(m.id)} hitSlop={8}>
                <Ionicons
                  name={visivel ? 'eye-outline' : 'eye-off-outline'}
                  size={16}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
            <CardActions
              onEdit={() => editar(m.nome)}
              onDelete={() =>
                confirmarExclusao(m.nome, () =>
                  setMoradores((lista) => lista.filter((x) => x.id !== m.id))
                )
              }
            />
          </View>
        );
      })}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ConfigHeader />
        <ConfigTabs active={tab} onChange={(aba) => router.setParams({ aba })} />
        {tab === 'blocos' && renderBlocos()}
        {tab === 'apartamentos' && renderApartamentos()}
        {tab === 'moradores' && renderMoradores()}
      </ScrollView>
      <BottomNav active="configuracoes" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#0B1F3A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  apartmentTitle: { paddingRight: 76 },
  cardSub: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 16 },
  codigoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

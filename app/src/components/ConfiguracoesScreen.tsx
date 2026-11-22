import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { useConsultaLocal } from '@/hooks/use-consulta-local';
import { useSessao } from '@/hooks/use-sessao';
import { sincronizarAgora } from '@/hooks/use-sincronizacao';
import { excluirApartamento, listarApartamentos, TABELAS_APARTAMENTOS, tituloApartamento } from '@/services/apartamento';
import { excluirBloco, listarBlocos } from '@/services/bloco';
import { excluirMorador, listarMoradores, TABELAS_MORADORES } from '@/services/morador';

import { colors } from '../theme';
import type { TabKey } from '../types';
import ConfigHeader from '../components/ConfigHeader';
import ConfigTabs from '../components/ConfigTabs';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import CardActions from '../components/CardActions';
import BottomNav from '../components/BottomNav';
import { MoradorCard } from '../components/MoradorCard';

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
  const { dados: moradores, carregando: carregandoMoradores, erro: erroMoradores } = useConsultaLocal(
    listarMoradores, TABELAS_MORADORES, [], [usuario?.id],
  );

  const confirmarExclusao = (titulo: string, onConfirm: () => void) => {
    Alert.alert('Excluir', `Deseja excluir ${titulo}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: onConfirm },
    ]);
  };

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
            <Text style={[styles.cardTitle, styles.titleWithBadge]}>{titulo}</Text>
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

  const renderMoradores = () => usuario?.isSindico ? (
    <>
      <PrimaryButton
        title="Adicionar novo morador"
        onPress={() => router.push('/pages/morador/novo-morador')}
      />
      {moradores.map((morador) => (
        <MoradorCard
          key={morador.id}
          morador={morador}
          onEdit={() => router.push({ pathname: '/pages/morador/novo-morador', params: { id: morador.id } })}
          onDelete={() => confirmarExclusao(
            `o morador “${morador.nome}”`,
            () => executarExclusao(() => excluirMorador(morador.id)),
          )}
        />
      ))}
      {moradores.length === 0 ? (
        <Text style={styles.empty}>
          {carregandoMoradores ? 'Carregando moradores...' : erroMoradores ?? 'Nenhum morador cadastrado.'}
        </Text>
      ) : null}
    </>
  ) : (
    <Text style={styles.empty}>A lista de moradores é gerenciada pelo síndico.</Text>
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
  titleWithBadge: { paddingRight: 76 },
  cardSub: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 16 },
});

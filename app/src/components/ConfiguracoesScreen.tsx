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
import { router } from 'expo-router';

import { colors } from '../theme';
import type { Apartamento, Bloco, Morador, TabKey } from '../types';
import ConfigHeader from '../components/ConfigHeader';
import ConfigTabs from '../components/ConfigTabs';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import CardActions from '../components/CardActions';
import BottomNav from '../components/BottomNav';

const BLOCOS_INICIAIS: Bloco[] = [
  { id: 'b1', nome: 'Bloco A' },
  { id: 'b2', nome: 'Bloco B' },
  { id: 'b3', nome: 'Bloco C' },
];

const APARTAMENTOS_INICIAIS: Apartamento[] = [
  { id: 'a1', numero: '201', bloco: 'Bloco C', ocupado: false },
  { id: 'a2', numero: '304', bloco: 'Bloco A', ocupado: true },
  { id: 'a3', numero: '202', bloco: 'Bloco C', ocupado: false },
];

const MORADORES_INICIAIS: Morador[] = [
  { id: 'm1', nome: 'João Luís', bloco: 'Bloco A', apartamento: '304', codigo: '482913', ativo: true },
  { id: 'm2', nome: 'Luísa Moraes', bloco: 'Bloco C', apartamento: '201', codigo: '731045', ativo: false },
];

export default function ConfiguracoesScreen() {
  const [tab, setTab] = useState<TabKey>('apartamentos');
  const [blocos, setBlocos] = useState<Bloco[]>(BLOCOS_INICIAIS);
  const [apartamentos, setApartamentos] = useState<Apartamento[]>(APARTAMENTOS_INICIAIS);
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

  const adicionar = (item: string) =>
    Alert.alert('Adicionar', `Aqui abrirá o cadastro de ${item}.`);

  const alternarCodigo = (id: string) =>
    setCodigosVisiveis((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderBlocos = () => (
    <>
      <PrimaryButton title="Adicionar novo bloco" onPress={() => adicionar('bloco')} />
      {blocos.map((b) => (
        <View key={b.id} style={styles.card}>
          <Text style={styles.cardTitle}>{b.nome}</Text>
          <CardActions
            onEdit={() => editar(b.nome)}
            onDelete={() =>
              confirmarExclusao(b.nome, () =>
                setBlocos((lista) => lista.filter((x) => x.id !== b.id))
              )
            }
          />
        </View>
      ))}
    </>
  );

  const renderApartamentos = () => (
    <>
      <PrimaryButton
        title="Adicionar novo apartamento"
        onPress={() => adicionar('apartamento')}
      />
      {apartamentos.map((a) => (
        <View key={a.id} style={styles.card}>
          <StatusBadge
            label={a.ocupado ? 'Ocupado' : 'Livre'}
            variant={a.ocupado ? 'danger' : 'success'}
          />
          <Text style={styles.cardTitle}>Apartamento {a.numero}</Text>
          <Text style={styles.cardSub}>{a.bloco}</Text>
          <CardActions
            onEdit={() => editar(`Apartamento ${a.numero}`)}
            onDelete={() =>
              confirmarExclusao(`o Apartamento ${a.numero}`, () =>
                setApartamentos((lista) => lista.filter((x) => x.id !== a.id))
              )
            }
          />
        </View>
      ))}
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
        <ConfigTabs active={tab} onChange={setTab} />
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
  cardSub: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  codigoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
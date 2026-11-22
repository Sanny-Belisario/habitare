import React from 'react';
import { MenuConta } from "@/components/MenuConta";
import { View, Text, StyleSheet } from 'react-native';
import { useCabecalho } from '@/hooks/use-cabecalho';
import { colors } from '../theme';

export default function ConfigHeader() {
  const { marca } = useCabecalho();

  return (
    <View style={styles.container}>
      <Text style={styles.breadcrumb}>{marca}</Text>
      <View style={styles.row}>
        <View style={styles.heading}>
          <Text style={styles.subtitle}>Gestão do condomínio</Text>
          <Text style={styles.title} accessibilityRole="header">Configurações</Text>
        </View>
        <MenuConta />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  breadcrumb: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heading: { flex: 1 },
  subtitle: { fontSize: 15, color: colors.muted, marginBottom: 2 },
  title: { fontSize: 32, fontWeight: '800', color: colors.dark },
});

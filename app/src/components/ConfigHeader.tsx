import React from 'react';
import { MenuConta } from "@/components/MenuConta";
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function ConfigHeader() {
  return (
    <View style={styles.container}>
      <Text style={styles.breadcrumb}>HABITARE  /  CONDOMÍNIO AURORA</Text>
      <View style={styles.row}>
        <View>
          <Text style={styles.subtitle}>Gestão do condomínio</Text>
          <Text style={styles.title}>Configurações</Text>
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
  },
  subtitle: { fontSize: 15, color: colors.muted, marginBottom: 2 },
  title: { fontSize: 32, fontWeight: '800', color: colors.dark },
});
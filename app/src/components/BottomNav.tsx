import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { sessao } from '../services/sessao';
import { colors } from '../theme';
import type { NavKey } from '../types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface BottomNavProps {
  active?: NavKey;
  onChange?: (key: NavKey) => void;
}

const ITEMS: { key: NavKey; label: string; icon: IconName }[] = [
  { key: 'inicio', label: 'Início', icon: 'home-outline' },
  { key: 'comunicados', label: 'Comunicados', icon: 'reorder-three-outline' },
  { key: 'ocorrencias', label: 'Ocorrências', icon: 'square-outline' },
  { key: 'configuracoes', label: 'Configurações', icon: 'settings-outline' },
];

export function navegarPelaBarra(key: NavKey) {
  const isSindico = sessao.obter()?.isSindico ?? false;

  if (key === 'inicio') {
    router.replace(
      isSindico ? '/pages/home/inicio-sindico' : '/pages/home/inicio-morador',
    );
  } else if (key === 'configuracoes') {
    router.replace({ pathname: '/pages/configuracoes', params: { aba: 'blocos' } });
  } else if (key === 'comunicados') {
    router.replace(
      isSindico ? '/pages/home/comunicados-sindico' : '/pages/home/comunicados-morador',
    );
  } else {
    router.replace(
      isSindico ? '/pages/home/ocorrencias-sindico' : '/pages/home/ocorrencias-morador',
    );
  }
}

export default function BottomNav({
  active = 'configuracoes',
  onChange,
}: BottomNavProps) {
  return (
    <View style={styles.container}>
      {ITEMS.map((item) => {
        const isActive = item.key === active;
        const color = isActive ? colors.primary : colors.muted;
        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.item, isActive && styles.itemActive]}
            onPress={() => {
              if (item.key === active) return;
              (onChange ?? navegarPelaBarra)(item.key);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name={item.icon} size={22} color={color} />
            <Text style={[styles.label, { color }, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E6EBF2',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    minWidth: 76,
  },
  itemActive: { backgroundColor: colors.navActive },
  label: { fontSize: 11, marginTop: 4 },
  labelActive: { fontWeight: '700' },
});

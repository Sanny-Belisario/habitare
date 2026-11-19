import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';
import type { TabKey } from '../types';

interface ConfigTabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'blocos', label: 'Blocos' },
  { key: 'apartamentos', label: 'Apartamentos' },
  { key: 'moradores', label: 'Moradores' },
];

export default function ConfigTabs({ active, onChange }: ConfigTabsProps) {
  return (
    <View style={styles.row}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, isActive && styles.tabActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabActive: { backgroundColor: colors.dark },
  label: { fontSize: 13, fontWeight: '700', color: colors.muted },
  labelActive: { color: '#FFFFFF' },
});
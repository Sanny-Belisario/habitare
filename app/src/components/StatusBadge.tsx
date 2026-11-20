import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

type Variant = 'success' | 'danger';

interface StatusBadgeProps {
  label: string;
  variant?: Variant;
}

const VARIANTS: Record<Variant, { bg: string; text: string }> = {
  success: colors.free,
  danger: colors.danger,
};

export default function StatusBadge({ label, variant = 'success' }: StatusBadgeProps) {
  const v = VARIANTS[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  text: { fontSize: 11, fontWeight: '700' },
});
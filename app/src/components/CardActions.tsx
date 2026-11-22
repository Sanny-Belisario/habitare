import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface CardActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
}

export default function CardActions({
  onEdit,
  onDelete,
  editLabel = 'Editar',
  deleteLabel = 'Excluir',
}: CardActionsProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={onEdit}
        disabled={!onEdit}
        style={!onEdit && styles.disabled}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityState={{ disabled: !onEdit }}
        accessibilityLabel={editLabel}
      >
        <Ionicons name="pencil-outline" size={17} color={colors.muted} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onDelete}
        disabled={!onDelete}
        style={!onDelete && styles.disabled}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityState={{ disabled: !onDelete }}
        accessibilityLabel={deleteLabel}
      >
        <Ionicons name="trash-outline" size={17} color={colors.trash} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 14,
  },
  disabled: { opacity: 0.55 },
});

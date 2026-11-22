import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme";

const CORES_STATUS: Record<string, { bg: string; text: string }> = {
  aberta: { bg: "#FDE9D7", text: "#A7540D" },
  "em andamento": { bg: colors.navActive, text: colors.primary },
  resolvida: colors.free,
};

export function OcorrenciaStatusBadge({ status, cor }: { status: string; cor: string | null }) {
  const palette = CORES_STATUS[status.trim().toLowerCase()] ?? {
    bg: colors.navActive,
    text: cor ?? colors.muted,
  };
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  text: { fontSize: 12, fontWeight: "700" },
});

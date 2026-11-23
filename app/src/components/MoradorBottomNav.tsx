import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "@/theme";

export type MoradorTab = "inicio" | "comunicados" | "ocorrencias";

const items = [
  {
    key: "inicio",
    label: "Início",
    icon: "home-outline",
    href: "/pages/home/inicio-morador",
  },
  {
    key: "comunicados",
    label: "Comunicados",
    icon: "reorder-three-outline",
    href: "/pages/home/comunicados-morador",
  },
  {
    key: "ocorrencias",
    label: "Ocorrências",
    icon: "square-outline",
    href: "/pages/home/ocorrencias-morador",
  },
] as const;

interface MoradorBottomNavProps {
  active: MoradorTab;
}

export function MoradorBottomNav({ active }: MoradorBottomNavProps) {
  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const selected = item.key === active;

        return (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.navigationItem,
              selected && styles.navigationItemSelected,
            ]}
            onPress={() => router.navigate(item.href)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={selected ? colors.primary : colors.muted}
            />
            <Text
              style={[
                styles.navigationLabel,
                selected && styles.navigationLabelSelected,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E6EBF2",
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  navigationItem: {
    minWidth: 76,
    flexShrink: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  navigationItemSelected: {
    backgroundColor: colors.navActive,
  },
  navigationLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  navigationLabelSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
});

import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const creators = [
  "Elinéia Rita Bassani",
  "Lucas Ferreira Gritti Campanharo",
  "Luís Miguel Jacobus",
  "Sanny Belisário",
];

export default function Criadores() {
  const logo = require("../../../../assets/images/logo-habitare.png");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Image source={logo} style={styles.logo} resizeMode="contain" />

        <View style={styles.panel}>
          {creators.map((creator) => (
            <TouchableOpacity
              key={creator}
              style={styles.creatorButton}
              onPress={() => router.replace("/pages/home/inicio-morador")}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text
                style={styles.buttonText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {creator}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.creatorButton, styles.backButton]}
            onPress={() => router.back()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a tela anterior"
          >
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1B3048",
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  logo: {
    width: 150,
    height: 130,
    marginBottom: 18,
  },
  panel: {
    width: "100%",
    maxWidth: 360,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#A9ADB2",
    gap: 9,
  },
  creatorButton: {
    minHeight: 46,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#04192B",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  backButton: {
    marginTop: 11,
    backgroundColor: "#35505F",
  },
});

import { Footer } from "@/components/footer";
import { View, Text, StyleSheet } from "react-native";

export default function VisaoGeral() {
  return (
    <View style={style.container}>
      <Text>Olá Mundo</Text>
      <Text>Olá Mundo</Text>
      <Text>Olá Mundo</Text>
      <Footer />
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    display: "flex",
    justifyContent: "space-around",
  },
});

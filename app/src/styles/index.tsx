import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#172D40",
    alignItems: "center",
    justifyContent: "center",
  },
  loginScreen: {
    flex: 1,
    backgroundColor: "#172D40",
  },
  // Conteúdo do ScrollView: flexGrow centraliza quando sobra espaço e deixa
  // rolar quando o teclado ocupa a tela.
  loginContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 25,
    paddingVertical: 32,
  },

  // Largura e altura fixas: num require() local, o Image do Android usa o
  // tamanho real do arquivo (1254 px) na dimensão que faltar, e ignora o
  // aspectRatio. Altura em % também não funciona dentro do ScrollView.
  logo: {
    width: 200,
    height: 170,
    objectFit: "cover",
  },
});

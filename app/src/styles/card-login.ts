import { StyleSheet } from "react-native";

export const cardLogin = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    width: "75%",
    maxWidth: 420,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 24,
    display: "flex",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    opacity: 0.8,
  },
  input: {
    backgroundColor: "#fff",
    width: "90%",
    height: 46,
    borderRadius: 10,
    fontSize: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#D5DDE6",
    color: "#172D40",
  },
  inputFocado: {
    borderColor: "#243B7A",
    backgroundColor: "#F5F8FF",
  },
  campoSenha: {
    width: "90%",
  },
  inputSenha: {
    width: "100%",
    paddingEnd: 44,
  },
  botaoVisibilidadeSenha: {
    position: "absolute",
    end: 0,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  labelFocado: {
    color: "#243B7A",
  },
  contentInput: {
    display: "flex",
    gap: 5,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    width: "100%",
  },
  textInput: {
    textAlign: "start",
    fontSize: 12,
    fontWeight: "bold",
    width: "90%",
    color: "#172D40",
  },
  buttonLogin: {
    display: "flex",
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
    width: "90%",
    height: 46,
    borderRadius: 10,
    textAlign: "center",
    backgroundColor: "#001B2E",
  },

  text: {
    fontSize: 12,
    color: "#2F4B5E",
  },

  textButton: {
    color: "#fff",
    fontWeight: "bold",
  },
});

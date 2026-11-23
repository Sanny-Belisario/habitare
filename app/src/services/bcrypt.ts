import bcrypt from "bcryptjs";
import { getRandomBytes } from "expo-crypto";

// O Hermes não tem crypto.getRandomValues. Sem esta fonte, o bcryptjs não gera o salt
// e o hash falha com "Invalid string / salt: Not a string".
bcrypt.setRandomFallback((tamanho) => Array.from(getRandomBytes(tamanho)));

export default bcrypt;

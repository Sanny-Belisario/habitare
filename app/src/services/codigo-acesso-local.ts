import { CryptoDigestAlgorithm, digestStringAsync } from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const opcoes = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

// Cada versão tem sua própria chave para uma troca pendente não sobrescrever a anterior.
async function chave(idMorador: string, hash: string) {
  const versao = await digestStringAsync(CryptoDigestAlgorithm.SHA256, hash);
  return `habitare.codigo.${idMorador}.${versao}`;
}

export async function guardarCodigoLocal(idMorador: string, hash: string, codigo: string) {
  await SecureStore.setItemAsync(await chave(idMorador, hash), codigo, opcoes);
}

export async function lerCodigoLocal(idMorador: string, hash: string) {
  return SecureStore.getItemAsync(await chave(idMorador, hash), opcoes);
}

export async function removerCodigoLocal(idMorador: string, hash: string) {
  await SecureStore.deleteItemAsync(await chave(idMorador, hash), opcoes);
}

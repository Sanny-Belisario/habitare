import React from 'react';
import { Stack } from 'expo-router';
import ConfiguracoesScreen from '../../components/ConfiguracoesScreen';

export default function Configuracoes() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ConfiguracoesScreen />
    </>
  );
}
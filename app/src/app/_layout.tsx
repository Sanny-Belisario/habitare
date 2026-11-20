import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";

import migrations from "../../drizzle/sqlite/migrations";
import { dbSqlite, expoSqlite } from "../db/sqlite";
import { useSincronizacao } from "../hooks/use-sincronizacao";

export default function RootLayout() {
  // Aplica as migrations do SQLite no aparelho.
  const { success, error } = useMigrations(dbSqlite, migrations as never);
  // Expõe o banco local ao Drizzle Studio (shift + m no `expo start`).
  useDrizzleStudio(expoSqlite);
  // Sincroniza SQLite e Postgres a cada 30 segundos, depois das migrations.
  useSincronizacao(success);

  if (error) {
    console.error("Erro ao aplicar as migrations do SQLite:", error);
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="pages/auth/login" options={{ title: "Login" }} />
      <Stack.Screen
        name="pages/home/visao-geral"
        options={{ title: "Visão Geral" }}
      />
    </Stack>
  );
}

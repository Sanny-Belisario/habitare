import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Platform } from "react-native";

import migrations from "../../drizzle/sqlite/migrations";
import { dbSqlite, expoSqlite } from "../db/sqlite";
import { useSincronizacao } from "../hooks/use-sincronizacao";

type NativeDatabaseSetupProps = {
  dbSqlite: NonNullable<typeof dbSqlite>;
  expoSqlite: NonNullable<typeof expoSqlite>;
};

function getNativeDatabase(): NativeDatabaseSetupProps {
  if (!dbSqlite || !expoSqlite) {
    throw new Error("SQLite não está disponível nesta plataforma.");
  }

  return { dbSqlite, expoSqlite };
}

function NativeDatabaseSetup({
  dbSqlite,
  expoSqlite,
}: NativeDatabaseSetupProps) {
  // Aplica as migrations do SQLite no aparelho.
  const { success, error } = useMigrations(dbSqlite, migrations as never);
  // Expõe o banco local ao Drizzle Studio (shift + m no `expo start`).
  useDrizzleStudio(expoSqlite);
  // Sincroniza SQLite e Postgres a cada 30 segundos, depois das migrations.
  useSincronizacao(success);

  if (error) {
    console.error("Erro ao aplicar as migrations do SQLite:", error);
  }

  return null;
}

export default function RootLayout() {
  const nativeDatabase =
    Platform.OS === "web" ? null : getNativeDatabase();

  return (
    <>
      {nativeDatabase ? (
        <NativeDatabaseSetup
          dbSqlite={nativeDatabase.dbSqlite}
          expoSqlite={nativeDatabase.expoSqlite}
        />
      ) : null}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="pages/auth/login" options={{ title: "Login" }} />
        <Stack.Screen
          name="pages/auth/criadores"
          options={{ title: "Criadores", animation: "fade" }}
        />
        <Stack.Screen
          name="pages/home/visao-geral"
          options={{ title: "Visão Geral" }}
        />
        <Stack.Screen
          name="pages/home/inicio-morador"
          options={{ title: "Início Morador", animation: "fade" }}
        />
        <Stack.Screen
          name="pages/home/comunicados-morador"
          options={{ title: "Comunicados", animation: "fade" }}
        />
        <Stack.Screen
          name="pages/home/comunicado/[id]"
          options={{
            title: "Detalhe do comunicado",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="pages/home/ocorrencias-morador"
          options={{ title: "Ocorrências", animation: "fade" }}
        />
      </Stack>
    </>
  );
}

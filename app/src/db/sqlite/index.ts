import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { Platform } from "react-native";

// Conexão crua do expo-sqlite, usada pelo plugin do Drizzle Studio.
export const expoSqlite =
  Platform.OS === "web"
    ? null
    : // enableChangeListener: o useLiveQuery do Drizzle atualiza as telas
      // quando a sincronização grava no banco.
      SQLite.openDatabaseSync("db.db", { enableChangeListener: true });

export const dbSqlite = expoSqlite ? drizzle(expoSqlite) : null;

import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { Platform } from "react-native";

// Conexão crua do expo-sqlite, usada pelo plugin do Drizzle Studio.
export const expoSqlite =
  Platform.OS === "web" ? null : SQLite.openDatabaseSync("db.db");

export const dbSqlite = expoSqlite ? drizzle(expoSqlite) : null;

import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";

// Conexão crua do expo-sqlite, usada pelo plugin do Drizzle Studio.
export const expoSqlite = SQLite.openDatabaseSync("db.db");

export const dbSqlite = drizzle(expoSqlite);

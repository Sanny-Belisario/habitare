import { condominio, usuario } from "@/db/sqlite/schema";
import { dbSqlite } from "@/db/sqlite";
import { randomUUID } from "expo-crypto";
//import { supabase } from "@/db/postgres";
import bcrypt from "bcryptjs";

export async function createAdmin() {
  try {
    const idCondominio = randomUUID();

    await dbSqlite.insert(condominio).values({
      id: idCondominio,
      nome: "Condomínio Admin",
    });

    const hash = await bcrypt.hash("admin1234", 10);

    await dbSqlite
      .insert(usuario)
      .values({
        id: randomUUID(),
        idCondominio,
        codigoAcesso: randomUUID(),
        isSindico: true,
        email: "admin@gmail.com",
        nome: "admin",
        senha: hash,
        status: true,
      })
      .returning();

    console.log("Usuário admin criado nos bases corretamente");
  } catch (error) {
    console.error("Erro ao cadastrar conta admin", error);
  }
}

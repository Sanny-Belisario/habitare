import { dbSqlite } from "@/db/sqlite";
import { usuario } from "@/db/sqlite/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

interface Login {
  email: string;
  senha: string;
}

export class Usuario {
  async login(data: Login): Promise<{ message: string; sucesso: boolean }> {
    if (!data) {
      return {
        message: "Os dados devem ser preenchidos corretamente",
        sucesso: false,
      };
    }
    const [user] = await dbSqlite
      .select()
      .from(usuario)
      .where(eq(usuario.email, data.email));

    if (!user) {
      return {
        message: "E-mail não encontrado",
        sucesso: false,
      };
    }

    const verify = await bcrypt.compare(data.senha, user.senha);

    if (verify) {
      return {
        message: "Login autorizado",
        sucesso: true,
      };
    }

    return {
      message: "Senha incorreta",
      sucesso: false,
    };
  }
}

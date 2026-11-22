import { dbSqlite } from "@/db/sqlite";
import { usuario } from "@/db/sqlite/schema";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { sessao } from "./sessao";

interface Login {
  email: string;
  senha: string;
}

export function emailNormalizadoIgual(email: string) {
  return sql`lower(trim(${usuario.email})) = ${email.trim().toLowerCase()}`;
}

export class Usuario {
  async login(
    data: Login,
  ): Promise<{ message: string; sucesso: boolean; isSindico?: boolean }> {
    if (!data) {
      return {
        message: "Os dados devem ser preenchidos corretamente",
        sucesso: false,
      };
    }
    if (!dbSqlite) {
      return {
        message: "O login não está disponível na prévia web",
        sucesso: false,
      };
    }

    const email = data.email.trim();
    const [contaExata] = await dbSqlite
      .select()
      .from(usuario)
      .where(eq(usuario.email, email));
    const user = contaExata ?? dbSqlite.select().from(usuario)
      .where(emailNormalizadoIgual(email)).get();

    if (!user) {
      return {
        message: "E-mail não encontrado",
        sucesso: false,
      };
    }

    // O campo aceita a senha ou o código de acesso (os dois guardados com bcrypt).
    const verify =
      (await bcrypt.compare(data.senha, user.senha)) ||
      (!!user.codigoAcesso &&
        (await bcrypt.compare(data.senha, user.codigoAcesso)));

    if (verify) {
      if (!user.status || user.excluido) {
        return {
          message: "Usuário inativo. Procure o síndico do condomínio.",
          sucesso: false,
        };
      }

      sessao.definir({
        id: user.id,
        nome: user.nome,
        idCondominio: user.idCondominio,
        isSindico: user.isSindico,
      });

      return {
        message: "Login autorizado",
        sucesso: true,
        isSindico: user.isSindico,
      };
    }

    return {
      message: "Senha ou código de acesso incorreto",
      sucesso: false,
    };
  }
}

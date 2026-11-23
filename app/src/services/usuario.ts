import { dbSqlite } from "@/db/sqlite";
import { usuario } from "@/db/sqlite/schema";
import bcrypt from "@/services/bcrypt";
import { and, eq, sql } from "drizzle-orm";
import { iniciarAcessoAdministrativo } from "@/services/codigo-acesso-remoto";
import { sessao } from "./sessao";

interface Login {
  email: string;
  senha: string;
}

export function emailNormalizadoIgual(email: string) {
  return sql`lower(trim(${usuario.email})) = ${email.trim().toLowerCase()}`;
}

function buscarPorEmail(db: NonNullable<typeof dbSqlite>, email: string) {
  return db.select().from(usuario).where(eq(usuario.email, email.trim())).get()
    ?? db.select().from(usuario).where(emailNormalizadoIgual(email)).get();
}

export class Usuario {
  consultarRecuperacao(email: string) {
    if (!dbSqlite) throw new Error("A recuperação de acesso não está disponível na prévia web.");

    const conta = buscarPorEmail(dbSqlite, email);
    if (!conta || conta.excluido) throw new Error("E-mail não encontrado.");
    if (!conta.status && conta.isSindico) throw new Error("Usuário inativo.");
    return conta.isSindico ? "sindico" : "morador";
  }

  async redefinirSenha(email: string, senha: string) {
    if (!dbSqlite) throw new Error("A recuperação de acesso não está disponível na prévia web.");
    if (senha.length < 6) throw new Error("A senha deve ter, no mínimo, 6 caracteres.");

    const conta = buscarPorEmail(dbSqlite, email);
    if (!conta?.isSindico || !conta.status || conta.excluido) {
      throw new Error("O cadastro está indisponível para redefinição de senha.");
    }

    const hash = await bcrypt.hash(senha, 10);
    const atualizada = dbSqlite.update(usuario)
      .set({ senha: hash })
      .where(and(
        eq(usuario.id, conta.id),
        eq(usuario.email, conta.email),
        eq(usuario.isSindico, true),
        eq(usuario.status, true),
        eq(usuario.excluido, false),
        eq(usuario.senha, conta.senha),
      ))
      .returning({ id: usuario.id }).get();

    if (!atualizada) throw new Error("O cadastro foi atualizado. Tente novamente.");
  }

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

    const user = buscarPorEmail(dbSqlite, data.email);

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

      const conta = {
        id: user.id,
        nome: user.nome,
        idCondominio: user.idCondominio,
        isSindico: user.isSindico,
      };
      sessao.definir(conta);
      if (conta.isSindico) iniciarAcessoAdministrativo(conta, user.email, data.senha);

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

# Configuração dos bancos de dados

O aplicativo usa dois bancos:

- **SQLite**: armazenamento local, em um arquivo no aparelho, gerenciado pelo **Drizzle-ORM**. Os dados continuam lá depois de fechar o app.
- **Postgres**: armazenamento em nuvem, hospedado no **[Supabase](https://supabase.com)**, para compartilhar os dados entre dispositivos.

O mesmo dado é inserido nos dois bancos.

## Por que o app usa o `supabase-js` e não o Drizzle no Postgres

Os drivers do Postgres (`pg`, `postgres`) dependem de sockets TCP, que não existem no React Native. Por isso o app não abre conexão direta com o banco: as queries passam pela API HTTP do Supabase, com o cliente `@supabase/supabase-js`.

O Drizzle continua cuidando do Postgres só no computador: o `schema.ts` define as tabelas e o `drizzle-kit` gera e aplica as migrations, usando o driver `postgres` (dependência de desenvolvimento).

## Estrutura

| Arquivo | Função |
|---|---|
| `src/db/sqlite/index.ts` | Exporta `dbSqlite` |
| `src/db/sqlite/schema.ts` | Tabelas do SQLite |
| `src/db/postgres/index.ts` | Exporta o cliente `supabase` |
| `src/db/postgres/schema.ts` | Tabelas do Postgres |
| `drizzle.sqlite.config.ts` | Configuração do SQLite, com saída em `drizzle/sqlite` |
| `drizzle.postgres.config.ts` | Configuração do Postgres, com saída em `drizzle/postgres` |
| `.env.example` | Modelo das variáveis de ambiente |

## Variáveis de ambiente

| Variável | Usada por | Vai para o APK? |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Aplicativo | Sim |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Aplicativo | Sim |
| `DATABASE_URL` | `drizzle-kit`, para aplicar as migrations | Não |

A URL e a publishable key ficam em **Project Settings > API**. O `DATABASE_URL` fica em **Connect**: use a URL do **Session pooler** (porta 5432), que funciona em redes só com IPv4.

## Como colocar para funcionar

1. Crie o projeto no Supabase.
2. Copie `.env.example` para `.env.local`, que já está no `.gitignore`, e preencha as três variáveis.
3. Escreva as tabelas nos dois arquivos `schema.ts`. Eles precisam ser mantidos em paralelo, porque um usa `sqliteTable` e o outro `pgTable`.
4. Gere as migrations:

   ```bash
   npm run db:generate:sqlite
   npm run db:generate:postgres
   ```

5. Aplique as migrations no Postgres:

   ```bash
   npm run db:migrate:postgres
   ```

   Depois, no Supabase, ative o RLS em cada tabela e crie as policies que liberam o que o app pode ler e gravar. Sem policy, o `supabase-js` não enxerga nem insere nada.

6. As migrations do SQLite são aplicadas pelo próprio app, ao abrir, com `useMigrations` em `src/app/_layout.tsx`. Por isso não existe um `db:migrate:sqlite`: o banco SQLite é um arquivo dentro do aparelho, e o `drizzle-kit migrate` roda no computador, sem acesso a ele. As migrations vão junto no bundle (por isso o `babel.config.js` e o `metro.config.js` aceitam `.sql`).

   O `as never` em `useMigrations(dbSqlite, migrations as never)` contorna um erro de tipo do Drizzle `rc.5`, que exige um campo `journal` que o próprio `drizzle-kit` não gera. O código de execução ignora esse campo, então o erro é só de TypeScript.

## Consulta de códigos pelo síndico

Os códigos de acesso têm 8 dígitos numéricos e ficam criptografados no Supabase (schema `habitare_privado`, chave no Supabase Vault). O app os acessa pela função `habitare_codigo_morador`, que confere o **e-mail e a senha do síndico** (os mesmos do login do app, comparados com o `senha_hash` sincronizado). Qualquer síndico do condomínio vê o código de qualquer morador do condomínio, em qualquer aparelho, sem conta no Supabase Auth.

1. Aplique as migrações com `npm run db:migrate:postgres`.
2. Entre no app como síndico e abra **Configurações → Moradores**. O ícone de olho mostra o código.

- A migração `codigos_sindico` gera um código novo para cada morador que tinha só o hash (o bcrypt não pode ser revertido). Os códigos antigos desses moradores deixam de valer.
- Códigos de moradores novos são guardados no aparelho e enviados ao Supabase depois da sincronização. Sem conexão, o app mostra a cópia do aparelho.
- O síndico precisa estar sincronizado no Supabase, porque a validação usa o cadastro do servidor.
- Enquanto as policies `acessoAnonDev` estiverem ativas, qualquer pessoa com a publishable key lê o `senha_hash`. Revise as policies antes de produção.

## Exclusão de moradores

A sincronização não propaga `DELETE`, então o app exclui o morador logicamente (`excluido = true`, `status = false`) e cascateia: desativa os vínculos com apartamentos e as ocorrências do morador, marca os comunicados dele como `excluido` e apaga o código de acesso (hash local, cópia no aparelho e registro criptografado no servidor, por trigger).

As chaves estrangeiras para `usuario` (`morador_apartamento`, `ocorrencia`, `comunicado` e `habitare_privado.codigos_morador`) têm `ON DELETE CASCADE`. Um `DELETE` físico feito direto no banco também remove os registros dependentes.

## Vendo os dados com o Drizzle Studio

**Postgres:** com o `DATABASE_URL` preenchido no `.env.local`, rode:

```bash
npm run db:studio:postgres
```

E abra https://local.drizzle.studio no navegador.

**SQLite:** o `drizzle-kit studio` não acessa o banco do aparelho. Para ele, o app usa o plugin `expo-drizzle-studio-plugin`, ligado em `src/app/_layout.tsx` com `useDrizzleStudio(expoSqlite)`. Para abrir:

1. Rode `npx expo start` e abra o app no celular, emulador ou simulador (na web não funciona).
2. No terminal do `expo start`, aperte `shift + m` e escolha `expo-drizzle-studio-plugin`.
3. O Drizzle Studio abre no navegador, mostrando o banco do aparelho em tempo real.

O plugin depende do servidor de desenvolvimento do `expo start`, então só serve durante o desenvolvimento.

## Inserindo nos dois bancos

Os ids são UUIDs (`text` no SQLite, `uuid` no Postgres) e nenhum dos bancos gera o id sozinho. Gere no app com `Crypto.randomUUID()` do `expo-crypto` e use o mesmo `id` nos dois bancos. CNPJ, telefone e CEP são `text`, para não perder zeros à esquerda.

No `supabase-js`, as chaves do objeto são os **nomes das colunas no banco** (`id_condominio`, `nome_completo`), e não os nomes das propriedades do schema do Drizzle (`id`, `nome`).

```ts
import * as Crypto from "expo-crypto";

import { supabase } from "@/db/postgres";
import { dbSqlite } from "@/db/sqlite";
import { condominio } from "@/db/sqlite/schema";

const id = Crypto.randomUUID();

await dbSqlite.insert(condominio).values({ id, nome });

const { error } = await supabase
  .from("condominio")
  .insert({ id_condominio: id, nome });
```

O `supabase-js` não lança exceção quando a query falha: confira sempre o `error` retornado.

## Pontos de atenção

- **Sincronização:** `src/hooks/use-sincronizacao.ts`, ligado em `src/app/_layout.tsx`, roda `Sincronizacao.sincronizar()` (`src/services/sincronizacao.ts`) ao abrir o app, a cada 30 segundos e ao voltar para o primeiro plano. Todas as tabelas são comparadas pelo id nos dois sentidos: o registro que só existe de um lado é copiado para o outro, e o que existe nos dois fica com o `atualizado_em` (ou `criado_em`) mais recente. Sem internet, a rodada falha e a próxima tenta de novo. Exclusões não são propagadas (use `ativo = false`), e um registro novo com o mesmo valor unique de outro id do outro lado (o mesmo e-mail, por exemplo) não é copiado: aparece como conflito no log.
- **Tabela nova:** inclua-a em `TABELAS`, em `src/services/sincronizacao.ts`, depois das tabelas que ela referencia, e dê a ela o `acessoAnonDev` no `schema.ts` do Postgres.
- **Chaves no APK:** a URL e a publishable key ficam legíveis dentro do app, e isso é esperado: quem protege os dados são as policies de RLS. Nunca coloque a senha do banco nem a secret key (`service_role`) em variáveis `EXPO_PUBLIC_`.
- **Variáveis ausentes:** Sem a URL ou a publishable key no `.env.local`, o app abre com SQLite. A sincronização e o Realtime do Supabase são ativados após preencher as duas variáveis e reiniciar o Expo.

## O que ainda não foi testado

Com tabelas de exemplo, as migrations foram geradas e o bundle Android/iOS compilou. Ainda não foram testadas uma conexão real com o Supabase nem uma inserção em dispositivo, porque o projeto ainda não existe.

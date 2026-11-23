-- Custom SQL migration file, put your code below! --
-- O acesso aos códigos passa a ser validado pelo login do síndico (e-mail e senha do app),
-- e não mais por uma conta separada no Supabase Auth.
DROP FUNCTION IF EXISTS public.habitare_codigo_morador(uuid, text, text, text);
--> statement-breakpoint
CREATE FUNCTION habitare_privado.bcrypt_confere(p_valor text, p_hash text) RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  -- pgcrypto só gera o prefixo 2a. Para os valores usados no app o resultado é igual ao 2b/2y.
  SELECT p_valor IS NOT NULL AND p_hash IS NOT NULL
    AND p_hash ~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$'
    AND extensions.crypt(p_valor, '$2a$' || pg_catalog.substr(p_hash, 5))
      = '$2a$' || pg_catalog.substr(p_hash, 5);
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION habitare_privado.bcrypt_confere(text, text) FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
-- Código de acesso numérico de 8 dígitos, com distribuição uniforme.
CREATE FUNCTION habitare_privado.gerar_codigo() RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = ''
AS $$
DECLARE
  n bigint;
BEGIN
  LOOP
    n := ('x' || pg_catalog.encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint;
    EXIT WHEN n < 4200000000;
  END LOOP;
  RETURN pg_catalog.lpad((n % 100000000)::text, 8, '0');
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION habitare_privado.gerar_codigo() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE FUNCTION public.habitare_codigo_morador(
  p_email text, p_senha text, p_id uuid, p_acao text, p_codigo text DEFAULT NULL, p_hash text DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  condominio_admin uuid;
  hash_atual text;
  chave text;
  codigo text;
  cifrado_atual bytea;
BEGIN
  -- Mesma regra do login do app: a senha ou o código de acesso do síndico.
  SELECT u.id_condominio INTO condominio_admin
  FROM public.usuario u
  WHERE pg_catalog.lower(pg_catalog.btrim(u.email)) = pg_catalog.lower(pg_catalog.btrim(p_email))
    AND u.is_sindico AND u.status AND NOT u.excluido
    AND (habitare_privado.bcrypt_confere(p_senha, u.senha_hash)
      OR habitare_privado.bcrypt_confere(p_senha, u.codigo_acesso_hash))
  LIMIT 1;

  IF condominio_admin IS NULL THEN
    RAISE EXCEPTION 'Síndico não autorizado.' USING ERRCODE = '42501';
  END IF;

  IF p_acao IS NULL OR p_acao NOT IN ('consultar', 'publicar', 'renovar') THEN
    RAISE EXCEPTION 'Operação inválida.' USING ERRCODE = '22023';
  END IF;

  SELECT u.codigo_acesso_hash INTO hash_atual
  FROM public.usuario u
  WHERE u.id_usuario = p_id AND u.id_condominio = condominio_admin
    AND NOT u.is_sindico AND NOT u.excluido
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Morador indisponível para este síndico.' USING ERRCODE = 'P0002';
  END IF;

  SELECT v.decrypted_secret INTO STRICT chave
  FROM vault.decrypted_secrets v WHERE v.name = 'habitare_codigos_morador';

  IF p_acao = 'consultar' THEN
    SELECT c.cifrado INTO cifrado_atual
    FROM habitare_privado.codigos_morador c
    WHERE c.id_morador = p_id AND c.id_condominio = condominio_admin AND c.hash = hash_atual;
    IF cifrado_atual IS NULL THEN RETURN NULL; END IF;
    RETURN extensions.pgp_sym_decrypt(cifrado_atual, chave);
  END IF;

  IF p_acao = 'publicar' THEN
    -- Só importa uma cópia local se ela corresponde ao código vigente.
    IF hash_atual IS DISTINCT FROM p_hash OR p_codigo IS NULL OR p_codigo !~ '^([0-9]{8}|[0-9A-F]{24})$'
      OR NOT habitare_privado.bcrypt_confere(p_codigo, hash_atual) THEN
      RAISE EXCEPTION 'O código local não corresponde ao cadastro sincronizado.' USING ERRCODE = '22023';
    END IF;
    codigo := p_codigo;
  ELSE
    codigo := habitare_privado.gerar_codigo();
    hash_atual := extensions.crypt(codigo, extensions.gen_salt('bf', 10));
  END IF;

  INSERT INTO habitare_privado.codigos_morador AS c (id_morador, id_condominio, hash, cifrado)
  VALUES (p_id, condominio_admin, hash_atual, extensions.pgp_sym_encrypt(codigo, chave, 'cipher-algo=aes256'))
  ON CONFLICT (id_morador) DO UPDATE SET hash = EXCLUDED.hash, cifrado = EXCLUDED.cifrado
  WHERE c.id_condominio = condominio_admin;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Morador indisponível para este síndico.' USING ERRCODE = 'P0002';
  END IF;
  IF p_acao = 'renovar' THEN
    UPDATE public.usuario SET codigo_acesso_hash = hash_atual, atualizado_em = pg_catalog.clock_timestamp()
    WHERE id_usuario = p_id;
  END IF;
  RETURN codigo;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.habitare_codigo_morador(text, text, uuid, text, text, text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.habitare_codigo_morador(text, text, uuid, text, text, text) TO anon, authenticated;

--> statement-breakpoint
-- Exclusão do morador: o código deixa de existir no servidor e o hash é apagado,
-- para o acesso não continuar válido nem ser restaurado pela sincronização.
CREATE OR REPLACE FUNCTION habitare_privado.manter_codigo_publicado() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  hash_publicado text;
BEGIN
  IF NEW.excluido THEN
    DELETE FROM habitare_privado.codigos_morador c WHERE c.id_morador = OLD.id_usuario;
    IF NEW.codigo_acesso_hash IS NOT NULL AND NOT NEW.is_sindico THEN
      NEW.codigo_acesso_hash := NULL;
      NEW.atualizado_em := GREATEST(pg_catalog.clock_timestamp(), NEW.atualizado_em, OLD.atualizado_em)
        + interval '1 millisecond';
    END IF;
    RETURN NEW;
  END IF;

  SELECT c.hash INTO hash_publicado FROM habitare_privado.codigos_morador c WHERE c.id_morador = OLD.id_usuario;
  IF FOUND AND NEW.codigo_acesso_hash IS DISTINCT FROM hash_publicado THEN
    NEW.codigo_acesso_hash := hash_publicado;
    -- A próxima sincronização deve corrigir a cópia local que enviou o hash antigo.
    NEW.atualizado_em := GREATEST(pg_catalog.clock_timestamp(), NEW.atualizado_em, OLD.atualizado_em)
      + interval '1 millisecond';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
-- Limpa os moradores que já estavam excluídos.
UPDATE public.usuario SET codigo_acesso_hash = NULL, atualizado_em = pg_catalog.clock_timestamp()
WHERE excluido AND NOT is_sindico AND codigo_acesso_hash IS NOT NULL;
--> statement-breakpoint
-- Moradores antigos só têm o hash bcrypt, que não pode ser revertido. Cada um recebe um novo
-- código numérico, guardado criptografado, para qualquer síndico do condomínio consultá-lo.
DO $$
DECLARE
  m record;
  chave text;
  codigo text;
  novo_hash text;
BEGIN
  SELECT v.decrypted_secret INTO STRICT chave
  FROM vault.decrypted_secrets v WHERE v.name = 'habitare_codigos_morador';

  FOR m IN
    SELECT u.id_usuario, u.id_condominio FROM public.usuario u
    WHERE NOT u.is_sindico AND NOT u.excluido
      AND NOT EXISTS (SELECT 1 FROM habitare_privado.codigos_morador c
        WHERE c.id_morador = u.id_usuario AND c.hash = u.codigo_acesso_hash)
    FOR UPDATE
  LOOP
    codigo := habitare_privado.gerar_codigo();
    novo_hash := extensions.crypt(codigo, extensions.gen_salt('bf', 10));
    INSERT INTO habitare_privado.codigos_morador (id_morador, id_condominio, hash, cifrado)
    VALUES (m.id_usuario, m.id_condominio, novo_hash, extensions.pgp_sym_encrypt(codigo, chave, 'cipher-algo=aes256'))
    ON CONFLICT (id_morador) DO UPDATE SET id_condominio = EXCLUDED.id_condominio,
      hash = EXCLUDED.hash, cifrado = EXCLUDED.cifrado;
    UPDATE public.usuario SET codigo_acesso_hash = novo_hash, atualizado_em = pg_catalog.clock_timestamp()
    WHERE id_usuario = m.id_usuario;
  END LOOP;
END;
$$;

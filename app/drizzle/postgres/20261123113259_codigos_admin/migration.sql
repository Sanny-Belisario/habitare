-- Custom SQL migration file, put your code below! --
CREATE SCHEMA IF NOT EXISTS extensions;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS vault;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;
--> statement-breakpoint
CREATE SCHEMA habitare_privado;
--> statement-breakpoint
REVOKE ALL ON SCHEMA habitare_privado FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE TABLE habitare_privado.administradores_codigo (
  id_auth uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  id_condominio uuid NOT NULL REFERENCES public.condominio(id_condominio)
);
--> statement-breakpoint
CREATE TABLE habitare_privado.codigos_morador (
  id_morador uuid PRIMARY KEY REFERENCES public.usuario(id_usuario) ON DELETE CASCADE,
  id_condominio uuid NOT NULL REFERENCES public.condominio(id_condominio),
  hash text NOT NULL,
  cifrado bytea NOT NULL
);
--> statement-breakpoint
ALTER TABLE habitare_privado.administradores_codigo ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE habitare_privado.codigos_morador ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON ALL TABLES IN SCHEMA habitare_privado FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE FUNCTION habitare_privado.manter_codigo_publicado() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  hash_publicado text;
BEGIN
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
REVOKE ALL ON FUNCTION habitare_privado.manter_codigo_publicado() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE TRIGGER usuario_codigo_publicado
BEFORE UPDATE ON public.usuario
FOR EACH ROW EXECUTE FUNCTION habitare_privado.manter_codigo_publicado();
--> statement-breakpoint
SELECT vault.create_secret(
  pg_catalog.encode(extensions.gen_random_bytes(32), 'hex'),
  'habitare_codigos_morador',
  'Chave de criptografia dos códigos de moradores'
) WHERE NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'habitare_codigos_morador');
--> statement-breakpoint
CREATE FUNCTION public.habitare_codigo_morador(
  p_id uuid, p_acao text, p_codigo text DEFAULT NULL, p_hash text DEFAULT NULL
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
  SELECT a.id_condominio INTO condominio_admin
  FROM habitare_privado.administradores_codigo a
  WHERE a.id_auth = auth.uid();

  IF condominio_admin IS NULL THEN
    RAISE EXCEPTION 'Conta sem autorização para consultar códigos.' USING ERRCODE = '42501';
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
    RAISE EXCEPTION 'Morador indisponível para este administrador.' USING ERRCODE = '42501';
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
    -- O formato limita a importação aos códigos aleatórios emitidos pelo app.
    IF hash_atual IS NULL OR hash_atual IS DISTINCT FROM p_hash
      OR p_codigo IS NULL OR p_codigo !~ '^[0-9A-F]{24}$'
      OR hash_atual !~ '^\$2[ab]\$10\$[./A-Za-z0-9]{53}$'
      -- pgcrypto usa o prefixo 2a. Para estes códigos ASCII o resultado é equivalente ao 2b.
      OR extensions.crypt(p_codigo, '$2a$' || pg_catalog.substr(hash_atual, 5))
        IS DISTINCT FROM ('$2a$' || pg_catalog.substr(hash_atual, 5)) THEN
      RAISE EXCEPTION 'O código local não corresponde ao cadastro sincronizado.' USING ERRCODE = '22023';
    END IF;
    codigo := p_codigo;
  ELSE
    codigo := pg_catalog.upper(pg_catalog.encode(extensions.gen_random_bytes(12), 'hex'));
    hash_atual := extensions.crypt(codigo, extensions.gen_salt('bf', 10));
  END IF;

  INSERT INTO habitare_privado.codigos_morador AS c (id_morador, id_condominio, hash, cifrado)
  VALUES (p_id, condominio_admin, hash_atual, extensions.pgp_sym_encrypt(codigo, chave, 'cipher-algo=aes256'))
  ON CONFLICT (id_morador) DO UPDATE SET hash = EXCLUDED.hash, cifrado = EXCLUDED.cifrado
  WHERE c.id_condominio = condominio_admin;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Morador indisponível para este administrador.' USING ERRCODE = '42501';
  END IF;
  IF p_acao = 'renovar' THEN
    UPDATE public.usuario SET codigo_acesso_hash = hash_atual, atualizado_em = pg_catalog.clock_timestamp()
    WHERE id_usuario = p_id;
  END IF;
  RETURN codigo;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.habitare_codigo_morador(uuid, text, text, text) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.habitare_codigo_morador(uuid, text, text, text) TO authenticated;

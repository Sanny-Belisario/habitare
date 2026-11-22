import { Redirect } from "expo-router";

import { useSessao } from "@/hooks/use-sessao";

export default function Index() {
  const usuario = useSessao();
  if (!usuario) return <Redirect href="/pages/auth/login" />;

  return (
    <Redirect href={usuario.isSindico ? "/pages/home/inicio-sindico" : "/pages/home/inicio-morador"} />
  );
}

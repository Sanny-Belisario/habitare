-- Publica as mudanças de "ocorrencia" no Supabase Realtime: o painel do síndico
-- (src/hooks/use-realtime-ocorrencias.ts) sincroniza assim que algo muda.
-- O Realtime respeita o RLS: só recebe eventos quem pode ler a tabela.
ALTER PUBLICATION supabase_realtime ADD TABLE "ocorrencia";

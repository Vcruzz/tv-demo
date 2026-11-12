import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export async function entrar(email: string, senha: string): Promise<{ erro: string | null }> {
  if (!supabase) return { erro: "Configuração do Supabase ausente ou inválida." };
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  // Mensagem genérica — não revela se foi o e-mail ou a senha que errou.
  return { erro: error ? "E-mail ou senha incorretos." : null };
}

export async function sair(): Promise<void> {
  await supabase?.auth.signOut();
}

export function obterSessaoInicial(): Promise<Session | null> {
  if (!supabase) return Promise.resolve(null);
  return supabase.auth.getSession().then(({ data }) => data.session);
}

export function assinarMudancaDeSessao(fn: (session: Session | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => fn(session));
  return () => data.subscription.unsubscribe();
}

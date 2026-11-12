import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// createClient() valida os argumentos e lança na hora se url/anonKey estiverem
// ausentes ou malformados ("supabaseUrl is required.", "Invalid supabaseUrl: ...").
// Um throw em escopo de módulo derrubaria a árvore inteira do dashboard (todo
// painel que importa este módulo, direta ou indiretamente) e falharia o SSR.
// Por isso a criação do client fica dentro de um try/catch em escopo de módulo:
// nada aqui pode lançar durante o import. Quando a config está ausente/inválida,
// `supabase` fica null e `isSupabaseConfigured()` deixa o chamador (fetchEventos)
// decidir o que fazer — restringindo o problema só ao painel de eventos.
function buildClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey);
  } catch {
    return null;
  }
}

export const supabase = buildClient();

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

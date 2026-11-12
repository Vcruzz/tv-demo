import { useQuery } from "@tanstack/react-query";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { estaNoModoDemo } from "@/lib/modo-demo";

async function fetchUltimaSync(): Promise<string | null> {
  if (estaNoModoDemo()) return new Date().toISOString();

  if (!isSupabaseConfigured() || !supabase) {
    throw new Error("Configuração do Supabase ausente ou inválida.");
  }

  const { data, error } = await supabase
    .from("v_ultima_sync")
    .select("last_sync")
    .maybeSingle();

  if (error) throw error;
  return data?.last_sync ?? null;
}

export function useUltimaSync() {
  return useQuery({
    queryKey: ["ultima-sync"],
    queryFn: fetchUltimaSync,
    refetchInterval: 5 * 60 * 1000,
  });
}

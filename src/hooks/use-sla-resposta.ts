import { useQuery } from "@tanstack/react-query";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { estaNoModoDemo } from "@/lib/modo-demo";
import { SLA_RESPOSTA_DEMO } from "@/lib/dados-demo";

async function fetchSlaResposta(): Promise<number | null> {
  if (estaNoModoDemo()) return SLA_RESPOSTA_DEMO;

  if (!isSupabaseConfigured() || !supabase) {
    throw new Error("Configuração do Supabase ausente ou inválida.");
  }

  const { data, error } = await supabase
    .from("v_sla_compliance")
    .select("com_resposta, dentro_sla_resposta")
    .order("mes", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data || !data.com_resposta) return null;

  return Math.round((data.dentro_sla_resposta / data.com_resposta) * 100);
}

export function useSlaResposta() {
  return useQuery({
    queryKey: ["sla-resposta"],
    queryFn: fetchSlaResposta,
    refetchInterval: 5 * 60 * 1000,
  });
}

import { useQuery } from "@tanstack/react-query";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { PanelTitle } from "@/components/panel-title";
import { Skeleton } from "@/components/ui/skeleton";
import { estaNoModoDemo } from "@/lib/modo-demo";
import { AGENTES_DEMO } from "@/lib/dados-demo";

type Agente = {
  agent_name: string;
  resolvidos_mes: number | null;
};

async function fetchRanking(): Promise<Agente[]> {
  if (estaNoModoDemo()) return AGENTES_DEMO;

  if (!isSupabaseConfigured() || !supabase) {
    throw new Error("Configuração do Supabase ausente ou inválida.");
  }

  const { data, error } = await supabase
    .from("v_carga_agentes")
    .select("agent_name, resolvidos_mes")
    .order("resolvidos_mes", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function RankingPanel() {
  const { data: agentes, isLoading, isError } = useQuery({
    queryKey: ["ranking"],
    queryFn: fetchRanking,
    refetchInterval: 5 * 60 * 1000,
  });

  const maxResolvidos = Math.max(...(agentes ?? []).map((a) => a.resolvidos_mes ?? 0), 1);

  return (
    <>
      <PanelTitle>Ranking mensal</PanelTitle>

      {isLoading && (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}

      {isError && !agentes && (
        <p className="mt-4 text-[0.68rem] text-muted-foreground">Não foi possível carregar o ranking.</p>
      )}

      {!isLoading && agentes?.length === 0 && (
        <p className="mt-4 text-[0.68rem] text-muted-foreground">Nenhum agente ativo encontrado.</p>
      )}

      {agentes && agentes.length > 0 && (
        <div className="mt-4 space-y-2.5">
          {agentes.map((agente, index) => {
            const resolvidos = agente.resolvidos_mes ?? 0;
            const pct = Math.round((resolvidos / maxResolvidos) * 100);
            return (
              <div
                className="reveal flex items-center gap-3"
                style={{ animationDelay: `${index * 50 + 100}ms` }}
                key={agente.agent_name}
              >
                <span className={`w-7 text-[0.9375rem] font-bold ${index === 0 ? "text-primary" : "text-muted-foreground/60"}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex justify-between font-bold">
                    <span className="truncate text-[1.1875rem]">{agente.agent_name}</span>
                    <span className={`text-[1.3125rem] ${index === 0 ? "text-primary" : "text-foreground/80"}`}>{resolvidos}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-background">
                    <div
                      className={`h-full rounded-full ${index === 0 ? "bg-primary shadow-accent" : "bg-foreground/20"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

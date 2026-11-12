import { useQuery } from "@tanstack/react-query";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { PanelTitle } from "@/components/panel-title";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_ABERTOS } from "@/lib/status";
import { estaNoModoDemo } from "@/lib/modo-demo";
import { STATUS_DEMO } from "@/lib/dados-demo";

// Classes de tema (definidas em tv-app/src/styles.css, oklch/dark-mode
// aware) para cada status — não usa os valores hex de STATUS_COR (esses
// espelham shared.js do dashboard principal, que não usa Tailwind).
const STATUS_CLASSE: Record<string, string> = {
  "Aberto":             "bg-status-open",
  "Pendente":           "bg-status-pending",
  "Aguardando Cliente": "bg-status-client",
  "Aguardando Agente":  "bg-status-agent",
};

async function fetchBacklog(): Promise<string[]> {
  if (estaNoModoDemo()) return STATUS_DEMO;

  if (!isSupabaseConfigured() || !supabase) {
    throw new Error("Configuração do Supabase ausente ou inválida.");
  }

  const { data, error } = await supabase
    .from("tickets")
    .select("status")
    .in("status", STATUS_ABERTOS);

  if (error) throw error;
  return (data ?? []).map((row) => row.status as string);
}

export function BacklogPanel() {
  const { data: statusList, isLoading, isError } = useQuery({
    queryKey: ["backlog"],
    queryFn: fetchBacklog,
    refetchInterval: 5 * 60 * 1000,
  });

  const contagem: Record<string, number> = {};
  for (const status of statusList ?? []) {
    contagem[status] = (contagem[status] ?? 0) + 1;
  }
  const total = (statusList ?? []).length;

  return (
    <>
      <PanelTitle accent>Status do backlog</PanelTitle>

      {isLoading && (
        <div className="flex flex-1 flex-col items-center justify-center py-3">
          <Skeleton className="h-16 w-24" />
        </div>
      )}

      {isError && !statusList && (
        <p className="flex-1 py-3 text-center text-[0.68rem] text-muted-foreground">
          Não foi possível carregar o backlog.
        </p>
      )}

      {statusList && (
        <>
          <div className="flex flex-1 flex-col items-center justify-center py-3">
            <strong className="font-display text-8xl font-extrabold leading-none">{total}</strong>
            <span className="mt-3 text-[1rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Chamados em aberto
            </span>
          </div>
          <div className="space-y-3">
            {STATUS_ABERTOS.map((status) => (
              <div className="flex items-center justify-between text-[1.125rem]" key={status}>
                <div className="flex items-center gap-3">
                  <span className={`size-3 rounded-full ${STATUS_CLASSE[status]}`} />
                  <span className="text-foreground/60">{status}</span>
                </div>
                <strong className="text-[1.25rem] tabular-nums">{String(contagem[status] ?? 0).padStart(2, "0")}</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

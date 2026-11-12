import { useQuery } from "@tanstack/react-query";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { PanelTitle } from "@/components/panel-title";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_ABERTOS } from "@/lib/status";
import { estaNoModoDemo } from "@/lib/modo-demo";
import { CHAMADOS_CRITICOS_DEMO } from "@/lib/dados-demo";

type ChamadoCritico = {
  freshdesk_id: number;
  subject: string | null;
  created_at: string;
  agent_name: string | null;
};

async function fetchChamadosCriticos(): Promise<ChamadoCritico[]> {
  if (estaNoModoDemo()) return CHAMADOS_CRITICOS_DEMO;

  if (!isSupabaseConfigured() || !supabase) {
    throw new Error("Configuração do Supabase ausente ou inválida.");
  }

  const { data, error } = await supabase
    .from("tickets")
    .select("freshdesk_id, subject, created_at, agent_name")
    .in("status", STATUS_ABERTOS)
    .order("created_at", { ascending: true })
    .limit(6);

  if (error) throw error;
  return data ?? [];
}

function diasEmAberto(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
}

export function ChamadosCriticosPanel() {
  const { data: chamados, isLoading, isError } = useQuery({
    queryKey: ["chamados-criticos"],
    queryFn: fetchChamadosCriticos,
    refetchInterval: 5 * 60 * 1000,
  });

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-card/70 px-4 py-3.5 xl:px-5">
        <PanelTitle accent>Chamados críticos</PanelTitle>
        <span className="rounded bg-primary/15 px-2.5 py-1.5 text-[0.8125rem] font-bold uppercase text-primary">
          Atenção imediata
        </span>
      </div>
      <div className="grid grid-cols-[7rem_minmax(0,1fr)_9.5rem] px-4 py-1.5 text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-muted-foreground/60 xl:px-5">
        <span>Ticket</span><span>Assunto</span><span className="text-right">Agente / SLA</span>
      </div>

      {isLoading && (
        <div className="space-y-2 px-4 py-3 xl:px-5">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      )}

      {isError && !chamados && (
        <p className="px-4 py-3 text-[0.68rem] text-muted-foreground xl:px-5">
          Não foi possível carregar os chamados críticos.
        </p>
      )}

      {!isLoading && chamados?.length === 0 && (
        <p className="px-4 py-3 text-[0.68rem] text-muted-foreground xl:px-5">Nenhum chamado crítico.</p>
      )}

      {chamados && chamados.length > 0 && (
        <div className="divide-y divide-border/60">
          {chamados.map((ticket, index) => {
            const dias = diasEmAberto(ticket.created_at);
            const subject = (ticket.subject ?? "—").substring(0, 32);
            return (
              <div
                className="reveal grid grid-cols-[7rem_minmax(0,1fr)_9.5rem] items-center px-4 py-2.5 text-[1.1875rem] xl:px-5"
                style={{ animationDelay: `${index * 50 + 350}ms` }}
                key={ticket.freshdesk_id}
              >
                <strong className={`${index < 2 ? "text-primary" : "text-foreground/50"} ${index === 0 ? "pulse-critical" : ""}`}>
                  #{ticket.freshdesk_id}
                </strong>
                <span className="truncate pr-3 font-medium">{subject}</span>
                <strong className={`text-right tabular-nums ${index < 2 ? "text-primary/80" : "text-muted-foreground"}`}>
                  {ticket.agent_name ? ticket.agent_name.split(" ")[0] : "—"} • {dias}d
                </strong>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import { tocarAlertaSonoro } from "@/lib/alerta-sonoro";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { PanelTitle } from "@/components/panel-title";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_ABERTOS } from "@/lib/status";
import { estaNoModoDemo } from "@/lib/modo-demo";
import { CHAMADOS_RECENTES_DEMO } from "@/lib/dados-demo";

type ChamadoRecente = {
  freshdesk_id: number;
  subject: string | null;
  created_at: string;
};

async function fetchChamadosRecentes(): Promise<ChamadoRecente[]> {
  if (estaNoModoDemo()) return CHAMADOS_RECENTES_DEMO;

  if (!isSupabaseConfigured() || !supabase) {
    throw new Error("Configuração do Supabase ausente ou inválida.");
  }

  const { data, error } = await supabase
    .from("tickets")
    .select("freshdesk_id, subject, created_at")
    .in("status", STATUS_ABERTOS)
    .is("agent_id", null)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return data ?? [];
}

function tempoDecorrido(createdAt: string): string {
  const horas = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  if (horas < 1) return `${Math.round(horas * 60)}min`;
  if (horas < 24) return `${horas.toFixed(1)}h`;
  const dias = Math.floor(horas / 24);
  return `${dias}d`;
}

export function RecemAbertosPanel() {
  const { data: chamados, isLoading, isError } = useQuery({
    queryKey: ["chamados-recentes"],
    queryFn: fetchChamadosRecentes,
    refetchInterval: 5 * 60 * 1000,
  });

  const ticketsVistos = useRef<Set<number> | null>(null);

  useEffect(() => {
    if (!chamados) return; // erro, ou ainda carregando — não atualiza nem compara
    if (estaNoModoDemo()) return; // dado fictício nunca deve disparar som de verdade

    const idsAtuais = new Set(chamados.map((t) => t.freshdesk_id));
    if (ticketsVistos.current !== null) {
      const temChamadoNovo = [...idsAtuais].some((id) => !ticketsVistos.current!.has(id));
      if (temChamadoNovo) void tocarAlertaSonoro();
    }
    ticketsVistos.current = idsAtuais;
  }, [chamados]);

  return (
    <>
      <div className="border-b border-border bg-card/70 px-4 py-3 xl:px-5">
        <PanelTitle>Recém-abertos</PanelTitle>
      </div>

      {isLoading && (
        <div className="space-y-2 px-4 py-3 xl:px-5">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      )}

      {isError && !chamados && (
        <p className="px-4 py-3 text-[0.68rem] text-muted-foreground xl:px-5">
          Não foi possível carregar os chamados recentes.
        </p>
      )}

      {!isLoading && chamados?.length === 0 && (
        <p className="px-4 py-3 text-[0.68rem] text-muted-foreground xl:px-5">Nenhum chamado sem agente</p>
      )}

      {chamados && chamados.length > 0 && (
        <div className="divide-y divide-border/60">
          {chamados.map((ticket, index) => {
            const subject = (ticket.subject ?? "—").substring(0, 32);
            return (
              <div
                className="reveal flex items-center justify-between gap-3 px-4 py-2.5 text-[1.1875rem] xl:px-5"
                style={{ animationDelay: `${index * 50 + 600}ms` }}
                key={ticket.freshdesk_id}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <strong className="text-status-open">#{ticket.freshdesk_id}</strong>
                  <span className="truncate">{subject}</span>
                </div>
                <div className="flex shrink-0 gap-3 text-[0.9375rem] font-bold text-muted-foreground">
                  <span>{tempoDecorrido(ticket.created_at)} atrás</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

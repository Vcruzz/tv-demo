import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { PanelTitle } from "@/components/panel-title";
import { Skeleton } from "@/components/ui/skeleton";
import { EventFormDialog } from "@/components/event-form-dialog";
import { tocarAvisoEvento } from "@/lib/alerta-sonoro";
import { estaNoModoDemo } from "@/lib/modo-demo";
import { EVENTOS_DEMO } from "@/lib/dados-demo";

export type Evento = {
  id: number;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  local: string | null;
  categoria: string;
  urgente: boolean;
  responsavel: string | null;
  origem_externa_id: string | null;
};

// Início da próxima segunda-feira em America/Sao_Paulo, como instante UTC —
// limite exclusivo pra incluir a semana inteira (até domingo) a partir de
// hoje, não importa quantos eventos sejam (sem limite fixo de contagem).
function inicioDaProximaSegundaEmSaoPauloUTC(): Date {
  const hojeStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const [anoStr, mesStr, diaStr] = hojeStr.split("-");
  const ano = Number(anoStr);
  const mes = Number(mesStr);
  const dia = Number(diaStr);
  const diaDaSemana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay(); // 0=domingo..6=sábado
  const diasAteDomingo = (7 - diaDaSemana) % 7;
  return new Date(Date.UTC(ano, mes - 1, dia + diasAteDomingo + 1, 3, 0, 0, 0)); // 00:00 BRT da segunda seguinte
}

async function fetchEventos(): Promise<Evento[]> {
  if (estaNoModoDemo()) return EVENTOS_DEMO;

  if (!isSupabaseConfigured() || !supabase) {
    throw new Error("Configuração do Supabase ausente ou inválida.");
  }

  const nowIso = new Date().toISOString();
  const limiteIso = inicioDaProximaSegundaEmSaoPauloUTC().toISOString();
  const { data, error } = await supabase
    .from("v_eventos_ativos")
    .select("id, titulo, descricao, data_inicio, data_fim, local, categoria, urgente, responsavel, origem_externa_id")
    .or(`data_fim.gte.${nowIso},and(data_fim.is.null,data_inicio.gte.${nowIso})`)
    .lt("data_inicio", limiteIso)
    .order("data_inicio", { ascending: true })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

const eventTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

// Chave do dia em America/Sao_Paulo (YYYY-MM-DD), independente do fuso do navegador.
const dateKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });
const horaBrasiliaFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// Dispara o aviso sonoro de véspera às 16h (2h antes do fim do expediente,
// às 18h), no dia anterior a qualquer evento agendado — "pra ninguém
// esquecer". Checa a cada minuto; o filtro de hora:minuto exatos evita
// disparar mais de uma vez dentro da mesma janela de 16:00.
function verificarAvisoEvento(eventos: Evento[]) {
  const agora = new Date();
  const [horaStr, minutoStr] = horaBrasiliaFormat.format(agora).split(":");
  if (horaStr !== "16" || minutoStr !== "00") return;

  const amanha = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
  const amanhaKey = dateKeyFormat.format(amanha);
  const temEventoAmanha = eventos.some(
    (evento) => dateKeyFormat.format(new Date(evento.data_inicio)) === amanhaKey,
  );
  if (temEventoAmanha) void tocarAvisoEvento();
}

// Evento de hoje ou de amanhã conta como urgente na tela, não importa o
// valor marcado no banco — mais visibilidade pro que está prestes a
// acontecer, independente de quem criou o evento ter marcado ou não.
function ehHojeOuAmanha(dataInicioIso: string): boolean {
  const hoje = dateKeyFormat.format(new Date());
  const amanha = dateKeyFormat.format(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const dataEvento = dateKeyFormat.format(new Date(dataInicioIso));
  return dataEvento === hoje || dataEvento === amanha;
}

// Anima o scrollTop de 0 até o fim ao longo de uma duração fixa — sempre no
// mesmo ritmo "devagar", não importa quanto precise rolar.
function animarScroll(el: HTMLElement, duracaoMs: number): Promise<void> {
  return new Promise((resolve) => {
    const alcance = el.scrollHeight - el.clientHeight;
    if (alcance <= 0) {
      resolve();
      return;
    }
    const inicio = performance.now();
    function passo(agora: number) {
      const progresso = Math.min(1, (agora - inicio) / duracaoMs);
      el.scrollTop = alcance * progresso;
      if (progresso < 1) requestAnimationFrame(passo);
      else resolve();
    }
    requestAnimationFrame(passo);
  });
}

export function EventsPanel({ readOnly = false }: { readOnly?: boolean }) {
  const queryClient = useQueryClient();
  const {
    data: eventos,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["eventos"],
    queryFn: fetchEventos,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!eventos) return;
    if (estaNoModoDemo()) return; // dado fictício nunca deve disparar o aviso sonoro de véspera

    verificarAvisoEvento(eventos);
    const timer = window.setInterval(() => verificarAvisoEvento(eventos), 60_000);
    return () => window.clearInterval(timer);
  }, [eventos]);

  const listaRef = useRef<HTMLDivElement>(null);

  // Ciclo: espera 5s, desce devagar (15s) até o fim, espera mais 5s no fim,
  // volta pro topo, recomeça — carrossel contínuo pra listas maiores que a
  // tela. Reinicia sempre que os dados mudam (novo evento, por exemplo).
  useEffect(() => {
    const el = listaRef.current;
    if (!el) return;
    let cancelado = false;

    function espera(ms: number): Promise<void> {
      return new Promise((resolve) => {
        window.setTimeout(() => {
          if (!cancelado) resolve();
        }, ms);
      });
    }

    async function ciclo(elemento: HTMLElement) {
      while (!cancelado) {
        elemento.scrollTop = 0;
        await espera(5000);
        if (cancelado) return;
        await animarScroll(elemento, 15000);
        if (cancelado) return;
        await espera(5000);
      }
    }

    void ciclo(el);
    return () => {
      cancelado = true;
    };
  }, [eventos]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);

  const excluirMutation = useMutation({
    mutationFn: async (evento: Evento) => {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error("Configuração do Supabase ausente ou inválida.");
      }

      const { data, error } = await supabase.rpc("excluir_evento", { p_id: evento.id });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Evento excluído.");
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function openCreateDialog() {
    setEditingEvento(null);
    setDialogOpen(true);
  }

  function openEditDialog(evento: Evento) {
    setEditingEvento(evento);
    setDialogOpen(true);
  }

  function handleDelete(evento: Evento) {
    if (excluirMutation.isPending) return;
    if (!window.confirm(`Excluir o evento "${evento.titulo}"?`)) return;
    excluirMutation.mutate(evento);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <PanelTitle>Próximos eventos</PanelTitle>
        {!readOnly && (
          <button
            type="button"
            onClick={openCreateDialog}
            className="flex size-5 items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/90"
            aria-label="Novo evento"
          >
            <Plus className="size-3.5" />
          </button>
        )}
      </div>

      <div ref={listaRef} className="mt-6 flex-1 space-y-6 overflow-y-auto">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {isError && !eventos && (
          <p className="text-[0.68rem] text-muted-foreground">Não foi possível carregar eventos.</p>
        )}

        {!isLoading && eventos?.length === 0 && (
          <p className="text-[0.68rem] text-muted-foreground">Nenhum evento agendado.</p>
        )}

        {eventos?.map((evento, index) => {
          const urgente = evento.urgente || ehHojeOuAmanha(evento.data_inicio);
          return (
            <article
              className={`group reveal relative overflow-hidden border-l-2 pl-4 ${urgente ? "border-urgente" : "border-border"}`}
              style={{ animationDelay: `${index * 50 + 800}ms` }}
              key={evento.id}
            >
              {urgente && (
                <div className="pulse-critical absolute inset-0 bg-urgente/25" aria-hidden="true" />
              )}
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={`text-[1rem] font-bold uppercase tracking-[0.14em] ${
                      urgente ? "text-urgente" : "text-muted-foreground"
                    }`}
                  >
                    {eventTimeFormat.format(new Date(evento.data_inicio))}
                  </p>
                  <h3 className={`mt-2 text-[1.5rem] font-bold ${urgente ? "text-urgente" : ""}`}>{evento.titulo}</h3>
                  {evento.descricao && (
                    <p className="mt-1 text-[1rem] leading-relaxed text-muted-foreground">
                      {evento.descricao}
                    </p>
                  )}
                  {(evento.local || evento.responsavel) && (
                    <p className="mt-1 text-[0.875rem] text-muted-foreground">
                      {[evento.local, evento.responsavel].filter(Boolean).join(" • ")}
                    </p>
                  )}
                </div>
                {!readOnly && !evento.origem_externa_id && (
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEditDialog(evento)}
                      className="flex size-5 items-center justify-center rounded bg-foreground/10 hover:bg-foreground/20"
                      aria-label="Editar evento"
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(evento)}
                      disabled={excluirMutation.isPending}
                      className="flex size-5 items-center justify-center rounded bg-foreground/10 hover:bg-foreground/20 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Excluir evento"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!readOnly && (
        <EventFormDialog open={dialogOpen} onOpenChange={setDialogOpen} evento={editingEvento} />
      )}
    </>
  );
}

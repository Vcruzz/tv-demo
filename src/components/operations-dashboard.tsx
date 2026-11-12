import { useEffect, useState } from "react";

import { EventsPanel } from "./events-panel";
import { RankingPanel } from "./ranking-panel";
import { BacklogPanel } from "./backlog-panel";
import { ChamadosCriticosPanel } from "./chamados-criticos-panel";
import { RecemAbertosPanel } from "./recem-abertos-panel";
import { useUltimaSync } from "@/hooks/use-ultima-sync";
import { useSlaResposta } from "@/hooks/use-sla-resposta";
import { useAutoZoom } from "@/hooks/use-auto-zoom";
import { ativarAudio } from "@/lib/alerta-sonoro";
import { estaNoModoDemo } from "@/lib/modo-demo";
import { useAudioAtivo } from "@/hooks/use-audio-ativo";
import { useAuthSession } from "@/hooks/use-auth-session";
import { LoginScreen } from "@/components/login-screen";
import { sair } from "@/lib/auth";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoUrl from "@/assets/logo.png";

const timeFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  weekday: "long",
  day: "2-digit",
  month: "short",
});

const LIMIAR_STALENESS_MS = 90 * 60 * 1000;

function humorSla(pct: number | null | undefined): string {
  if (pct == null) return "…";
  if (pct >= 80) return "😄";
  if (pct >= 50) return "😐";
  if (pct >= 30) return "😟";
  return "😡";
}

export function OperationsDashboard({ readOnly = false }: { readOnly?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  const { data: ultimaSync } = useUltimaSync();
  const isStale = ultimaSync != null && Date.now() - new Date(ultimaSync).getTime() > LIMIAR_STALENESS_MS;
  const { data: slaResposta } = useSlaResposta();

  const searchParams = new URLSearchParams(window.location.search);
  const compact = searchParams.has("compact");
  const zoomParam = Number(searchParams.get("zoom"));
  const zoomMultiplier = zoomParam > 0 ? zoomParam : 1;
  useAutoZoom(compact, zoomMultiplier);

  const audioAtivo = useAudioAtivo();
  const { session, carregando } = useAuthSession();

  useEffect(() => {
    document.documentElement.classList.toggle("compact", compact);
    return () => {
      document.documentElement.classList.remove("compact");
    };
  }, [compact]);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!readOnly && carregando) {
    return <div className="h-full bg-background" />;
  }

  if (!readOnly && !session) {
    return <LoginScreen />;
  }

  return (
    <>
      <div className="h-full overflow-hidden bg-background font-body text-foreground">
        <div className="flex h-full min-h-0 w-full flex-col gap-6 p-8">
          <header className="flex shrink-0 flex-row items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3.5">
              <img src={logoUrl} alt="Logo Liceu Jardim" className="size-12 shrink-0 object-contain" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-4xl font-bold uppercase">Central de Operações TI</h1>
                  {estaNoModoDemo() && (
                    <span className="rounded bg-primary/15 px-2.5 py-1.5 text-[0.8125rem] font-bold uppercase text-primary">
                      Demo
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[1rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Monitoramento Freshdesk • Liceu Jardim</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-10">
              <div className="text-right">
                <p className="text-[0.9375rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">SLA de resposta</p>
                <p className="mt-1 flex items-center justify-end gap-2 text-[1.125rem] font-semibold text-foreground/70">
                  <span aria-hidden="true" className="text-2xl leading-none">{humorSla(slaResposta)}</span>
                  {slaResposta != null ? `${slaResposta}%` : "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[0.9375rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">Última sincronização</p>
                <p className={`mt-1 text-[1.125rem] font-semibold ${isStale ? "text-destructive" : "text-foreground/70"}`}>
                  {ultimaSync ? new Date(ultimaSync).toLocaleString("pt-BR") : "—"}
                </p>
              </div>
              <div className="min-w-40 text-right" aria-live="polite">
                <p className="font-display text-6xl font-extrabold tabular-nums">{now ? timeFormat.format(now) : "--:--:--"}</p>
                <p className="mt-1 text-[1rem] font-bold uppercase tracking-[0.14em] text-primary">{now ? dateFormat.format(now).replace(".", "") : "Carregando data"}</p>
              </div>
            </div>
          </header>

          <main className="grid min-h-0 flex-1 grid-cols-12 gap-5 grid-rows-[minmax(0,1fr)]">
            <div className="flex min-h-0 flex-col gap-5 col-span-3">
              <section className="dashboard-panel flex min-h-0 flex-3 flex-col overflow-hidden p-5">
                <RankingPanel />
              </section>

              <section className="dashboard-panel relative flex min-h-56 flex-2 flex-col overflow-hidden border-primary/30 bg-card p-5">
                <div className="absolute right-0 top-0 size-24 rounded-bl-full bg-primary/5" />
                <BacklogPanel />
              </section>
            </div>

            <div className="flex min-h-0 flex-col gap-5 col-span-6">
              <section className="dashboard-panel flex min-h-0 flex-3 flex-col overflow-hidden">
                <ChamadosCriticosPanel />
              </section>

              <section className="dashboard-panel flex min-h-0 flex-2 flex-col overflow-hidden">
                <RecemAbertosPanel />
              </section>
            </div>

            <div className="min-h-0 col-span-3">
              <section className="dashboard-panel flex h-full min-h-0 flex-col overflow-hidden p-5">
                <EventsPanel readOnly={readOnly} />
              </section>
            </div>
          </main>
        </div>
      </div>

      {!audioAtivo && (
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-3.5 right-3.5 z-40"
          onClick={() => {
            void ativarAudio();
          }}
        >
          🔊 Ativar som
        </Button>
      )}

      {!readOnly && session && (
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-3.5 left-3.5 z-40"
          onClick={() => {
            void sair();
          }}
        >
          <LogOut className="size-3.5" /> Sair
        </Button>
      )}
    </>
  );
}

import somAlertaUrl from "@/assets/alerta-sonoro.mp3";
import somAvisoEventoUrl from "@/assets/aviso-evento-amanha.mp3";

let audioCtx: AudioContext | null = null;

// Chromium limita a ~6 AudioContexts simultâneos por documento; um único
// contexto reutilizado entre alertas evita esgotar esse limite.
function obterContextoAudio(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

// Busca e decodifica um MP3 uma única vez; o AudioBuffer resultante é
// reutilizado em cada toque (decodeAudioData é custoso para repetir).
// Fábrica genérica: cada chamador guarda sua própria promise em cache.
function criarCarregadorDeBuffer(url: string): (ctx: AudioContext) => Promise<AudioBuffer> {
  let bufferPromise: Promise<AudioBuffer> | null = null;
  return (ctx: AudioContext) => {
    if (!bufferPromise) {
      bufferPromise = fetch(url)
        .then((res) => res.arrayBuffer())
        .then((bytes) => ctx.decodeAudioData(bytes));
    }
    return bufferPromise;
  };
}

const obterBufferAlerta = criarCarregadorDeBuffer(somAlertaUrl);
const obterBufferAvisoEvento = criarCarregadorDeBuffer(somAvisoEventoUrl);

const listeners = new Set<(ativo: boolean) => void>();

function notificarMudancaDeEstado() {
  const ativo = audioEstaAtivo();
  listeners.forEach((fn) => fn(ativo));
}

async function tocarBuffer(obterBuffer: (ctx: AudioContext) => Promise<AudioBuffer>): Promise<boolean> {
  try {
    const ctx = obterContextoAudio();
    if (ctx.state !== "running") await ctx.resume();
    // Notifica sempre, não só quando precisou de resume() — cobre também o
    // caso em que o contexto já nasce "running" (navegador já permitia
    // autoplay), que de outra forma nunca avisaria o botão no dashboard.
    notificarMudancaDeEstado();
    if (ctx.state !== "running") return false; // sem gesto do usuário ainda

    const buffer = await obterBuffer(ctx);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = 1.0;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    return true;
  } catch (e) {
    console.error("Erro ao tocar som:", e);
    return false;
  }
}

export async function tocarAlertaSonoro(): Promise<boolean> {
  return tocarBuffer(obterBufferAlerta);
}

// Aviso de véspera de evento (2h antes do fim do expediente, no dia
// anterior a um evento agendado) — som diferente do alerta de chamado
// novo, para que dê pra distinguir um do outro de ouvido.
export async function tocarAvisoEvento(): Promise<boolean> {
  return tocarBuffer(obterBufferAvisoEvento);
}

export async function ativarAudio(): Promise<boolean> {
  const ctx = obterContextoAudio();
  try {
    await ctx.resume();
  } catch (e) {
    console.error("Erro ao ativar áudio:", e);
  }
  notificarMudancaDeEstado();
  return ctx.state === "running";
}

export function audioEstaAtivo(): boolean {
  return audioCtx !== null && audioCtx.state === "running";
}

// Assina mudanças no estado do áudio (ativado com sucesso via ativarAudio(),
// ou descoberto já ativo na hora de tocar um alerta). Retorna a função de
// cancelamento da assinatura.
export function onAudioAtivoChange(fn: (ativo: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

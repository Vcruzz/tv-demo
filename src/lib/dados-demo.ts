import type { Evento } from "@/components/events-panel";

// Todos os deltas de tempo abaixo são relativos ao momento em que este
// módulo é carregado (Date.now()), não datas de calendário congeladas —
// assim "há 7 dias" continua sendo "há 7 dias" não importa quando a
// página /tv-demo for aberta, sem a demo parecer "quebrada" com o tempo.
const AGORA = Date.now();
const MINUTO_MS = 60_000;
const HORA_MS = 3_600_000;
const DIA_MS = 86_400_000;

export const AGENTES_DEMO: { agent_name: string; resolvidos_mes: number }[] = [
  { agent_name: "Marina Costa", resolvidos_mes: 182 },
  { agent_name: "Rafael Souza", resolvidos_mes: 156 },
  { agent_name: "Juliana Alves", resolvidos_mes: 134 },
  { agent_name: "Pedro Lima", resolvidos_mes: 121 },
  { agent_name: "Camila Ferreira", resolvidos_mes: 98 },
  { agent_name: "Bruno Martins", resolvidos_mes: 76 },
];

// Lista achatada de status — BacklogPanel conta cada ocorrência sozinho,
// sem precisar de nenhuma mudança na lógica de contagem existente.
const CONTAGEM_BACKLOG_DEMO: Record<string, number> = {
  "Aberto": 14,
  "Pendente": 9,
  "Aguardando Cliente": 6,
  "Aguardando Agente": 4,
};
export const STATUS_DEMO: string[] = Object.entries(CONTAGEM_BACKLOG_DEMO).flatMap(
  ([status, quantidade]) => Array(quantidade).fill(status) as string[],
);

export const CHAMADOS_CRITICOS_DEMO: {
  freshdesk_id: number;
  subject: string;
  created_at: string;
  agent_name: string | null;
}[] = [
  { freshdesk_id: 10042, subject: "Impressora da sala 12 não imprime", agent_name: "Rafael Souza", created_at: new Date(AGORA - 9 * DIA_MS).toISOString() },
  { freshdesk_id: 10051, subject: "Projetor não liga na sala de reuniões", agent_name: "Marina Costa", created_at: new Date(AGORA - 7 * DIA_MS).toISOString() },
  { freshdesk_id: 10058, subject: "Wi-fi instável no bloco B", agent_name: null, created_at: new Date(AGORA - 6 * DIA_MS).toISOString() },
  { freshdesk_id: 10063, subject: "Sistema de matrícula travando", agent_name: "Juliana Alves", created_at: new Date(AGORA - 5 * DIA_MS).toISOString() },
  { freshdesk_id: 10070, subject: "Caixa de som do auditório sem áudio", agent_name: "Pedro Lima", created_at: new Date(AGORA - 4 * DIA_MS).toISOString() },
  { freshdesk_id: 10077, subject: "Notebook da coordenação não liga", agent_name: null, created_at: new Date(AGORA - 3 * DIA_MS).toISOString() },
];

// Ordenados por created_at decrescente (mais recente primeiro), igual ao
// fetch real — RecemAbertosPanel não reordena, só renderiza na ordem que recebe.
export const CHAMADOS_RECENTES_DEMO: {
  freshdesk_id: number;
  subject: string;
  created_at: string;
}[] = [
  { freshdesk_id: 10090, subject: "Solicitação de novo usuário no sistema", created_at: new Date(AGORA - 20 * MINUTO_MS).toISOString() },
  { freshdesk_id: 10091, subject: "Reset de senha do portal do aluno", created_at: new Date(AGORA - 45 * MINUTO_MS).toISOString() },
  { freshdesk_id: 10089, subject: "Mouse sem fio não pareia", created_at: new Date(AGORA - 1.2 * HORA_MS).toISOString() },
  { freshdesk_id: 10088, subject: "Acesso à pasta compartilhada", created_at: new Date(AGORA - 3.5 * HORA_MS).toISOString() },
  { freshdesk_id: 10087, subject: "Configurar e-mail em novo computador", created_at: new Date(AGORA - 8 * HORA_MS).toISOString() },
];

// urgente:true no primeiro evento é só o valor base — ehHojeOuAmanha() em
// events-panel.tsx já recalcula isso sozinho a partir de data_inicio, mas
// deixamos o valor coerente aqui também (é "amanhã", então já nasce urgente).
export const EVENTOS_DEMO: Evento[] = [
  {
    id: -1,
    titulo: "Reunião de alinhamento pedagógico",
    descricao: null,
    data_inicio: new Date(AGORA + 1 * DIA_MS).toISOString(),
    data_fim: null,
    local: "Sala de reuniões",
    categoria: "institucional",
    urgente: true,
    responsavel: "Coordenação Pedagógica",
    origem_externa_id: null,
  },
  {
    id: -2,
    titulo: "Manutenção preventiva dos servidores",
    descricao: null,
    data_inicio: new Date(AGORA + 4 * DIA_MS).toISOString(),
    data_fim: null,
    local: "Sala de TI",
    categoria: "institucional",
    urgente: false,
    responsavel: "Equipe de TI",
    origem_externa_id: null,
  },
  {
    id: -3,
    titulo: "Treinamento de uso do Sistema X",
    descricao: null,
    data_inicio: new Date(AGORA + 6 * DIA_MS).toISOString(),
    data_fim: null,
    local: "Auditório",
    categoria: "institucional",
    urgente: false,
    responsavel: "RH",
    origem_externa_id: null,
  },
];

export const SLA_RESPOSTA_DEMO = 82;

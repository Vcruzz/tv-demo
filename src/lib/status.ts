// Cores por status de chamado (STATUS_COR) e lista de status considerados
// abertos (STATUS_ABERTOS).
export const STATUS_COR: Record<string, string> = {
  "Aberto":             "#4f8ef7",
  "Pendente":           "#fbbf24",
  "Aguardando Cliente": "#a78bfa",
  "Aguardando Agente":  "#fb923c",
};

export const STATUS_ABERTOS = ["Aberto", "Pendente", "Aguardando Cliente", "Aguardando Agente"];

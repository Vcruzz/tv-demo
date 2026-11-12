# Central de Operações TI — demo

Painel de acompanhamento de chamados de TI pensado para rodar em uma TV, com ranking de agentes, backlog por status, chamados críticos, chamados recém-abertos (com alerta sonoro) e agenda de eventos.

Demo online: https://vcruzz.github.io/tv-demo/

Este repositório contém **somente** o frontend em modo demonstração. Todos os dados exibidos são fictícios (`src/lib/dados-demo.ts`) e nenhuma chamada a serviços externos é feita.

## Como o app funciona

SPA em Vite + React + TypeScript + Tailwind, sem roteador: o modo de exibição é decidido pelo `window.location.pathname` (ou pela variável de build `VITE_FORCE_DEMO`).

| Painel | Arquivo | O que mostra |
|---|---|---|
| Ranking | `ranking-panel.tsx` | Carga de chamados resolvidos por agente |
| Backlog | `backlog-panel.tsx` | Chamados abertos por status |
| Críticos | `chamados-criticos-panel.tsx` | Os chamados abertos mais antigos |
| Recém-abertos | `recem-abertos-panel.tsx` | Chamados novos sem agente; toca alerta sonoro quando chega um |
| Eventos | `events-panel.tsx` | Agenda com destaque de urgência (hoje/amanhã) e aviso sonoro de véspera |

O cabeçalho exibe relógio, data, humor do SLA de resposta e o indicador de última sincronização. Cada painel busca seus dados com `@tanstack/react-query`. No modo demo todas as buscas retornam dados fixos, com datas relativas ao momento do carregamento, e os sons ficam desativados.

Fora do modo demo o app lê as agregações de um backend Supabase (variáveis em `.env.example`) e oferece uma rota autenticada para editar eventos. Esse backend não faz parte deste repositório.

## Rodando localmente

```bash
npm install
VITE_FORCE_DEMO=true npm run dev
```

## Build para publicação

```bash
VITE_FORCE_DEMO=true VITE_BASE=/tv-demo/ npm run build
```

- `VITE_FORCE_DEMO=true` força o modo demo independentemente da URL.
- `VITE_BASE` define o caminho base de hospedagem (padrão `/tv/`). Para GitHub Pages, use `/<nome-do-repositório>/`.

O resultado fica em `dist/`.

// Detecta a rota de demonstração (/tv-demo) pelo mesmo mecanismo já usado
// pra /tv em main.tsx: comparação direta de pathname, sem roteador.
//
// VITE_FORCE_DEMO=true (build-time) força o modo demo incondicionalmente,
// independente do pathname — usado no build estático publicado à parte no
// GitHub Pages, cuja URL não é necessariamente "/tv-demo" (ex: hospedado na
// raiz de um domínio *.github.io dedicado só a essa demo).
export function estaNoModoDemo(): boolean {
  if (import.meta.env.VITE_FORCE_DEMO === "true") return true;
  return window.location.pathname === "/tv-demo";
}

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  // VITE_BASE override: usado pelo build estático da demo publicada à parte
  // no GitHub Pages (caminho de hospedagem diferente de /tv/). Sem a
  // variável, mantém o base fixo já usado por todo o deploy em produção.
  base: process.env.VITE_BASE || "/tv/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

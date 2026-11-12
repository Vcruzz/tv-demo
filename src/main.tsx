import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { OperationsDashboard } from "./components/operations-dashboard";
import { Toaster } from "@/components/ui/sonner";
import "./styles.css";
import { estaNoModoDemo } from "./lib/modo-demo";

const queryClient = new QueryClient();
const readOnly = window.location.pathname === "/tv" || estaNoModoDemo();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <OperationsDashboard readOnly={readOnly} />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);

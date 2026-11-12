import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { obterSessaoInicial, assinarMudancaDeSessao } from "@/lib/auth";

export function useAuthSession(): { session: Session | null; carregando: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    obterSessaoInicial().then((s) => {
      setSession(s);
      setCarregando(false);
    });
    return assinarMudancaDeSessao(setSession);
  }, []);

  return { session, carregando };
}

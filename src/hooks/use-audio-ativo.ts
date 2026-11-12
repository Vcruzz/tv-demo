import { useEffect, useState } from "react";

import { audioEstaAtivo, onAudioAtivoChange } from "@/lib/alerta-sonoro";

export function useAudioAtivo(): boolean {
  const [ativo, setAtivo] = useState(audioEstaAtivo());
  useEffect(() => onAudioAtivoChange(setAtivo), []);
  return ativo;
}

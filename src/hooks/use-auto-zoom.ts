import { useEffect } from "react";

export function useAutoZoom(compact: boolean, zoomMultiplier: number) {
  useEffect(() => {
    if (compact) return;

    function aplicarAutoZoom() {
      const fator = Math.min(1, window.innerWidth / 1920, window.innerHeight / 1080) * zoomMultiplier;
      document.body.style.zoom = String(fator);
      document.body.style.width = `${window.innerWidth / fator}px`;
      document.body.style.height = `${window.innerHeight / fator}px`;
    }

    aplicarAutoZoom();

    let timer: number | undefined;
    function onResize() {
      window.clearTimeout(timer);
      timer = window.setTimeout(aplicarAutoZoom, 200);
    }
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      document.body.style.zoom = "";
      document.body.style.width = "";
      document.body.style.height = "";
    };
  }, [compact, zoomMultiplier]);
}

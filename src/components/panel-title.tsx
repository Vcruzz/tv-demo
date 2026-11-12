export function PanelTitle({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <h2
      className={`font-display text-[1rem] font-bold uppercase tracking-[0.16em] ${
        accent ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {children}
    </h2>
  );
}

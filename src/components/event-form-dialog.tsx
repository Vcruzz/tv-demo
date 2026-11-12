import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Evento } from "@/components/events-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIAS = [
  { value: "institucional", label: "Institucional" },
  { value: "pedagogico", label: "Pedagógico" },
  { value: "manutencao", label: "Manutenção" },
  { value: "feriado", label: "Feriado" },
] as const;

const eventoFormSchema = z
  .object({
    titulo: z.string().min(1, "Título é obrigatório").max(200),
    descricao: z.string().max(1000).optional(),
    dataInicio: z.string().min(1, "Data de início é obrigatória"),
    dataFim: z.string().optional(),
    local: z.string().optional(),
    responsavel: z.string().optional(),
    categoria: z.enum(["institucional", "pedagogico", "manutencao", "feriado"]),
    urgente: z.boolean(),
  })
  .refine(
    (data) =>
      !data.dataInicio ||
      !data.dataFim ||
      new Date(data.dataFim) >= new Date(data.dataInicio),
    {
      message: "Data de fim deve ser igual ou depois do início",
      path: ["dataFim"],
    },
  );

type EventoFormValues = z.infer<typeof eventoFormSchema>;

function toDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  // datetime-local espera "AAAA-MM-DDTHH:mm" sem timezone
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultValues(evento?: Evento | null): EventoFormValues {
  return {
    titulo: evento?.titulo ?? "",
    descricao: evento?.descricao ?? "",
    dataInicio: toDateTimeLocal(evento?.data_inicio ?? null),
    dataFim: toDateTimeLocal(evento?.data_fim ?? null),
    local: evento?.local ?? "",
    responsavel: evento?.responsavel ?? "",
    categoria: (evento?.categoria as EventoFormValues["categoria"]) ?? "institucional",
    urgente: evento?.urgente ?? false,
  };
}

export function EventFormDialog({
  open,
  onOpenChange,
  evento,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evento?: Evento | null;
}) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(evento);

  const form = useForm<EventoFormValues>({
    resolver: zodResolver(eventoFormSchema),
    defaultValues: defaultValues(evento),
  });

  const { reset } = form;
  useEffect(() => {
    if (open) reset(defaultValues(evento));
  }, [open, evento, reset]);

  async function onSubmit(values: EventoFormValues) {
    if (!isSupabaseConfigured() || !supabase) {
      toast.error("Configuração do Supabase ausente ou inválida.");
      return;
    }

    const payload = {
      p_titulo: values.titulo,
      p_descricao: values.descricao || null,
      p_data_inicio: new Date(values.dataInicio).toISOString(),
      p_data_fim: values.dataFim ? new Date(values.dataFim).toISOString() : null,
      p_local: values.local || null,
      p_responsavel: values.responsavel || null,
      p_categoria: values.categoria,
      p_urgente: values.urgente,
      p_publico_alvo: null,
    };

    const { data, error } = isEditing
      ? await supabase.rpc("editar_evento", { ...payload, p_id: evento!.id })
      : await supabase.rpc("criar_evento", payload);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Evento salvo.");
    queryClient.invalidateQueries({ queryKey: ["eventos"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar evento" : "Novo evento"}</DialogTitle>
          <DialogDescription>Preencha os campos do evento.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataFim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fim (opcional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIAS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="local"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="responsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urgente"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel className="!mt-0">Marcar como urgente</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

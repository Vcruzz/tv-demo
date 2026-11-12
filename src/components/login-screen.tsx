import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { entrar } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const [erro, setErro] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", senha: "" },
  });

  async function onSubmit(values: LoginValues) {
    setErro(null);
    const { erro: erroLogin } = await entrar(values.email, values.senha);
    if (erroLogin) setErro(erroLogin);
    // Sucesso: assinarMudancaDeSessao (no hook) atualiza a sessão sozinho,
    // o componente pai troca a tela automaticamente — nada a fazer aqui.
  }

  return (
    <div className="flex h-full items-center justify-center bg-background font-body text-foreground">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8">
        <h1 className="font-display text-xl font-bold uppercase">Central de Operações TI</h1>
        <p className="mt-1 text-[0.875rem] text-muted-foreground">Entre para editar eventos.</p>

        {erro && (
          <p className="mt-4 rounded bg-destructive/15 px-3 py-2 text-[0.875rem] text-destructive">{erro}</p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              Entrar
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

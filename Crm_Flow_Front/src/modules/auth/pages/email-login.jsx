import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EmailLogin() {
  function handleSubmit(event) {
    event.preventDefault();
  }

  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-muted/40 px-4 py-10">
      <div
        className="absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-28 -right-20 size-80 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />

      <Card className="relative w-full max-w-md gap-0 py-0 shadow-xl shadow-black/5">
        <CardHeader className="gap-0 px-6 pb-0 pt-8 sm:px-8">
          <div
            className="mb-8 flex items-center gap-2.5 font-semibold"
            aria-label="Flow CRM"
          >
            <span
              className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm"
              aria-hidden="true"
            >
              F
            </span>
            <span>Flow CRM</span>
          </div>

          <CardTitle
            id="login-title"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Bem-vindo de volta
          </CardTitle>
          <CardDescription className="mt-2 leading-relaxed">
            Informe seu e-mail para continuar.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 py-8 sm:px-8">
          <form className="grid gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                className="h-10"
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                required
              />
            </div>

            <Button className="h-10 w-full" type="submit">
              Continuar
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center px-6 py-4 text-center text-sm text-muted-foreground sm:px-8">
          <span>Ainda não tem uma conta?</span>
          <Button className="h-auto px-1.5 py-0" type="button" variant="link">
            Fale com o administrador
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

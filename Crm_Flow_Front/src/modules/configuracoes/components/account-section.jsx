import { UserRound } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function AccountSection({ nome, email, role }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-4" aria-hidden="true" />
          Conta
        </CardTitle>
        <CardDescription>Dados vinculados ao seu acesso.</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Nome</span>
          <span className="font-medium text-foreground">{nome}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">E-mail</span>
          <span className="font-medium text-foreground">{email}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Perfil</span>
          <span className="font-mono text-xs font-medium text-foreground">
            {role}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

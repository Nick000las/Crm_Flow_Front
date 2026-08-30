/**
 * @file Renderiza account section, na área de configurações, expondo os estados e eventos
 * necessários à interface.
 */
import { UserRound } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AccountSection({ nome, email, role }) {
  return (
    <Card data-tour="settings-account">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-4" aria-hidden="true" />
          Conta
        </CardTitle>
        <CardDescription>Dados vinculados ao seu acesso.</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-3 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
          <span className="text-muted-foreground">Nome</span>
          <span className="min-w-0 break-all font-medium text-foreground">{nome}</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
          <span className="text-muted-foreground">E-mail</span>
          <span className="min-w-0 break-all font-medium text-foreground">{email}</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
          <span className="text-muted-foreground">Perfil</span>
          <span className="text-xs min-w-0 break-all font-medium text-foreground">{role}</span>
        </div>
      </CardContent>
    </Card>
  );
}

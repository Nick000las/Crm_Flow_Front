/**
 * @file Implementa a integração de install app section, na área de aplicação, mantendo seus
 * recursos e contratos compartilhados.
 */
import { useState } from 'react';
import { CheckCircle2, Download, Smartphone } from 'lucide-react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { pwaStore } from './pwa-store';
import { usePwa } from './use-pwa';

export function InstallAppSection() {
  const { installed, installAvailable } = usePwa();
  const [showHelp, setShowHelp] = useState(false);
  const [installing, setInstalling] = useState(false);

  async function install() {
    if (!installAvailable) {
      setShowHelp(true);

      return;
    }

    setInstalling(true);

    try {
      await pwaStore.install();
    } finally {
      setInstalling(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone aria-hidden="true" className="size-4" />
          Aplicativo no celular
        </CardTitle>
        <CardDescription>
          Abra o Flow CRM pela tela inicial, com uma janela própria e acesso rápido à sua operação.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {installed ? (
          <p className="flex items-center gap-2 text-sm">
            <CheckCircle2 aria-hidden="true" className="size-4 text-success" />
            Você está usando o aplicativo instalado.
          </p>
        ) : (
          <Button
            className="w-fit max-w-full"
            variant="outline"
            onClick={install}
            loading={installing}
            loadingText="Abrindo instalação…"
          >
            <Download aria-hidden="true" />
            {installAvailable ? 'Instalar aplicativo' : 'Como instalar'}
          </Button>
        )}
        {showHelp && (
          <Alert>
            <p>
              No Android, abra o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à
              tela inicial”. No iPhone ou iPad, abra no Safari e use Compartilhar → Adicionar à Tela
              de Início.
            </p>
          </Alert>
        )}
        <p className="text-xs text-muted-foreground">
          A conexão com a internet é necessária para consultar dados atualizados e salvar
          alterações.
        </p>
      </CardContent>
    </Card>
  );
}

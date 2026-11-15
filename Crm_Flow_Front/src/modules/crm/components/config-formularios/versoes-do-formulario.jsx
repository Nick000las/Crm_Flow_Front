import { Eye } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatarInstante } from '../../lib/formatadores';
import { PreviaVersaoDialog } from './previa-versao-dialog';

/**
 * Versões publicadas, da mais nova para a mais antiga. Cada uma é imutável:
 * a prévia mostra o formulário como o link vai mostrar.
 *
 * @param {{
 *   formulario: import('../../lib/formularios').DetalheDoFormulario,
 *   nomePorId: Map<string, string>,
 * }} props
 */
export function VersoesDoFormulario({ formulario, nomePorId }) {
  const [aberta, setAberta] = useState(null);

  return (
    <section aria-labelledby="formulario-versoes-titulo" className="grid gap-2">
      <h3 className="text-sm font-semibold" id="formulario-versoes-titulo">
        Versões publicadas
      </h3>
      {formulario.versoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma ainda. Publicar grava uma versão nova; as anteriores não mudam.
        </p>
      ) : (
        <ul className="grid border border-border">
          {formulario.versoes.map((versao) => (
            <li
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 text-sm last:border-b-0"
              key={versao.id}
            >
              <span>
                <span className="font-mono tabular-nums">v{versao.versao}</span>
                <span className="ml-3 font-mono text-xs text-muted-foreground tabular-nums">
                  {formatarInstante(versao.publicadaEm)}
                </span>
                {versao.publicadaPor && (
                  <span className="ml-3 text-xs text-muted-foreground">
                    por {nomePorId.get(versao.publicadaPor) ?? 'Usuário removido'}
                  </span>
                )}
                {versao.id === formulario.versaoAtual?.id && (
                  <span className="ml-3 text-xs">atual</span>
                )}
              </span>
              <Button
                className="rounded-none"
                onClick={() => setAberta(versao)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <Eye aria-hidden="true" />
                Pré-visualizar
                <span className="sr-only"> a versão {versao.versao}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      <PreviaVersaoDialog
        formularioId={formulario.id}
        onFechar={() => setAberta(null)}
        versao={aberta}
      />
    </section>
  );
}

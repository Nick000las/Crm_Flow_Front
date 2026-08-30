/**
 * @file O filtro (uma view salva por outra pessoa, um link) usa um campo oculto para este
 * usuário (permissão por campo): o back dá 400. Em vez do erro genérico, explica e oferece
 * tirar só esses itens.
 */
import { EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * O filtro (uma view salva por outra pessoa, um link) usa um campo oculto
 * para este usuário (permissão por campo): o back dá 400. Em vez do erro
 * genérico, explica e oferece tirar só esses itens.
 *
 * @param {{ onTirar: () => void }} props
 */
export function FiltroComCampoOculto({ onTirar }) {
  return (
    <div
      className="flex flex-wrap items-center gap-3 border border-border px-4 py-3 text-sm"
      role="alert"
    >
      <EyeOff aria-hidden="true" className="size-4 text-muted-foreground" />
      <p className="flex-1">Este filtro usa um campo que você não pode ver.</p>
      <Button onClick={onTirar} size="sm" variant="outline">
        Tirar este filtro
      </Button>
    </div>
  );
}

import { Info } from 'lucide-react';
import { avisoDoCampoDesligado } from '../../lib/forecast-textos';

/**
 * Aviso de `camposDesligados`: não bloqueia a página, os números continuam.
 *
 * @param {{ chaves: string[], ehGestao: boolean }} props
 */
export function AvisoCamposDesligados({ chaves, ehGestao }) {
  const textos = (chaves ?? [])
    .map((chave) => ({ chave, texto: avisoDoCampoDesligado(chave, ehGestao) }))
    .filter((aviso) => aviso.texto);

  if (textos.length === 0) {
    return null;
  }

  return (
    <div
      className="flex gap-3 rounded-lg border border-border bg-surface p-3 text-sm"
      role="status"
    >
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <ul className="grid gap-1">
        {textos.map((aviso) => (
          <li key={aviso.chave}>{aviso.texto}</li>
        ))}
      </ul>
    </div>
  );
}

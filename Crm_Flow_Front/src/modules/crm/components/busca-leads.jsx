import { Search } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { BUSCA_DEBOUNCE_MS } from '../constants';

/**
 * Campo de busca com debounce. O texto digitado é local; a URL só muda
 * depois da pausa. Se a URL mudar por fora (voltar no navegador), o campo
 * acompanha.
 *
 * @param {{ busca: string, onBuscaChange: (busca: string) => void, placeholder: string }} props
 */
export function BuscaLeads({ busca, onBuscaChange, placeholder }) {
  const [texto, setTexto] = useState(busca);
  const [buscaAnterior, setBuscaAnterior] = useState(busca);
  const buscarComAtraso = useDebouncedCallback(onBuscaChange, BUSCA_DEBOUNCE_MS);

  if (busca !== buscaAnterior) {
    setBuscaAnterior(busca);
    setTexto(busca);
  }

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        aria-label="Buscar leads"
        className="h-9 rounded-none pl-8"
        onChange={(event) => {
          setTexto(event.target.value);
          buscarComAtraso(event.target.value);
        }}
        placeholder={placeholder}
        type="search"
        value={texto}
      />
    </div>
  );
}

/**
 * @file Campo de busca com debounce. O texto digitado é local; a URL só muda depois da pausa.
 * Se a URL mudar por fora (voltar no navegador), o campo acompanha.
 */
import { useState } from 'react';
import { Search } from 'lucide-react';

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
      <Input
        startIcon={Search}
        aria-label="Buscar leads"

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

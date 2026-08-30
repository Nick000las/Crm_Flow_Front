import { Search, UserRound, X } from 'lucide-react';
import { useId, useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useBuscaPessoas } from '../hooks/use-busca-pessoas';
import { contatoDaPessoa } from '../lib/vinculo';

const ESPERA_DA_BUSCA_MS = 300;

/** Nome da pessoa, ou "Registro restrito" sem link. A ficha abre em nova aba: o rascunho fica. */
function PessoaVinculada({ vinculo }) {
  if (vinculo.restrito) {
    return (
      <p className="space-y-1 rounded-lg border border-border bg-card p-3 text-sm">
        Registro restrito
      </p>
    );
  }

  return (
    <div className="space-y-1 rounded-lg border border-border bg-card p-3 text-sm">
      <a
        className="font-medium underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        href={vinculo.rotaFicha}
        rel="noopener"
        target="_blank"
      >
        {vinculo.titulo}
        <span className="sr-only"> (abre em nova aba)</span>
      </a>
      {vinculo.subtitulo && <p className="text-xs text-muted-foreground">{vinculo.subtitulo}</p>}
    </div>
  );
}

function BuscaDePessoa({ disabled, onLink }) {
  const id = useId();
  const [texto, setTexto] = useState('');
  const [termo, setTermo] = useState('');
  const buscarComAtraso = useDebouncedCallback(setTermo, ESPERA_DA_BUSCA_MS);
  const busca = useBuscaPessoas(termo);
  const pessoas = busca.data?.itens ?? [];
  const procurou = busca.isSuccess && !busca.isPlaceholderData;

  return (
    <div className="grid gap-2">
      <label className="sr-only" htmlFor={id}>
        Buscar pessoa no CRM
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          className="pl-9"
          id={id}
          disabled={disabled}
          onChange={(event) => {
            setTexto(event.target.value);
            buscarComAtraso(event.target.value);
          }}
          placeholder="Buscar pessoa no CRM…"
          type="search"
          value={texto}
        />
      </div>
      {busca.isFetching && <LoadingState inline label="Buscando pessoas…" />}
      <ApiErrorAlert error={busca.error} id={`${id}-erro`} />
      {procurou && pessoas.length === 0 && (
        <p className="text-xs text-muted-foreground" role="status">
          Nenhuma pessoa encontrada.
        </p>
      )}
      {pessoas.length > 0 && (
        <ul className="max-h-48 overflow-y-auto rounded-lg border border-border bg-card">
          {pessoas.map((pessoa) => (
            <li key={pessoa.id}>
              <Button
                className="h-auto w-full flex-col items-start gap-0.5 whitespace-normal px-3 py-2 text-left"
                disabled={disabled}
                onClick={() => onLink(pessoa.id)}
                type="button"
                variant="ghost"
              >
                <span className="font-medium">{pessoa.nome}</span>
                <span className="text-xs text-muted-foreground">{contatoDaPessoa(pessoa)}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Pessoa do CRM ligada ao card. Fica fora do form do card e vale na hora,
 * sem "Salvar": o vínculo não entra no rascunho.
 *
 * @param {{
 *   vinculo: { restrito?: boolean, titulo?: string, subtitulo?: string, rotaFicha?: string } | null | undefined,
 *   canLink: boolean,
 *   disabled: boolean,
 *   onLink: (entidadeId: string) => void,
 *   onUnlink: () => void,
 * }} props `vinculo` não vem com a flag desligada
 */
export function CardVinculo({ vinculo, canLink, disabled, onLink, onUnlink }) {
  const tituloId = useId();
  if (!vinculo && !canLink) {
    return null;
  }

  return (
    <section className="grid gap-3" aria-labelledby={tituloId}>
      <h3 className="flex items-center gap-2 text-sm font-semibold" id={tituloId}>
        <UserRound size={17} aria-hidden="true" /> Pessoa
      </h3>
      {vinculo && <PessoaVinculada vinculo={vinculo} />}
      {vinculo && canLink && (
        <Button
          className="w-fit"
          disabled={disabled}
          onClick={onUnlink}
          type="button"
          variant="destructive"
          size="sm"
        >
          <X size={14} aria-hidden="true" /> Remover vínculo
        </Button>
      )}
      {!vinculo && canLink && <BuscaDePessoa disabled={disabled} onLink={onLink} />}
    </section>
  );
}

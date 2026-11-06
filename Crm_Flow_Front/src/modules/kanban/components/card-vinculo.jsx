import { Search, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useBuscaPessoas } from '../hooks/use-busca-pessoas';
import { contatoDaPessoa } from '../lib/vinculo';

const ESPERA_DA_BUSCA_MS = 300;

/** Nome da pessoa, ou "Registro restrito" sem link. A ficha abre em nova aba: o rascunho fica. */
function PessoaVinculada({ vinculo }) {
  if (vinculo.restrito) {
    return <p className="kb-link-person">Registro restrito</p>;
  }

  return (
    <div className="kb-link-person">
      <a href={vinculo.rotaFicha} rel="noopener" target="_blank">
        {vinculo.titulo}
        <span className="sr-only"> (abre em nova aba)</span>
      </a>
      {vinculo.subtitulo && <p className="kb-hint">{vinculo.subtitulo}</p>}
    </div>
  );
}

function BuscaDePessoa({ disabled, onLink }) {
  const [texto, setTexto] = useState('');
  const [termo, setTermo] = useState('');
  const buscarComAtraso = useDebouncedCallback(setTermo, ESPERA_DA_BUSCA_MS);
  const busca = useBuscaPessoas(termo);
  const pessoas = busca.data?.itens ?? [];
  const procurou = busca.isSuccess && !busca.isPlaceholderData;

  return (
    <div className="kb-link-search">
      <label>
        <span className="sr-only">Buscar pessoa no CRM</span>
        <Search size={15} aria-hidden="true" />
        <input
          disabled={disabled}
          onChange={(event) => {
            setTexto(event.target.value);
            buscarComAtraso(event.target.value);
          }}
          placeholder="Buscar pessoa no CRM…"
          type="search"
          value={texto}
        />
      </label>
      {busca.error && (
        <p className="kb-error" role="alert">
          {busca.error.message}
        </p>
      )}
      {procurou && pessoas.length === 0 && (
        <p className="kb-hint" role="status">
          Nenhuma pessoa encontrada.
        </p>
      )}
      {pessoas.length > 0 && (
        <ul>
          {pessoas.map((pessoa) => (
            <li key={pessoa.id}>
              <button disabled={disabled} onClick={() => onLink(pessoa.id)} type="button">
                <strong>{pessoa.nome}</strong>
                <span>{contatoDaPessoa(pessoa)}</span>
              </button>
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
  if (!vinculo && !canLink) {
    return null;
  }

  return (
    <section className="kb-link" aria-labelledby="kb-link-title">
      <h3 id="kb-link-title">
        <UserRound size={17} aria-hidden="true" /> Pessoa
      </h3>
      {vinculo && <PessoaVinculada vinculo={vinculo} />}
      {vinculo && canLink && (
        <button className="kb-link-remove" disabled={disabled} onClick={onUnlink} type="button">
          <X size={14} aria-hidden="true" /> Remover vínculo
        </button>
      )}
      {!vinculo && canLink && <BuscaDePessoa disabled={disabled} onLink={onLink} />}
    </section>
  );
}

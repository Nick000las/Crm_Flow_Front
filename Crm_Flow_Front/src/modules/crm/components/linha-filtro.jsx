import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROTULOS_OPERADOR, operadoresDoCampo, trocarCampo, trocarOperador } from '../lib/filtro';
import { SelectSimples } from './select-simples';
import { ValorDoFiltro } from './valor-do-filtro';

/**
 * Uma linha do construtor: `[Campo ▾] [Operador ▾] [Valor] ✕`.
 *
 * @param {{
 *   linha: import('../lib/filtro').LinhaFiltro,
 *   campos: import('../types').Campo[],
 *   erro?: string,
 *   erroDoServidor?: boolean,
 *   onChange: (linha: import('../lib/filtro').LinhaFiltro) => void,
 *   onRemover: () => void,
 * }} props
 */
export function LinhaFiltro({ linha, campos, erro, erroDoServidor = false, onChange, onRemover }) {
  const campo = campos.find((atual) => atual.chave === linha.chave);
  if (!campo) {
    return null;
  }

  const erroId = `${linha.id}-erro`;
  const invalido = Boolean(erro) || erroDoServidor;
  const opcoesCampo = campos.map((atual) => ({ valor: atual.chave, rotulo: atual.label }));
  const opcoesOperador = operadoresDoCampo(campo).map((operador) => ({
    valor: operador,
    rotulo: ROTULOS_OPERADOR[operador],
  }));

  return (
    <li
      className={cn(
        'grid gap-2 border border-border p-2 sm:grid-cols-[10rem_8rem_minmax(0,1fr)_auto] sm:items-start',
        invalido && 'border-destructive/60',
      )}
    >
      <SelectSimples
        aria-label="Campo"
        onChange={(chave) =>
          onChange(
            trocarCampo(
              linha,
              campos.find((atual) => atual.chave === chave),
            ),
          )
        }
        opcoes={opcoesCampo}
        value={linha.chave}
      />
      <SelectSimples
        aria-label={`Operador de ${campo.label}`}
        onChange={(operador) => onChange(trocarOperador(linha, operador, campo))}
        opcoes={opcoesOperador}
        value={linha.operador}
      />
      <div className="min-w-0">
        <ValorDoFiltro
          campo={campo}
          controle={{
            id: `${linha.id}-valor`,
            'aria-invalid': invalido || undefined,
            'aria-describedby': erro ? erroId : undefined,
          }}
          onChange={(valor) => onChange({ ...linha, valor })}
          operador={linha.operador}
          rotulo={campo.label}
          value={linha.valor}
        />
        {erro && (
          <p className="mt-1 text-xs text-destructive" id={erroId}>
            {erro}
          </p>
        )}
      </div>
      <Button
        aria-label={`Remover filtro de ${campo.label}`}
        className="rounded-none"
        onClick={onRemover}
        size="icon"
        type="button"
        variant="ghost"
      >
        <X aria-hidden="true" />
      </Button>
    </li>
  );
}

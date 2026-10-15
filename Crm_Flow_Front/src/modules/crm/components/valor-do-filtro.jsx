import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TIPOS_CAMPO } from '../constants';
import { OPERADOR, operadorSemValor } from '../lib/filtro';
import { rotuloOpcao } from '../lib/rotulos';
import { SelectSimples } from './select-simples';
import { TagsInput } from './tags-input';

const INPUT_CLASS = 'h-9 rounded-none';
const OPCOES_BOOLEANO = Object.freeze([
  { valor: 'true', rotulo: 'Sim' },
  { valor: 'false', rotulo: 'Não' },
]);

function temOpcoes(campo) {
  return Array.isArray(campo.opcoes) && campo.opcoes.length > 0;
}

/** Input de texto/número/data conforme o tipo do campo. */
function InputDoTipo({ campo, value, onChange, ...controle }) {
  const numerico = campo.tipo === TIPOS_CAMPO.NUMERO;
  const data = campo.tipo === TIPOS_CAMPO.DATA;

  return (
    <Input
      {...controle}
      className={cn(INPUT_CLASS, (numerico || data) && 'font-mono tabular-nums')}
      inputMode={numerico ? 'decimal' : undefined}
      onChange={(event) => onChange(event.target.value)}
      type={data ? 'date' : 'text'}
      value={value}
    />
  );
}

function Faixa({ campo, value, onChange, rotulo, controle }) {
  const alterar = (limite) => (texto) => onChange({ ...value, [limite]: texto });

  return (
    <div className="grid grid-cols-2 gap-2">
      <InputDoTipo
        {...controle}
        aria-label={`${rotulo}: de`}
        campo={campo}
        onChange={alterar('de')}
        placeholder="de"
        value={value.de}
      />
      <InputDoTipo
        aria-describedby={controle['aria-describedby']}
        aria-invalid={controle['aria-invalid']}
        aria-label={`${rotulo}: até`}
        campo={campo}
        onChange={alterar('ate')}
        placeholder="até"
        value={value.ate}
      />
    </div>
  );
}

function ListaDeOpcoes({ campo, value, onChange, controle }) {
  return (
    <div
      aria-describedby={controle['aria-describedby']}
      aria-label={controle['aria-label']}
      className="grid max-h-40 gap-2 overflow-y-auto"
      role="group"
    >
      {campo.opcoes.map((opcao) => {
        const opcaoId = `${controle.id}-${opcao}`;
        const marcada = value.includes(opcao);

        return (
          <label className="flex items-center gap-2 text-sm" htmlFor={opcaoId} key={opcao}>
            <Checkbox
              checked={marcada}
              id={opcaoId}
              onCheckedChange={(proximo) =>
                onChange(proximo ? [...value, opcao] : value.filter((atual) => atual !== opcao))
              }
            />
            {rotuloOpcao(opcao, campo)}
          </label>
        );
      })}
    </div>
  );
}

/**
 * Valor de uma linha de filtro: o controle muda com o operador.
 * `entre` → de/até; `e_um_dos` → checkboxes (ou tags livres);
 * `vazio`/`nao_vazio` → nada.
 *
 * @param {{
 *   campo: import('../types').Campo,
 *   operador: string,
 *   value: unknown,
 *   onChange: (valor: unknown) => void,
 *   rotulo: string,
 *   controle: { id: string, 'aria-invalid'?: boolean, 'aria-describedby'?: string },
 * }} props
 */
export function ValorDoFiltro({ campo, operador, value, onChange, rotulo, controle }) {
  if (operadorSemValor(operador)) return null;

  const props = { campo, value, onChange, controle: { ...controle, 'aria-label': `Valor de ${rotulo}` } };

  if (operador === OPERADOR.ENTRE) return <Faixa {...props} rotulo={rotulo} />;

  if (operador === OPERADOR.E_UM_DOS) {
    return temOpcoes(campo) ? (
      <ListaDeOpcoes {...props} />
    ) : (
      <TagsInput {...props.controle} onChange={onChange} value={value} />
    );
  }

  if (campo.tipo === TIPOS_CAMPO.BOOLEANO) {
    return <SelectSimples {...props.controle} onChange={onChange} opcoes={OPCOES_BOOLEANO} value={value} />;
  }

  if (temOpcoes(campo)) {
    const opcoes = campo.opcoes.map((opcao) => ({ valor: opcao, rotulo: rotuloOpcao(opcao, campo) }));
    return <SelectSimples {...props.controle} onChange={onChange} opcoes={opcoes} value={value} />;
  }

  return <InputDoTipo {...props.controle} campo={campo} onChange={onChange} value={value} />;
}

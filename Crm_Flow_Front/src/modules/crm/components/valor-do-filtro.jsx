import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TIPOS_CAMPO } from '../constants';
import { useUsuarios } from '../hooks/use-usuarios';
import { OPERADOR, operadorSemValor, tipoBase } from '../lib/filtro';
import { opcoesDoFiltro } from '../lib/opcoes';
import { SelectSimples } from './select-simples';
import { TagsInput } from './tags-input';

const INPUT_CLASS = 'h-9 rounded-none';
const OPCOES_BOOLEANO = Object.freeze([
  { valor: 'true', rotulo: 'Sim' },
  { valor: 'false', rotulo: 'Não' },
]);

/** Input de texto/número/data/hora conforme o tipo do campo. */
function InputDoTipo({ campo, value, onChange, ...controle }) {
  const base = tipoBase(campo.tipo);
  const numerico = base === TIPOS_CAMPO.NUMERO;
  const data = base === TIPOS_CAMPO.DATA;
  const hora = base === TIPOS_CAMPO.HORA;

  return (
    <Input
      {...controle}
      className={cn(INPUT_CLASS, (numerico || data || hora) && 'font-mono tabular-nums')}
      inputMode={numerico ? 'decimal' : undefined}
      onChange={(event) => onChange(event.target.value)}
      type={data ? 'date' : hora ? 'time' : 'text'}
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

function ListaDeOpcoes({ opcoes, value, onChange, controle }) {
  return (
    <div
      aria-describedby={controle['aria-describedby']}
      aria-label={controle['aria-label']}
      className="grid max-h-40 gap-2 overflow-y-auto"
      role="group"
    >
      {opcoes.map(({ valor, rotulo }) => {
        const opcaoId = `${controle.id}-${valor}`;
        const marcada = value.includes(valor);

        return (
          <label className="flex items-center gap-2 text-sm" htmlFor={opcaoId} key={valor}>
            <Checkbox
              checked={marcada}
              id={opcaoId}
              onCheckedChange={(proximo) =>
                onChange(proximo ? [...value, valor] : value.filter((atual) => atual !== valor))
              }
            />
            {rotulo}
          </label>
        );
      })}
    </div>
  );
}

/** Campo de usuário (M11): as opções são os usuários do tenant. */
function ValorUsuario({ operador, value, onChange, controle }) {
  const { usuarios } = useUsuarios();
  const opcoes = usuarios.map((usuario) => ({ valor: usuario.id, rotulo: usuario.nome }));

  if (operador === OPERADOR.E_UM_DOS) {
    return <ListaDeOpcoes controle={controle} onChange={onChange} opcoes={opcoes} value={value} />;
  }
  return <SelectSimples {...controle} onChange={onChange} opcoes={opcoes} value={value} />;
}

/**
 * Valor de uma linha de filtro: o controle muda com o operador.
 * `entre` → de/até; `e_um_dos` → checkboxes (ou tags livres);
 * `vazio`/`nao_vazio` → nada. Campo de lista oferece todas as opções,
 * inclusive inativas, e filtra pela key (tags inclusive).
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
  if (operadorSemValor(operador)) {
    return null;
  }

  const props = {
    campo,
    value,
    onChange,
    controle: { ...controle, 'aria-label': `Valor de ${rotulo}` },
  };
  const opcoes = opcoesDoFiltro(campo);

  if (operador === OPERADOR.ENTRE) {
    return <Faixa {...props} rotulo={rotulo} />;
  }

  if (campo.tipo === TIPOS_CAMPO.USUARIO) {
    return <ValorUsuario {...props} operador={operador} />;
  }

  if (operador === OPERADOR.E_UM_DOS) {
    return opcoes.length > 0 ? (
      <ListaDeOpcoes {...props} opcoes={opcoes} />
    ) : (
      <TagsInput {...props.controle} onChange={onChange} value={value} />
    );
  }

  if (campo.tipo === TIPOS_CAMPO.BOOLEANO) {
    return (
      <SelectSimples
        {...props.controle}
        onChange={onChange}
        opcoes={OPCOES_BOOLEANO}
        value={value}
      />
    );
  }

  if (opcoes.length > 0) {
    return <SelectSimples {...props.controle} onChange={onChange} opcoes={opcoes} value={value} />;
  }

  return <InputDoTipo {...props.controle} campo={campo} onChange={onChange} value={value} />;
}

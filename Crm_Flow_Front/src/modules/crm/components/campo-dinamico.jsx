import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { TIPOS_CAMPO } from '../constants';
import { AJUDA_POR_CHAVE } from '../lib/form-lead';
import { opcoesDoSeletor, rotuloOpcao, sugestoesDoCampo } from '../lib/opcoes';
import { CampoForm } from './campo-form';
import {
  CampoMonetario,
  CampoTelefone,
  CampoTexto,
  CampoTextoLongo,
  INPUT_CLASS,
} from './campos-texto';
import { SelectSimples } from './select-simples';
import { TagsInput } from './tags-input';

function CampoNumero({ value, onChange, controle }) {
  return (
    <Input
      {...controle}
      className={cn(INPUT_CLASS, 'font-mono tabular-nums')}
      inputMode="decimal"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  );
}

function CampoData({ value, onChange, controle }) {
  return (
    <Input
      {...controle}
      className={cn(INPUT_CLASS, 'font-mono')}
      onChange={(event) => onChange(event.target.value)}
      type="date"
      value={value}
    />
  );
}

function CampoBooleano({ value, onChange, controle }) {
  return <Switch {...controle} checked={value === true} onCheckedChange={onChange} />;
}

function CampoSelecao({ campo, value, onChange, controle }) {
  // Ativas da lista do tenant, mais a inativa que o lead já tem (se tiver).
  const opcoes = opcoesDoSeletor(campo, value);

  return (
    <SelectSimples
      {...controle}
      onChange={onChange}
      opcoes={opcoes}
      // Sem obrigatoriedade, dá para voltar ao vazio.
      vazio={campo.obrigatorio ? undefined : 'Nenhum'}
      value={value}
    />
  );
}

function CampoOpcoesMultiplas({ campo, value, onChange, controle }) {
  function alternar(opcao, marcada) {
    onChange(marcada ? [...value, opcao] : value.filter((atual) => atual !== opcao));
  }

  return (
    <div className="grid gap-2">
      {campo.opcoes.map((opcao) => {
        const opcaoId = `${controle.id}-${opcao}`;

        return (
          <label className="flex items-center gap-2 text-sm" htmlFor={opcaoId} key={opcao}>
            <Checkbox
              checked={value.includes(opcao)}
              id={opcaoId}
              onCheckedChange={(marcada) => alternar(opcao, marcada)}
            />
            {rotuloOpcao(opcao, campo)}
          </label>
        );
      })}
    </div>
  );
}

/** Tags: entrada livre por nome, com as tags ativas do tenant como sugestão. */
function CampoTags({ campo, value, onChange, controle }) {
  return <TagsInput {...controle} onChange={onChange} sugestoes={sugestoesDoCampo(campo)} value={value} />;
}

const CONTROLE_POR_TIPO = Object.freeze({
  [TIPOS_CAMPO.TEXTO]: CampoTexto,
  [TIPOS_CAMPO.NUMERO]: CampoNumero,
  [TIPOS_CAMPO.DATA]: CampoData,
  [TIPOS_CAMPO.BOOLEANO]: CampoBooleano,
  [TIPOS_CAMPO.SELECAO]: CampoSelecao,
  [TIPOS_CAMPO.TEXTO_LONGO]: CampoTextoLongo,
  [TIPOS_CAMPO.MONETARIO]: CampoMonetario,
  [TIPOS_CAMPO.TELEFONE]: CampoTelefone,
  // E-mail e URL: input de texto com `type` próprio (ver `campos-texto`).
});

function temOpcoes(campo) {
  return Array.isArray(campo.opcoes) && campo.opcoes.length > 0;
}

function escolherControle(campo) {
  if (campo.tipo === TIPOS_CAMPO.SELECAO_MULTIPLA) {
    // Sem `opcoes` (caso de `tags`), a seleção múltipla é entrada livre.
    return temOpcoes(campo) ? CampoOpcoesMultiplas : CampoTags;
  }

  return CONTROLE_POR_TIPO[campo.tipo] ?? CampoTexto;
}

/**
 * Controle de um campo de `/crm/leads/fields`, escolhido pelo `tipo`.
 *
 * @param {{
 *   campo: import('../types').Campo,
 *   id: string,
 *   value: unknown,
 *   onChange: (valor: unknown) => void,
 *   erro?: string | null,
 *   onBlur?: () => void,
 * }} props `onBlur` vai para o input (ex.: checar duplicidade ao sair do campo)
 */
export function CampoDinamico({ campo, id, value, onChange, erro, onBlur }) {
  const Controle = escolherControle(campo);

  return (
    <CampoForm
      ajuda={AJUDA_POR_CHAVE[campo.chave]}
      comoGrupo={Controle === CampoOpcoesMultiplas}
      erro={erro}
      id={id}
      label={campo.label}
      obrigatorio={campo.obrigatorio}
    >
      {(controle) => (
        <Controle
          campo={campo}
          controle={onBlur ? { ...controle, onBlur } : controle}
          onChange={onChange}
          value={value}
        />
      )}
    </CampoForm>
  );
}

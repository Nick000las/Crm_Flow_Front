import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { PARTES_ENDERECO, ROTULOS_PARTE_ENDERECO } from '../constants';
import { useUsuarios } from '../hooks/use-usuarios';
import { mascararCep } from '../lib/formatadores';
import { INPUT_CLASS } from './campos-texto';
import { SelectSimples } from './select-simples';

const MAX_UF = 2;

/** Usuário (M11): um usuário ativo do tenant, por `/crm/usuarios`. */
export function CampoUsuario({ campo, value, onChange, controle }) {
  const { usuarios } = useUsuarios();
  const opcoes = usuarios.map((usuario) => ({ valor: usuario.id, rotulo: usuario.nome }));

  return (
    <SelectSimples
      {...controle}
      onChange={onChange}
      opcoes={opcoes}
      vazio={campo.obrigatorio ? undefined : 'Nenhum'}
      value={value}
    />
  );
}

/**
 * Período (`intervalo_datas`): de/até. Rótulo do grupo vem do `CampoForm`
 * (`comoGrupo`); cada data tem o seu.
 */
export function CampoIntervalo({ value, onChange, controle }) {
  const alterar = (lado) => (event) => onChange({ ...value, [lado]: event.target.value });
  const comum = {
    'aria-describedby': controle['aria-describedby'],
    'aria-invalid': controle['aria-invalid'],
    disabled: controle.disabled,
    className: cn(INPUT_CLASS, 'font-mono'),
    type: 'date',
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="grid gap-1">
        <Label className="text-xs font-normal text-muted-foreground" htmlFor={`${controle.id}-de`}>
          De
        </Label>
        <Input {...comum} id={`${controle.id}-de`} onChange={alterar('de')} value={value.de} />
      </div>
      <div className="grid gap-1">
        <Label className="text-xs font-normal text-muted-foreground" htmlFor={`${controle.id}-ate`}>
          Até
        </Label>
        <Input {...comum} id={`${controle.id}-ate`} onChange={alterar('ate')} value={value.ate} />
      </div>
    </div>
  );
}

/** Largura de cada parte na grade de 6 colunas. */
const COLUNAS_PARTE = Object.freeze({
  cep: 'sm:col-span-2',
  logradouro: 'sm:col-span-4',
  numero: 'sm:col-span-2',
  complemento: 'sm:col-span-4',
  bairro: 'sm:col-span-2',
  cidade: 'sm:col-span-3',
  uf: 'sm:col-span-1',
});

const ATRIBUTOS_PARTE = Object.freeze({
  cep: { inputMode: 'numeric', autoComplete: 'postal-code', placeholder: '00000-000' },
  logradouro: { autoComplete: 'address-line1' },
  complemento: { autoComplete: 'address-line2' },
  bairro: { autoComplete: 'address-level3' },
  cidade: { autoComplete: 'address-level2' },
  uf: { autoComplete: 'address-level1', maxLength: MAX_UF },
});

/** Endereço (M11): uma parte por input; o payload leva só as preenchidas. */
export function CampoEndereco({ value, onChange, controle }) {
  function alterar(parte, texto) {
    const proximo = parte === 'cep' ? mascararCep(texto) : parte === 'uf' ? texto.toUpperCase() : texto;
    onChange({ ...value, [parte]: proximo });
  }

  return (
    <div className="grid gap-2 sm:grid-cols-6">
      {PARTES_ENDERECO.map((parte) => {
        const id = `${controle.id}-${parte}`;

        return (
          <div className={cn('grid gap-1', COLUNAS_PARTE[parte])} key={parte}>
            <Label className="text-xs font-normal text-muted-foreground" htmlFor={id}>
              {ROTULOS_PARTE_ENDERECO[parte]}
            </Label>
            <Input
              {...ATRIBUTOS_PARTE[parte]}
              aria-describedby={controle['aria-describedby']}
              aria-invalid={controle['aria-invalid']}
              className={cn(INPUT_CLASS, (parte === 'cep' || parte === 'uf') && 'font-mono')}
              disabled={controle.disabled}
              id={id}
              onChange={(event) => alterar(parte, event.target.value)}
              value={value[parte] ?? ''}
            />
          </div>
        );
      })}
    </div>
  );
}

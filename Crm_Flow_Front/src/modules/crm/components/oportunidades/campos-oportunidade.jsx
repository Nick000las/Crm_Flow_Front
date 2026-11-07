import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MENSAGEM_SEM_PERMISSAO } from '../../constants';
import { CampoForm } from '../campo-form';
import { CampoMonetario, INPUT_CLASS } from '../campos-texto';
import { SelectSimples } from '../select-simples';

const TAMANHO_TITULO = 200;

/**
 * Título, valor, probabilidade, previsão e responsável: o dialog da oportunidade
 * e o "Adicionar" do quadro. Dado oculto para o papel não aparece; só de ver,
 * fica travado.
 *
 * @param {{
 *   valores: import('../../lib/oportunidades').ValoresOportunidade,
 *   acesso: ReturnType<typeof import('../../lib/oportunidades').acessoAosDados>,
 *   usuarios: { id: string, nome: string }[],
 *   erroDe: (chave: string) => string | undefined,
 *   onChange: (chave: string, valor: string) => void,
 *   focarTitulo?: boolean,
 * }} props
 */
export function CamposOportunidade({
  valores,
  acesso,
  usuarios,
  erroDe,
  onChange,
  focarTitulo = false,
}) {
  const travado = (chave) => (acesso[chave].editavel ? null : MENSAGEM_SEM_PERMISSAO);

  return (
    <>
      <CampoForm erro={erroDe('titulo')} id="oportunidade-titulo" label="Título">
        {(controle) => (
          <Input
            {...controle}
            autoFocus={focarTitulo}
            className={INPUT_CLASS}
            maxLength={TAMANHO_TITULO}
            onChange={(event) => onChange('titulo', event.target.value)}
            value={valores.titulo}
          />
        )}
      </CampoForm>

      {acesso.valor.visivel && (
        <CampoForm
          erro={erroDe('valor')}
          id="oportunidade-valor"
          label="Valor"
          motivoTravado={travado('valor')}
        >
          {(controle) => (
            <CampoMonetario
              controle={controle}
              onChange={(valor) => onChange('valor', valor)}
              value={valores.valor}
            />
          )}
        </CampoForm>
      )}

      {acesso.probabilidadeFechamento.visivel && (
        <CampoForm
          erro={erroDe('probabilidadeFechamento')}
          id="oportunidade-probabilidade"
          label="Probabilidade (%)"
          motivoTravado={travado('probabilidadeFechamento')}
        >
          {(controle) => (
            <Input
              {...controle}
              className={cn(INPUT_CLASS, 'font-mono tabular-nums')}
              inputMode="numeric"
              onChange={(event) => onChange('probabilidadeFechamento', event.target.value)}
              value={valores.probabilidadeFechamento}
            />
          )}
        </CampoForm>
      )}

      {acesso.dataPrevistaFechamento.visivel && (
        <CampoForm
          erro={erroDe('dataPrevistaFechamento')}
          id="oportunidade-data"
          label="Previsão de fechamento"
          motivoTravado={travado('dataPrevistaFechamento')}
        >
          {(controle) => (
            <Input
              {...controle}
              className={cn(INPUT_CLASS, 'font-mono')}
              onChange={(event) => onChange('dataPrevistaFechamento', event.target.value)}
              type="date"
              value={valores.dataPrevistaFechamento}
            />
          )}
        </CampoForm>
      )}

      {acesso.responsavelId.visivel && (
        <CampoForm
          erro={erroDe('responsavelId')}
          id="oportunidade-responsavel"
          label="Responsável"
          motivoTravado={travado('responsavelId')}
        >
          {(controle) => (
            <SelectSimples
              {...controle}
              onChange={(valor) => onChange('responsavelId', valor)}
              opcoes={usuarios.map((usuario) => ({ valor: usuario.id, rotulo: usuario.nome }))}
              vazio="Sem responsável"
              value={valores.responsavelId}
            />
          )}
        </CampoForm>
      )}
    </>
  );
}

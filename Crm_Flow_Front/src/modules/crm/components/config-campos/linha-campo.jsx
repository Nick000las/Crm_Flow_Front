import { Pencil, Trash2 } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { toApiError } from '@/services/api';
import { CAMADA, ROTULOS_CONTEXTO, ROTULOS_TIPO } from '../../constants';
import { useAtualizarCampoConfigurado } from '../../hooks/use-configuracoes-campos';
import { CONTEXTOS, bloqueios, parcialDeVisibilidade } from '../../lib/configuracoes-campos';
import { BotaoIcone } from '../botao-icone';
import { BotoesOrdem } from '../ordenavel/botoes-ordem';
import { PuxadorOrdem } from '../ordenavel/puxador-ordem';
import { useLinhaOrdenavel } from '../ordenavel/use-linha-ordenavel';
import { CheckboxDaMatriz } from './checkbox-da-matriz';

const CAMPOS_DO_ERRO = Object.freeze(['visibilidade', 'obrigatorio', 'label']);

/** Mensagem do 400 por campo (`fields.visibilidade` etc.), senão a geral. */
function mensagemDoErro(error) {
  const apiError = toApiError(error);
  const doCampo = CAMPOS_DO_ERRO.map((chave) => apiError.fields[chave]?.[0]).find(Boolean);
  return doCampo ?? apiError.message;
}

/**
 * Uma linha da matriz: em que telas o campo aparece, se é obrigatório e a
 * posição. Cada checkbox salva na hora (`PUT` parcial); enquanto salva, a
 * linha mostra o valor pedido e trava.
 *
 * @param {{
 *   campo: import('../../types').CampoConfigurado,
 *   indice: number,
 *   total: number,
 *   ordemOcupada: boolean,
 *   onMover: (de: number, para: number) => void,
 *   onEditar: (campo: import('../../types').CampoConfigurado) => void,
 *   onExcluir: (campo: import('../../types').CampoConfigurado) => void,
 * }} props
 */
export function LinhaCampo({ campo, indice, total, ordemOcupada, onMover, onEditar, onExcluir }) {
  const atualizar = useAtualizarCampoConfigurado();
  const { linha, puxador } = useLinhaOrdenavel(campo.id, ordemOcupada);

  // Enquanto o PUT não volta, mostra o que foi pedido (sem "piscar" de volta).
  const pedido = atualizar.isPending ? atualizar.variables.parcial : {};
  const exibido = {
    ...campo,
    obrigatorio: pedido.obrigatorio ?? campo.obrigatorio,
    visibilidade: { ...campo.visibilidade, ...pedido.visibilidade },
  };
  const travas = bloqueios(exibido);
  const personalizado = campo.camada === CAMADA.CAMADA_3;
  const idBase = `config-campo-${campo.id}`;
  const erroId = `${idBase}-erro`;

  function salvar(parcial) {
    atualizar.mutate({ id: campo.id, parcial });
  }

  return (
    <TableRow {...linha}>
      <TableCell className="w-8 pr-0">
        <PuxadorOrdem {...puxador} rotulo={campo.label} />
      </TableCell>

      <TableCell className="min-w-48">
        <span className="font-medium">{campo.label}</span>
        <span className="block font-mono text-[11px] text-muted-foreground">
          {campo.chave}
          {campo.labelPadrao &&
            campo.label !== campo.labelPadrao &&
            ` · padrão: ${campo.labelPadrao}`}
        </span>
        {atualizar.error && (
          <p className="mt-1 text-xs text-destructive" id={erroId} role="alert">
            {mensagemDoErro(atualizar.error)}
          </p>
        )}
      </TableCell>

      <TableCell className="text-sm whitespace-nowrap">
        {ROTULOS_TIPO[campo.tipo] ?? campo.tipo}
        <span className="block font-mono text-[11px] text-muted-foreground uppercase">
          {personalizado ? 'Personalizado' : 'Sistema'}
        </span>
      </TableCell>

      {CONTEXTOS.map((contexto) => (
        <TableCell className="text-center" key={contexto}>
          <CheckboxDaMatriz
            checked={exibido.visibilidade[contexto]}
            id={`${idBase}-${contexto}`}
            motivo={travas.visibilidade[contexto]}
            ocupado={atualizar.isPending}
            onChange={(ligado) => salvar(parcialDeVisibilidade(contexto, ligado))}
            rotulo={`${ROTULOS_CONTEXTO[contexto]}: ${campo.label}`}
          />
        </TableCell>
      ))}

      <TableCell className="text-center">
        <CheckboxDaMatriz
          checked={exibido.obrigatorio}
          id={`${idBase}-obrigatorio`}
          motivo={travas.obrigatorio}
          ocupado={atualizar.isPending}
          onChange={(obrigatorio) => salvar({ obrigatorio })}
          rotulo={`Obrigatório: ${campo.label}`}
        />
      </TableCell>

      <TableCell className="text-right whitespace-nowrap">
        <BotoesOrdem
          desabilitado={ordemOcupada}
          indice={indice}
          onMover={onMover}
          rotulo={campo.label}
          total={total}
        />
        <BotaoIcone
          disabled={Boolean(travas.renomear)}
          icone={Pencil}
          onClick={() => onEditar(campo)}
          rotulo={
            travas.renomear ?? (personalizado ? `Editar ${campo.label}` : `Renomear ${campo.label}`)
          }
        />
        {personalizado && (
          <BotaoIcone
            icone={Trash2}
            onClick={() => onExcluir(campo)}
            rotulo={`Excluir ${campo.label}`}
          />
        )}
      </TableCell>
    </TableRow>
  );
}

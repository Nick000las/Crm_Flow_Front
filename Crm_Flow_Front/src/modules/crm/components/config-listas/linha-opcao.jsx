import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TableCell, TableRow } from '@/components/ui/table';
import { getFieldError, toApiError } from '@/services/api';
import { ROTULOS_CATEGORIA } from '../../constants';
import { useAtualizarOpcao } from '../../hooks/use-listas';
import { motivoNaoExclui, temCategoria } from '../../lib/listas';
import {
  comPorcento,
  lerProbabilidade,
  probabilidadeFixa,
  validarProbabilidade,
} from '../../lib/probabilidade';
import { BotaoIcone } from '../botao-icone';
import { ControleTravado } from '../controle-travado';
import { OpcaoBadge } from '../opcao-badge';
import { BotoesOrdem } from '../ordenavel/botoes-ordem';
import { PuxadorOrdem } from '../ordenavel/puxador-ordem';
import { useLinhaOrdenavel } from '../ordenavel/use-linha-ordenavel';

const USOS_DE_PIPELINE = Object.freeze(['oportunidade', 'oportunidades']);
const PROBABILIDADE = 'probabilidadePadrao';

/**
 * Probabilidade padrão do status (FC1): grava ao sair do campo ou no Enter, se
 * mudou. Vazio volta ao que estava (o padrão nunca é nulo). Ganho e perdido são
 * fixos: só o número. Remontado quando o valor do servidor muda (`key`).
 *
 * @param {{
 *   opcao: import('../../lib/listas').OpcaoConfigurada,
 *   pipelineId: string,
 *   ajudaId?: string,
 * }} props
 */
function CampoProbabilidadePadrao({ opcao, pipelineId, ajudaId }) {
  const atualizar = useAtualizarOpcao(pipelineId);
  const salva = opcao.probabilidadePadrao;
  const textoSalvo = typeof salva === 'number' ? String(salva) : '';
  const [texto, setTexto] = useState(textoSalvo);
  const [erroLocal, setErroLocal] = useState(null);
  const fixa = probabilidadeFixa(opcao.category);
  const id = `opcao-${opcao.id}-probabilidade`;

  if (fixa !== null) {
    return <span className="font-mono text-xs tabular-nums">{comPorcento(fixa)}</span>;
  }

  const erro =
    erroLocal ??
    (atualizar.error
      ? (getFieldError(atualizar.error, PROBABILIDADE) ?? toApiError(atualizar.error).message)
      : null);

  function gravar() {
    const valor = lerProbabilidade(texto);
    if (valor === null) {
      setTexto(textoSalvo);
      setErroLocal(null);
      return;
    }
    const invalida = validarProbabilidade(texto);
    setErroLocal(invalida);
    if (invalida || valor === salva) {
      return;
    }
    atualizar.mutate({ id: opcao.id, parcial: { [PROBABILIDADE]: valor } });
  }

  return (
    <div className="grid justify-items-end gap-1">
      <div className="flex items-center gap-1">
        <Input
          aria-busy={atualizar.isPending}
          aria-describedby={[ajudaId, erro && `${id}-erro`].filter(Boolean).join(' ') || undefined}
          aria-invalid={erro ? true : undefined}
          aria-label={`Probabilidade de ${opcao.label} (%)`}
          className="h-8 w-16 rounded-none text-right font-mono text-xs tabular-nums"
          disabled={atualizar.isPending}
          id={id}
          inputMode="numeric"
          onBlur={gravar}
          onChange={(event) => {
            setTexto(event.target.value);
            setErroLocal(null);
            atualizar.reset();
          }}
          onKeyDown={(event) => event.key === 'Enter' && gravar()}
          value={texto}
        />
        <span aria-hidden="true" className="font-mono text-xs text-muted-foreground">
          %
        </span>
      </div>
      {erro && (
        <p className="max-w-40 text-right text-xs text-destructive" id={`${id}-erro`} role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}

/**
 * Uma opção da lista. "Ativa" salva na hora; desativar some dos seletores,
 * mas o lead que já a tem continua mostrando (com o selo "inativa"). O 409
 * de "último status da categoria" aparece na própria linha.
 *
 * @param {{
 *   tipo: string,
 *   opcao: import('../../lib/listas').OpcaoConfigurada,
 *   indice: number,
 *   total: number,
 *   ordemOcupada: boolean,
 *   onMover: (de: number, para: number) => void,
 *   onEditar: (opcao: import('../../lib/listas').OpcaoConfigurada) => void,
 *   onExcluir: (opcao: import('../../lib/listas').OpcaoConfigurada) => void,
 *   pipelineId?: string,
 *   ajudaProbabilidadeId?: string,
 * }} props `pipelineId`: status de pipeline, com a coluna de probabilidade
 */
export function LinhaOpcao({
  tipo,
  opcao,
  indice,
  total,
  ordemOcupada,
  onMover,
  onEditar,
  onExcluir,
  pipelineId,
  ajudaProbabilidadeId,
}) {
  const atualizar = useAtualizarOpcao(pipelineId);
  const { linha, puxador } = useLinhaOrdenavel(opcao.id, ordemOcupada);
  const ativo = atualizar.isPending ? atualizar.variables.parcial.ativo : opcao.ativo;
  const idBase = `opcao-${opcao.id}`;
  const motivoExcluir = motivoNaoExclui(opcao, pipelineId ? USOS_DE_PIPELINE : undefined);

  return (
    <TableRow {...linha}>
      <TableCell className="w-8 pr-0">
        <PuxadorOrdem {...puxador} rotulo={opcao.label} />
      </TableCell>

      <TableCell className="min-w-48">
        <OpcaoBadge opcao={{ ...opcao, ativo }} />
        <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
          {opcao.key}
        </span>
        {atualizar.error && (
          <p className="mt-1 text-xs text-destructive" role="alert">
            {toApiError(atualizar.error).message}
          </p>
        )}
      </TableCell>

      {temCategoria(tipo) && (
        <TableCell className="text-sm">{ROTULOS_CATEGORIA[opcao.category] ?? '—'}</TableCell>
      )}

      {pipelineId && (
        <TableCell className="text-right">
          <CampoProbabilidadePadrao
            ajudaId={ajudaProbabilidadeId}
            key={`${opcao.category}-${opcao.probabilidadePadrao}`}
            opcao={opcao}
            pipelineId={pipelineId}
          />
        </TableCell>
      )}

      <TableCell className="text-right font-mono text-xs tabular-nums">
        {opcao.usos.toLocaleString('pt-BR')}
      </TableCell>

      <TableCell className="text-center">
        <Switch
          aria-label={`Ativa: ${opcao.label}`}
          checked={ativo}
          disabled={atualizar.isPending}
          id={`${idBase}-ativa`}
          onCheckedChange={(proximo) =>
            atualizar.mutate({ tipo, id: opcao.id, parcial: { ativo: proximo } })
          }
        />
      </TableCell>

      <TableCell className="text-right whitespace-nowrap">
        <BotoesOrdem
          desabilitado={ordemOcupada}
          indice={indice}
          onMover={onMover}
          rotulo={opcao.label}
          total={total}
        />
        <BotaoIcone
          icone={Pencil}
          onClick={() => onEditar(opcao)}
          rotulo={`Editar ${opcao.label}`}
        />
        <ControleTravado motivo={motivoExcluir} motivoId={`${idBase}-excluir-motivo`}>
          <BotaoIcone
            aria-describedby={motivoExcluir ? `${idBase}-excluir-motivo` : undefined}
            className={motivoExcluir ? 'pointer-events-none rounded-none' : 'rounded-none'}
            disabled={Boolean(motivoExcluir)}
            icone={Trash2}
            onClick={() => onExcluir(opcao)}
            rotulo={`Excluir ${opcao.label}`}
          />
        </ControleTravado>
      </TableCell>
    </TableRow>
  );
}

import { Pencil, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { TableCell, TableRow } from '@/components/ui/table';
import { toApiError } from '@/services/api';
import { ROTULOS_CATEGORIA } from '../../constants';
import { useAtualizarOpcao } from '../../hooks/use-listas';
import { motivoNaoExclui, temCategoria } from '../../lib/listas';
import { BotaoIcone } from '../botao-icone';
import { ControleTravado } from '../controle-travado';
import { OpcaoBadge } from '../opcao-badge';
import { BotoesOrdem } from '../ordenavel/botoes-ordem';
import { PuxadorOrdem } from '../ordenavel/puxador-ordem';
import { useLinhaOrdenavel } from '../ordenavel/use-linha-ordenavel';

/**
 * Uma opção da lista. "Ativa" salva na hora; desativar some dos seletores,
 * mas o lead que já a tem continua mostrando (com o selo "inativa"). O 409
 * de "último status ganho/perdido" aparece na própria linha.
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
 * }} props
 */
export function LinhaOpcao({ tipo, opcao, indice, total, ordemOcupada, onMover, onEditar, onExcluir }) {
  const atualizar = useAtualizarOpcao();
  const { linha, puxador } = useLinhaOrdenavel(opcao.id, ordemOcupada);
  const ativo = atualizar.isPending ? atualizar.variables.parcial.ativo : opcao.ativo;
  const idBase = `opcao-${opcao.id}`;
  const motivoExcluir = motivoNaoExclui(opcao);

  return (
    <TableRow {...linha}>
      <TableCell className="w-8 pr-0">
        <PuxadorOrdem {...puxador} rotulo={opcao.label} />
      </TableCell>

      <TableCell className="min-w-48">
        <OpcaoBadge opcao={{ ...opcao, ativo }} />
        <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">{opcao.key}</span>
        {atualizar.error && (
          <p className="mt-1 text-xs text-destructive" role="alert">
            {toApiError(atualizar.error).message}
          </p>
        )}
      </TableCell>

      {temCategoria(tipo) && (
        <TableCell className="text-sm">{ROTULOS_CATEGORIA[opcao.category] ?? '—'}</TableCell>
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
          onCheckedChange={(proximo) => atualizar.mutate({ tipo, id: opcao.id, parcial: { ativo: proximo } })}
        />
      </TableCell>

      <TableCell className="text-right whitespace-nowrap">
        <BotoesOrdem desabilitado={ordemOcupada} indice={indice} onMover={onMover} rotulo={opcao.label} total={total} />
        <BotaoIcone icone={Pencil} onClick={() => onEditar(opcao)} rotulo={`Editar ${opcao.label}`} />
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

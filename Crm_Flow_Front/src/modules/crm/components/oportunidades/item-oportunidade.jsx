import { Archive, ArchiveRestore, ArrowRightLeft, Pencil, Trash2 } from 'lucide-react';
import { formatarData, formatarMoeda } from '../../lib/formatadores';
import { campoDoMotivo } from '../../lib/oportunidades';
import { humanizar, rotuloOpcao } from '../../lib/opcoes';
import { statusDoPipeline } from '../../lib/pipelines';
import { textoDaProbabilidade } from '../../lib/probabilidade';
import { BotaoIcone } from '../botao-icone';
import { OpcaoBadge } from '../opcao-badge';

const DADO = 'font-mono tabular-nums';

function Detalhe({ rotulo, children }) {
  return (
    <>
      <dt className="text-muted-foreground">{rotulo}</dt>
      <dd>{children}</dd>
    </>
  );
}

/**
 * Uma oportunidade. Toda chave comercial é opcional: campo oculto para o papel
 * não vem. Sem um handler (arquivada, lead anonimizado, sem permissão), o botão
 * dele some.
 *
 * @param {{
 *   oportunidade: import('../../api/oportunidades.api').Oportunidade,
 *   pipelines: import('../../api/pipelines.api').Pipeline[],
 *   campos: import('../../types').Campo[],
 *   nomePorId: Map<string, string>,
 *   onEditar?: () => void,
 *   onMudarStatus?: () => void,
 *   onArquivar?: () => void,
 *   onDesarquivar?: () => void,
 *   onExcluir?: () => void,
 * }} props
 */
export function ItemOportunidade({
  oportunidade,
  pipelines,
  campos,
  nomePorId,
  onEditar,
  onMudarStatus,
  onArquivar,
  onDesarquivar,
  onExcluir,
}) {
  const pipeline = pipelines.find((item) => item.id === oportunidade.pipelineId);
  const pipelineNome = pipeline?.nome ?? 'Pipeline removido';
  const titulo = oportunidade.titulo || pipelineNome;
  const status = oportunidade.status
    ? (statusDoPipeline(pipelines, oportunidade.pipelineId, oportunidade.status) ?? {
        label: humanizar(oportunidade.status),
        color: null,
        category: oportunidade.categoria,
        ativo: true,
      })
    : null;
  const valor = formatarMoeda(oportunidade.valor);
  const probabilidade = textoDaProbabilidade(oportunidade);
  const previsao = formatarData(oportunidade.dataPrevistaFechamento);
  const ganhaEm = formatarData(oportunidade.ganhaEm);
  const perdidaEm = formatarData(oportunidade.perdidaEm);
  const motivo = oportunidade.motivoPerda
    ? rotuloOpcao(oportunidade.motivoPerda, campoDoMotivo(campos) ?? undefined)
    : null;
  const responsavel = oportunidade.responsavelId
    ? (nomePorId.get(oportunidade.responsavelId) ?? 'Usuário removido')
    : null;

  return (
    <li className="grid gap-2 border-b border-border py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="grid min-w-0 gap-1">
          <p className="text-sm font-medium break-words">{titulo}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {status && <OpcaoBadge opcao={status} />}
            {oportunidade.titulo && (
              <span className="text-xs text-muted-foreground">{pipelineNome}</span>
            )}
            {oportunidade.arquivadaEm && (
              <span className="text-xs text-muted-foreground">· Arquivada</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0">
          {onMudarStatus && (
            <BotaoIcone
              icone={ArrowRightLeft}
              onClick={onMudarStatus}
              rotulo={`Mudar status de ${titulo}`}
            />
          )}
          {onEditar && <BotaoIcone icone={Pencil} onClick={onEditar} rotulo={`Editar ${titulo}`} />}
          {onArquivar && (
            <BotaoIcone icone={Archive} onClick={onArquivar} rotulo={`Arquivar ${titulo}`} />
          )}
          {onDesarquivar && (
            <BotaoIcone
              icone={ArchiveRestore}
              onClick={onDesarquivar}
              rotulo={`Desarquivar ${titulo}`}
            />
          )}
          {onExcluir && (
            <BotaoIcone
              icone={Trash2}
              onClick={onExcluir}
              rotulo={`Mover ${titulo} para a lixeira`}
            />
          )}
        </div>
      </div>

      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-sm">
        {valor && (
          <Detalhe rotulo="Valor">
            <span className={DADO}>{valor}</span>
          </Detalhe>
        )}
        {probabilidade && (
          <Detalhe rotulo="Probabilidade">
            <span className={DADO}>{probabilidade.valor}</span>
            {probabilidade.doStatus && (
              <span className="text-muted-foreground"> (padrão do status)</span>
            )}
          </Detalhe>
        )}
        {responsavel && <Detalhe rotulo="Responsável">{responsavel}</Detalhe>}
        {previsao && (
          <Detalhe rotulo="Previsão">
            <span className={DADO}>{previsao}</span>
          </Detalhe>
        )}
        {ganhaEm && (
          <Detalhe rotulo="Ganha em">
            <span className={DADO}>{ganhaEm}</span>
          </Detalhe>
        )}
        {perdidaEm && (
          <Detalhe rotulo="Perdida em">
            <span className={DADO}>{perdidaEm}</span>
          </Detalhe>
        )}
        {motivo && <Detalhe rotulo="Motivo">{motivo}</Detalhe>}
      </dl>

      {oportunidade.origemReabertaEm && (
        <p className="border border-border px-3 py-2 text-sm">
          A venda que originou este atendimento foi reaberta.
        </p>
      )}
    </li>
  );
}

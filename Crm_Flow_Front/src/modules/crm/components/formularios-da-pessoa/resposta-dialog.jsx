/**
 * @file Uma resposta de formulário, como foi enviada, na versão que a pessoa viu. Para cada
 * campo do CRM, o que a resposta fez na ficha; o que ficou para revisar com valor diferente
 * pode ser gravado por "Usar este valor".
 */
import { useState } from 'react';

import { ApiErrorAlert } from '@/components/api-error-alert';
import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toApiError } from '@/services/api';

import { useCampos } from '../../hooks/use-campos';
import { useAtualizarLead } from '../../hooks/use-lead-mutations';
import { useRespostaDeFormulario } from '../../hooks/use-links-formulario';
import { payloadDeUmCampo, podeEditarCampo, versaoDoLead } from '../../lib/form-lead';
import { formatarInstante } from '../../lib/formatadores';
import { textoDoValor } from '../../lib/layout';
import {
  MENSAGEM_RESPOSTAS_APAGADAS,
  podeUsarValor,
  respostasApagadas,
  resumoDaEscrita,
  rotuloDeQuemPreencheu,
  textoDaEscrita,
} from '../../lib/respostas-formulario';

const MARCA = 'border border-border px-1.5 text-[11px] text-muted-foreground uppercase';
const CAMPOS_VAZIOS = [];

/** "Usar este valor": a edição normal do lead, com um campo só. */
function UsarValor({ lead, campo, valor, rotulo, onUsado }) {
  const atualizar = useAtualizarLead(lead.id);

  return (
    <div className="grid gap-1">
      <div>
        <Button
          aria-busy={atualizar.isPending}
          disabled={atualizar.isPending}
          onClick={() =>
            atualizar.mutate(
              { ...payloadDeUmCampo(campo, valor), expectedUpdatedAt: versaoDoLead(lead) },
              { onSuccess: onUsado },
            )
          }
          size="sm"
          type="button"
          variant="outline"
          loading={atualizar.isPending}
          loadingText="Gravando…"
        >
          {'Usar este valor'}
          <span className="sr-only"> em {rotulo}</span>
        </Button>
      </div>
      {atualizar.error && (
        <p className="text-xs text-destructive" role="alert">
          {toApiError(atualizar.error).message}
        </p>
      )}
    </div>
  );
}

/** `apagada`: pessoa anonimizada (FM6), os valores vêm vazios e não aparecem. */
function Item({ item, lead, campos, nomePorId, usados, onUsado, apagada }) {
  const pergunta = 'pergunta' in item ? item.pergunta : null;
  const retrato = pergunta ?? item.campo;
  const rotulo = pergunta ? pergunta.rotulo : item.campo.label;
  const texto = item.oculto ? null : textoDoValor({ ...retrato, camada: 3 }, item.valor, nomePorId);
  const escrita = pergunta ? null : textoDaEscrita(item.escrita);
  // O campo de agora, em `/fields`: sem ele (oculto) ou só de ver, não dá para gravar.
  const campoAtual = pergunta ? null : campos.find((atual) => atual.id === item.campoId);
  const usavel =
    !apagada &&
    !usados.has(item.campoId) &&
    podeUsarValor(item) &&
    campoAtual &&
    podeEditarCampo(campoAtual);

  return (
    <li className="grid gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className={MARCA}>{pergunta ? 'Pergunta' : 'Campo do CRM'}</span>
        <span className="font-medium">{rotulo}</span>
      </div>
      {item.oculto ? (
        <p className="text-muted-foreground">Restrito</p>
      ) : (
        !apagada && (
          <p className="break-words whitespace-pre-wrap">
            {texto ?? <span className="text-muted-foreground">Sem resposta</span>}
          </p>
        )
      )}
      {escrita && (
        <p
          className={
            item.escrita?.resultado === 'revisao'
              ? 'text-xs text-foreground'
              : 'text-xs text-muted-foreground'
          }
        >
          {usados.has(item.campoId) ? 'Gravado na ficha agora' : escrita}
        </p>
      )}
      {usavel && (
        <UsarValor
          campo={campoAtual}
          lead={lead}
          onUsado={() => onUsado(item.campoId)}
          rotulo={rotulo}
          valor={item.valor}
        />
      )}
    </li>
  );
}

function Conteudo({ lead, respostaId, nomePorId }) {
  const respostaQuery = useRespostaDeFormulario(lead.id, respostaId);
  const campos = useCampos().data ?? CAMPOS_VAZIOS;
  const [usados, setUsados] = useState(() => new Set());

  if (respostaQuery.error) {
    return <ApiErrorAlert error={respostaQuery.error} id="resposta-formulario-erro" />;
  }

  if (respostaQuery.isPending) {
    return (
      <div className="grid gap-2" aria-busy="true">
        <LoadingState label="Carregando resposta…" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  const resposta = respostaQuery.data;
  const resumo = resumoDaEscrita(resposta.escrita);
  const apagada = respostasApagadas(lead);

  return (
    <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
      {apagada && (
        <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm" role="status">
          {MENSAGEM_RESPOSTAS_APAGADAS}
        </p>
      )}
      <dl className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-[auto_minmax(0,1fr)]">
        <dt className="text-muted-foreground">Respondido em</dt>
        <dd className="tabular-nums">{formatarInstante(resposta.respondidoEm)}</dd>
        <dt className="text-muted-foreground">Quem preencheu</dt>
        <dd>{rotuloDeQuemPreencheu(resposta)}</dd>
        {resumo && (
          <>
            <dt className="text-muted-foreground">Na ficha</dt>
            <dd>{resumo}</dd>
          </>
        )}
        {resposta.origem && (
          <>
            <dt className="text-muted-foreground">Origem</dt>
            <dd className="break-all">
              {[resposta.origem.ip, resposta.origem.navegador].filter(Boolean).join(' · ') || '—'}
            </dd>
          </>
        )}
      </dl>
      {!apagada && (
        <p className="text-xs text-muted-foreground">
          É o que a pessoa declarou. Editar a ficha depois não muda a resposta.
        </p>
      )}

      {resposta.secoes.map((secao, indice) => (
        <section className="grid gap-2" key={indice}>
          {secao.titulo && <h3 className="text-sm font-semibold">{secao.titulo}</h3>}
          <ul className="grid gap-1.5">
            {secao.itens.map((item) => (
              <Item
                apagada={apagada}
                campos={campos}
                item={item}
                key={'pergunta' in item ? `p-${item.pergunta.id}` : item.campoId}
                lead={lead}
                nomePorId={nomePorId}
                onUsado={(campoId) => setUsados((atuais) => new Set(atuais).add(campoId))}
                usados={usados}
              />
            ))}
          </ul>
        </section>
      ))}

      <div className="grid gap-1">
        <p className="text-xs font-medium text-muted-foreground">
          Termo aceito em{' '}
          <span className="tabular-nums">{formatarInstante(resposta.aceitoEm)}</span>
        </p>
        <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm whitespace-pre-wrap">
          {resposta.termo}
        </p>
      </div>
    </div>
  );
}

/**
 * Uma resposta de formulário, como foi enviada, na versão que a pessoa viu.
 * Para cada campo do CRM, o que a resposta fez na ficha; o que ficou para
 * revisar com valor diferente pode ser gravado por "Usar este valor".
 *
 * @param {{
 *   lead: import('../../types').Lead,
 *   resposta: { id: string, formulario: { nome: string }, versao: { versao: number } } | null,
 *   nomePorId: Map<string, string>,
 *   onFechar: () => void,
 * }} props aberto enquanto houver `resposta`
 */
export function RespostaDialog({ lead, resposta, nomePorId, onFechar }) {
  return (
    <Dialog onOpenChange={(aberto) => !aberto && onFechar()} open={Boolean(resposta)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {resposta?.formulario.nome}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              v{resposta?.versao.versao}
            </span>
          </DialogTitle>
          <DialogDescription>Resposta recebida pelo link do formulário.</DialogDescription>
        </DialogHeader>
        {resposta && (
          <Conteudo key={resposta.id} lead={lead} nomePorId={nomePorId} respostaId={resposta.id} />
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * @file Aba "Formulários" da ficha (FM2, `crm.formularios`): gera o link pessoal de um
 * formulário publicado e mostra o histórico.
 */
import { useState } from 'react';
import { ClipboardList, Copy, Link2, RotateCcw, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { podeVer } from '@/lib/acesso';
import { isAccessError, toApiError } from '@/services/api';

import { PAPEIS_GESTAO } from '../../constants';
import {
  useFormulariosDisponiveis,
  useLinksDaPessoa,
  useObterLink,
  useRespostasDeFormulario,
  useRevogarLink,
} from '../../hooks/use-links-formulario';
import { formatarInstante } from '../../lib/formatadores';
import {
  estadoDoLink,
  motivoSemEnvio,
  primeiroNomeDoLead,
  STATUS_LINK,
} from '../../lib/links-formulario';
import { precisaRevisar, rotuloDeQuemPreencheu } from '../../lib/respostas-formulario';
import { caminhoDaSecao } from '../../lib/secoes-configuracoes';
import { ControleTravado } from '../controle-travado';
import { SelectSimples } from '../select-simples';
import { TodosOsAlertas } from './alertas-da-pessoa';
import { EnvioDoLink } from './envio-do-link';
import { RespostaDialog } from './resposta-dialog';

const STATUS_NAO_ENCONTRADO = 404;
const MENSAGEM_INDISPONIVEL = 'Este formulário foi desativado ou não tem versão publicada.';
const RESPOSTAS_VAZIAS = [];

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <LoadingState label="Carregando formulários…" />
      <Skeleton className="h-16" />
      <Skeleton className="h-24" />
    </div>
  );
}

/** Mensagem do erro ao obter o link: o 404 diz o que aconteceu com o formulário. */
function ErroDoLink({ error }) {
  if (!error) {
    return null;
  }

  if (toApiError(error).status === STATUS_NAO_ENCONTRADO) {
    return (
      <p className="border border-destructive/30 px-3 py-2 text-sm text-destructive" role="alert">
        {MENSAGEM_INDISPONIVEL}
      </p>
    );
  }

  return (
    <ApiErrorAlert error={error} id="formulario-link-erro" title="Não foi possível obter o link" />
  );
}

/**
 * Aba "Formulários" da ficha (FM2, `crm.formularios`): gera o link pessoal de
 * um formulário publicado e mostra o histórico. O token só vem dentro da `url`
 * do POST, então "Copiar de novo" pede de novo, e o back devolve o mesmo. As
 * respostas recebidas (FM4) abrem num dialog; a aberta mora no `LeadAbas`,
 * porque o histórico também abre uma.
 *
 * @param {{
 *   lead: import('../../types').Lead,
 *   nomePorId: Map<string, string>,
 *   respostaAberta: string | null,
 *   onAbrirResposta: (respostaId: string | null) => void,
 * }} props
 */
export function AbaFormularios({ lead, nomePorId, respostaAberta, onAbrirResposta }) {
  const { user } = useAuth();
  const gestao = podeVer({ roles: PAPEIS_GESTAO }, user);
  const disponiveisQuery = useFormulariosDisponiveis();
  const linksQuery = useLinksDaPessoa(lead.id);
  const respostasQuery = useRespostasDeFormulario(lead.id);
  const obter = useObterLink(lead.id);
  const revogar = useRevogarLink(lead.id);
  const [escolhido, setEscolhido] = useState('');
  const [obtido, setObtido] = useState(null);
  const [aRevogar, setARevogar] = useState(null);

  const erro = disponiveisQuery.error ?? linksQuery.error;

  if (isAccessError(erro)) {
    return <AcessoIndisponivel error={erro} />;
  }

  if (erro) {
    return <ApiErrorAlert error={erro} id="formularios-pessoa-erro" />;
  }

  if (disponiveisQuery.isPending || linksQuery.isPending) {
    return <Carregando />;
  }

  const disponiveis = disponiveisQuery.data;
  const links = linksQuery.data;
  const respostas = respostasQuery.data ?? RESPOSTAS_VAZIAS;
  const respostaDoLink = (linkId) => respostas.find((resposta) => resposta.linkId === linkId);
  const aberta = respostas.find((resposta) => resposta.id === respostaAberta) ?? null;
  const motivo = motivoSemEnvio(lead);
  const formId = disponiveis.some((formulario) => formulario.id === escolhido)
    ? escolhido
    : (disponiveis[0]?.id ?? '');

  function pedirLink(id, nome) {
    setObtido(null);
    obter.mutate(id, { onSuccess: (resposta) => setObtido({ ...resposta, formulario: nome }) });
  }

  return (
    <div className="grid gap-5">
      <section aria-labelledby="formularios-enviar-titulo" className="grid gap-2">
        <h3 className="text-sm font-semibold" id="formularios-enviar-titulo">
          Enviar um formulário
        </h3>
        {disponiveis.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum formulário ativo e publicado.{' '}
            {gestao && (
              <Link className="underline underline-offset-4" to={caminhoDaSecao('formularios')}>
                Montar em Configurações › Formulários
              </Link>
            )}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <SelectSimples
              aria-label="Formulário"
              className="w-full sm:w-64"
              disabled={Boolean(motivo)}
              onChange={(valor) => valor && setEscolhido(valor)}
              opcoes={disponiveis.map((formulario) => ({
                valor: formulario.id,
                rotulo: `${formulario.nome} (v${formulario.versao})`,
              }))}
              value={formId}
            />
            <ControleTravado motivo={motivo} motivoId="formularios-gerar-motivo">
              <Button
                aria-busy={obter.isPending}
                aria-describedby={motivo ? 'formularios-gerar-motivo' : undefined}
                className={motivo ? 'pointer-events-none' : undefined}
                disabled={Boolean(motivo) || !formId || obter.isPending}
                onClick={() =>
                  pedirLink(formId, disponiveis.find((formulario) => formulario.id === formId).nome)
                }
                type="button"
                loading={obter.isPending}
                loadingText="Gerando…"
              >
                <Link2 aria-hidden="true" />
                {'Gerar link'}
              </Button>
            </ControleTravado>
          </div>
        )}
        <ErroDoLink error={obter.error} />
        {obtido && (
          <EnvioDoLink
            key={obtido.url}
            obtido={obtido}
            primeiroNome={primeiroNomeDoLead(lead)}
            telefone={lead.telefone}
          />
        )}
      </section>

      <section aria-labelledby="formularios-respostas-titulo" className="grid gap-2">
        <h3 className="text-sm font-semibold" id="formularios-respostas-titulo">
          Respostas recebidas
        </h3>
        {respostasQuery.isPending && <LoadingState inline label="Carregando respostas…" />}
        <ApiErrorAlert error={respostasQuery.error} id="formularios-respostas-erro" />
        {respostas.length === 0 ? (
          !respostasQuery.isPending &&
          !respostasQuery.error && (
            <p className="text-sm text-muted-foreground">Nenhuma resposta ainda.</p>
          )
        ) : (
          <ul className="grid border border-border">
            {respostas.map((resposta) => (
              <li className="border-b border-border last:border-b-0" key={resposta.id}>
                <button
                  className="grid w-full gap-1 px-3 py-2 text-left text-sm outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
                  onClick={() => onAbrirResposta(resposta.id)}
                  type="button"
                >
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span>
                      <span className="font-medium">{resposta.formulario.nome}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        v{resposta.versao.versao}
                      </span>
                    </span>
                    {precisaRevisar(resposta) && (
                      <span className="border border-foreground px-1.5 text-[11px] uppercase">
                        Revisar
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    <span className="tabular-nums">{formatarInstante(resposta.respondidoEm)}</span>
                    {' · '}
                    {rotuloDeQuemPreencheu(resposta)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <TodosOsAlertas leadId={lead.id} onAbrirResposta={onAbrirResposta} />

      <section aria-labelledby="formularios-historico-titulo" className="grid gap-2">
        <h3 className="text-sm font-semibold" id="formularios-historico-titulo">
          Links enviados
        </h3>
        {links.length === 0 ? (
          <EmptyState
            description="Os links gerados para esta pessoa aparecem aqui."
            icon={ClipboardList}
            title="Nenhum link ainda"
          />
        ) : (
          <ul className="grid border border-border">
            {links.map((link) => {
              const { rotulo, acao } = estadoDoLink(link);
              const criadoPor = link.criadoPor
                ? (nomePorId.get(link.criadoPor) ?? 'Usuário removido')
                : null;

              return (
                <li
                  className="grid gap-2 border-b border-border px-3 py-2 text-sm last:border-b-0"
                  key={link.id}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span>
                      <span className="font-medium">{link.formulario.nome}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        v{link.versao.versao}
                      </span>
                    </span>
                    <span className="text-xs">{rotulo}</span>
                  </div>
                  <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex gap-1">
                      <dt>Criado em</dt>
                      <dd className="tabular-nums">{formatarInstante(link.criadoEm)}</dd>
                    </div>
                    <div className="flex gap-1">
                      <dt>Vence em</dt>
                      <dd className="tabular-nums">{formatarInstante(link.expiraEm)}</dd>
                    </div>
                    {criadoPor && (
                      <div className="flex gap-1">
                        <dt>Por</dt>
                        <dd>{criadoPor}</dd>
                      </div>
                    )}
                  </dl>
                  {link.status === STATUS_LINK.RESPONDIDO && respostaDoLink(link.id) && (
                    <div>
                      <Button
                        onClick={() => onAbrirResposta(respostaDoLink(link.id).id)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Ver respostas
                        <span className="sr-only"> — {link.formulario.nome}</span>
                      </Button>
                    </div>
                  )}
                  {acao && !motivo && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={obter.isPending}
                        onClick={() => pedirLink(link.formulario.id, link.formulario.nome)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {acao === 'copiar' ? (
                          <Copy aria-hidden="true" />
                        ) : (
                          <RotateCcw aria-hidden="true" />
                        )}
                        {acao === 'copiar' ? 'Copiar de novo' : 'Gerar novo'}
                        <span className="sr-only"> — {link.formulario.nome}</span>
                      </Button>
                      {acao === 'copiar' && (
                        <Button
                          onClick={() => setARevogar(link)}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <XCircle aria-hidden="true" />
                          Revogar
                          <span className="sr-only"> — {link.formulario.nome}</span>
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <RespostaDialog
        lead={lead}
        nomePorId={nomePorId}
        onFechar={() => onAbrirResposta(null)}
        resposta={aberta}
      />

      {aRevogar && (
        <ConfirmationDialog
          busy={revogar.isPending}
          confirmLabel="Revogar"
          description={`O link de "${aRevogar.formulario.nome}" deixa de abrir na hora. Para enviar de novo, gere outro.`}
          onClose={() => setARevogar(null)}
          onConfirm={async () => {
            await revogar.mutateAsync(aRevogar.id);
            setObtido(null);
          }}
          pendingLabel="Revogando…"
          title="Revogar o link?"
        />
      )}
    </div>
  );
}

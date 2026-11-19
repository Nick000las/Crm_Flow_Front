import { Check } from 'lucide-react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { toApiError } from '@/services/api';
import { useAlertasDaPessoa, useMarcarAlertaVisto } from '../../hooks/use-links-formulario';
import { formatarInstante } from '../../lib/formatadores';
import { CaixaDoNivel, SeloAlerta } from '../selo-alerta';

const ALERTAS_VAZIOS = [];

/**
 * Um alerta: nível, texto e de onde veio. O genérico (o papel não vê o alvo)
 * não tem link para a resposta.
 *
 * @param {{
 *   alerta: import('../../lib/alertas-formulario').AlertaDaPessoa,
 *   onAbrirResposta: (respostaId: string) => void,
 *   marcar?: ReturnType<typeof useMarcarAlertaVisto>,
 * }} props sem `marcar`, só leitura (já visto)
 */
function ItemDoAlerta({ alerta, onAbrirResposta, marcar }) {
  const marcandoEste = marcar?.isPending && marcar.variables === alerta.id;
  const erroDeste = marcar?.error && marcar.variables === alerta.id ? marcar.error : null;
  const visto = Boolean(alerta.vistoEm);

  return (
    <CaixaDoNivel apagado={visto} className="grid gap-1.5 px-3 py-2 text-sm" nivel={alerta.nivel}>
      <div className="flex flex-wrap items-baseline gap-2">
        <SeloAlerta className="bg-background" nivel={alerta.nivel} />
        <span className="min-w-0 font-medium break-words text-foreground">{alerta.texto}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {alerta.formulario.nome}
        {' · '}
        <span className="font-mono tabular-nums">{formatarInstante(alerta.criadoEm)}</span>
        {visto && (
          <>
            {' · Visto em '}
            <span className="font-mono tabular-nums">{formatarInstante(alerta.vistoEm)}</span>
          </>
        )}
      </p>
      {(!alerta.generico || marcar) && (
        <div className="flex flex-wrap gap-2">
          {!alerta.generico && (
            <Button
              className="rounded-none bg-background"
              onClick={() => onAbrirResposta(alerta.respostaId)}
              size="sm"
              type="button"
              variant="outline"
            >
              Ver resposta
              <span className="sr-only"> do alerta {alerta.texto}</span>
            </Button>
          )}
          {marcar && (
            <Button
              aria-busy={marcandoEste}
              className="rounded-none"
              disabled={marcandoEste}
              onClick={() => marcar.mutate(alerta.id)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Check aria-hidden="true" />
              {marcandoEste ? 'Marcando…' : 'Marcar como visto'}
              <span className="sr-only"> — {alerta.texto}</span>
            </Button>
          )}
        </div>
      )}
      {erroDeste && (
        <p className="text-xs text-destructive" role="alert">
          {toApiError(erroDeste).message}
        </p>
      )}
    </CaixaDoNivel>
  );
}

/**
 * Topo da ficha (FM5): os alertas que **eu** ainda não vi. Marcar tira só para
 * mim. Sem alerta (ou enquanto carrega), não ocupa espaço; o erro aparece.
 *
 * @param {{ leadId: string, onAbrirResposta: (respostaId: string) => void }} props
 */
export function AlertasDaPessoa({ leadId, onAbrirResposta }) {
  const alertasQuery = useAlertasDaPessoa(leadId);
  const marcar = useMarcarAlertaVisto(leadId);
  const alertas = alertasQuery.data ?? ALERTAS_VAZIOS;

  if (alertasQuery.error) {
    return (
      <ApiErrorAlert
        className="mx-4 mb-3"
        error={alertasQuery.error}
        id="alertas-pessoa-erro"
        title="Não foi possível carregar os alertas"
      />
    );
  }
  if (alertas.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="alertas-pessoa-titulo" className="mx-4 mb-3 grid gap-1.5">
      <h3 className="sr-only" id="alertas-pessoa-titulo">
        Alertas do formulário
      </h3>
      <ul className="grid max-h-56 gap-1.5 overflow-y-auto">
        {alertas.map((alerta) => (
          <ItemDoAlerta
            alerta={alerta}
            key={alerta.id}
            marcar={marcar}
            onAbrirResposta={onAbrirResposta}
          />
        ))}
      </ul>
    </section>
  );
}

/**
 * Aba Formulários: todos os alertas da pessoa, os vistos com "Visto em". É por
 * aqui que se revê um alerta já marcado.
 *
 * @param {{ leadId: string, onAbrirResposta: (respostaId: string) => void }} props
 */
export function TodosOsAlertas({ leadId, onAbrirResposta }) {
  const alertasQuery = useAlertasDaPessoa(leadId, { todos: true });
  const marcar = useMarcarAlertaVisto(leadId);
  const alertas = alertasQuery.data ?? ALERTAS_VAZIOS;

  return (
    <section aria-labelledby="formularios-alertas-titulo" className="grid gap-2">
      <h3 className="text-sm font-semibold" id="formularios-alertas-titulo">
        Alertas
      </h3>
      <ApiErrorAlert error={alertasQuery.error} id="formularios-alertas-erro" />
      {alertas.length === 0 ? (
        !alertasQuery.isPending &&
        !alertasQuery.error && <p className="text-sm text-muted-foreground">Nenhum alerta.</p>
      ) : (
        <ul className="grid gap-1.5">
          {alertas.map((alerta) => (
            <ItemDoAlerta
              alerta={alerta}
              key={alerta.id}
              marcar={alerta.vistoEm ? undefined : marcar}
              onAbrirResposta={onAbrirResposta}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

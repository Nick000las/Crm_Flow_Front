import { History } from 'lucide-react';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { ModulePlaceholder } from '@/components/module-placeholder';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isAccessError } from '@/services/api';
import { useHistorico } from '../../hooks/use-historico';
import { formatarInstante } from '../../lib/formatadores';
import { autorDoEvento, frasesDoEvento } from '../../lib/historico';

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <span className="sr-only" role="status">Carregando histórico…</span>
      {Array.from({ length: 4 }, (_, indice) => (
        <Skeleton className="h-10 rounded-none" key={indice} />
      ))}
    </div>
  );
}

/** Um evento: "Ana mudou Status de Novo para Ganho", uma frase por campo. */
function Evento({ evento, nomePorId }) {
  const autor = autorDoEvento(evento);
  const frases = frasesDoEvento(evento, nomePorId);

  return (
    <li className="grid gap-0.5 border-b border-border py-2 last:border-b-0">
      <time className="font-mono text-xs text-muted-foreground tabular-nums" dateTime={evento.criadoEm}>
        {formatarInstante(evento.criadoEm)}
      </time>
      {frases.map((frase, indice) => (
        <p className="text-sm break-words" key={indice}>
          <span className="font-medium">{autor}</span> {frase}
        </p>
      ))}
    </li>
  );
}

/**
 * Aba "Histórico" do drawer (`crm.atividades`): lista simples dos eventos
 * do lead, do mais recente para o mais antigo. A timeline completa é o M16.
 *
 * @param {{ leadId: string, nomePorId: Map<string, string> }} props
 */
export function AbaHistorico({ leadId, nomePorId }) {
  const historico = useHistorico(leadId);

  if (isAccessError(historico.error)) return <AcessoIndisponivel error={historico.error} />;
  if (historico.isPending) return <Carregando />;
  if (historico.isError && !historico.data) return <ApiErrorAlert error={historico.error} id="historico-erro" />;

  const eventos = historico.data.pages.flatMap((pagina) => pagina.itens);

  if (eventos.length === 0) {
    return (
      <ModulePlaceholder
        description="As mudanças feitas no lead aparecem aqui."
        icon={History}
        title="Nenhum evento ainda"
      />
    );
  }

  return (
    <div className="grid gap-3">
      <ol>
        {eventos.map((evento) => (
          <Evento evento={evento} key={evento.id} nomePorId={nomePorId} />
        ))}
      </ol>

      {/* Erro ao carregar a próxima página: o que já veio continua na tela. */}
      <ApiErrorAlert error={historico.isFetchNextPageError ? historico.error : null} id="historico-mais-erro" />

      {historico.hasNextPage && (
        <div>
          <Button
            aria-busy={historico.isFetchingNextPage}
            disabled={historico.isFetchingNextPage}
            onClick={() => historico.fetchNextPage()}
            size="sm"
            variant="outline"
          >
            {historico.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
          </Button>
        </div>
      )}
    </div>
  );
}

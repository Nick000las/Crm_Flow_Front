import { Bell, BellOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatarInstante } from '@/modules/crm/lib/formatadores';
import { useMarcarComoLida, useMarcarTodasComoLidas, useNotificacoes } from '../hooks/use-notificacoes';
import {
  TAMANHO_NOTIFICACOES,
  destinoDaNotificacao,
  rotuloDoSino,
  textoDoContador,
  totalDePaginasNotificacoes,
} from '../lib/notificacoes';

const PRIMEIRA_PAGINA = 1;

function Carregando() {
  return (
    <div aria-busy="true" className="grid gap-1.5">
      <span className="sr-only" role="status">Carregando notificações…</span>
      {Array.from({ length: 3 }, (_, indice) => (
        <Skeleton className="h-12 rounded-none" key={indice} />
      ))}
    </div>
  );
}

/** Uma notificação: botão inteiro — marca como lida e leva ao destino. */
function ItemNotificacao({ notificacao, onAbrir }) {
  const naoLida = !notificacao.lida_em;

  return (
    <li className="bg-popover">
      <button
        className={cn(
          'grid w-full gap-0.5 border-l-2 px-2.5 py-2 text-left outline-none transition-colors duration-200',
          'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50',
          naoLida ? 'border-foreground' : 'border-transparent text-muted-foreground',
        )}
        onClick={() => onAbrir(notificacao)}
        type="button"
      >
        <span className={cn('text-sm', naoLida && 'font-medium text-foreground')}>
          {naoLida && <span className="sr-only">Não lida: </span>}
          {notificacao.titulo}
        </span>
        {notificacao.corpo && <span className="text-xs text-muted-foreground">{notificacao.corpo}</span>}
        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
          {formatarInstante(notificacao.created_at)}
        </span>
      </button>
    </li>
  );
}

/**
 * Sino do shell (core, sem flag): contador de não lidas, lista paginada e
 * "Marcar todas como lidas". Clicar numa notificação marca como lida e
 * navega para o destino dela (`destinoDaNotificacao`). Sem push: a lista
 * recarrega de tempos em tempos e ao abrir.
 *
 * @param {{ triggerClassName: string }} props classes do item do Rail
 */
export function SinoNotificacoes({ triggerClassName }) {
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [pagina, setPagina] = useState(PRIMEIRA_PAGINA);
  const query = useNotificacoes(pagina);
  const marcarLida = useMarcarComoLida();
  const marcarTodas = useMarcarTodasComoLidas();

  const dados = query.data;
  const naoLidas = dados?.naoLidas ?? 0;
  const contador = textoDoContador(naoLidas);
  const totalPaginas = totalDePaginasNotificacoes(dados?.total, TAMANHO_NOTIFICACOES);
  const rotulo = rotuloDoSino(naoLidas);

  function handleOpenChange(proximo) {
    setAberto(proximo);
    if (proximo) {
      setPagina(PRIMEIRA_PAGINA);
      marcarTodas.reset();
      query.refetch();
    }
  }

  function abrir(notificacao) {
    // Não espera o back: a navegação não depende de marcar como lida.
    if (!notificacao.lida_em) marcarLida.mutate(notificacao.id);

    const destino = destinoDaNotificacao(notificacao);
    if (destino) {
      setAberto(false);
      navigate(destino);
    }
  }

  return (
    <Popover onOpenChange={handleOpenChange} open={aberto}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger aria-label={rotulo} className={triggerClassName}>
              <Bell className="size-4.5" aria-hidden="true" />
              {contador && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 min-w-4 bg-background px-0.5 text-center font-mono text-[10px] leading-4 text-foreground tabular-nums"
                >
                  {contador}
                </span>
              )}
            </PopoverTrigger>
          }
        />
        <TooltipContent side="right">Notificações</TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        className="w-[min(22rem,calc(100vw-5rem))] gap-2 rounded-none p-2 shadow-none ring-border"
        side="right"
        sideOffset={8}
      >
        <div className="flex items-baseline justify-between gap-2 px-1">
          <PopoverTitle className="text-sm font-medium">Notificações</PopoverTitle>
          {naoLidas > 0 && (
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {naoLidas} {naoLidas === 1 ? 'não lida' : 'não lidas'}
            </span>
          )}
        </div>

        {query.isPending ? (
          <Carregando />
        ) : query.error ? (
          <ApiErrorAlert error={query.error} id="notificacoes-erro" title="Não foi possível carregar" />
        ) : dados.itens.length === 0 ? (
          <div className="grid justify-items-center gap-2 border border-dashed border-border px-4 py-8 text-center">
            <BellOff className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Nenhuma notificação.</p>
          </div>
        ) : (
          <ul
            aria-busy={query.isPlaceholderData}
            aria-label="Notificações"
            className="grid max-h-80 gap-px overflow-y-auto border border-border bg-border"
          >
            {dados.itens.map((notificacao) => (
              <ItemNotificacao key={notificacao.id} notificacao={notificacao} onAbrir={abrir} />
            ))}
          </ul>
        )}

        <ApiErrorAlert error={marcarTodas.error ?? marcarLida.error} id="notificacoes-marcar-erro" />

        <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
          <Button
            aria-busy={marcarTodas.isPending}
            className="h-7 rounded-none px-2 text-xs"
            disabled={naoLidas === 0 || marcarTodas.isPending}
            onClick={() => marcarTodas.mutate()}
            variant="ghost"
          >
            Marcar todas como lidas
          </Button>

          {totalPaginas > 1 && (
            <nav aria-label="Páginas de notificações" className="flex items-center gap-1">
              <Button
                aria-label="Página anterior"
                className="rounded-none"
                disabled={pagina <= PRIMEIRA_PAGINA}
                onClick={() => setPagina((atual) => atual - 1)}
                size="icon-sm"
                variant="ghost"
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {pagina}/{totalPaginas}
              </span>
              <Button
                aria-label="Próxima página"
                className="rounded-none"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((atual) => atual + 1)}
                size="icon-sm"
                variant="ghost"
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </nav>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

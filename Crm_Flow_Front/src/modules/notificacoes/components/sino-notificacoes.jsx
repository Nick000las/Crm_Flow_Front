/**
 * @file Sino do shell (core, sem flag): contador de não lidas, lista paginada e "Marcar todas
 * como lidas". Clicar numa notificação marca como lida e navega para o destino dela
 * (`destinoDaNotificacao`).
 */
import { useState } from 'react';
import { Bell, BellOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ApiErrorAlert } from '@/components/api-error-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatarInstante } from '@/modules/crm/lib/formatadores';

import {
  useMarcarComoLida,
  useMarcarTodasComoLidas,
  useNotificacoes,
} from '../hooks/use-notificacoes';
import {
  destinoDaNotificacao,
  rotuloDoSino,
  TAMANHO_NOTIFICACOES,
  textoDoContador,
  totalDePaginasNotificacoes,
} from '../lib/notificacoes';

const PRIMEIRA_PAGINA = 1;

function Carregando() {
  return (
    <div aria-busy="true" className="grid gap-1.5">
      <span className="sr-only" role="status">
        Carregando notificações…
      </span>
      {Array.from({ length: 3 }, (_, indice) => (
        <Skeleton className="h-14 rounded-lg" key={indice} />
      ))}
    </div>
  );
}

/** Uma notificação: botão inteiro — marca como lida e leva ao destino. */
function ItemNotificacao({ notificacao, onAbrir }) {
  const naoLida = !notificacao.lida_em;

  return (
    <li>
      <button
        className={cn(
          'grid w-full gap-0.5 rounded-lg border-l-2 px-2.5 py-2 text-left outline-none transition-colors duration-150',
          'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50',
          naoLida ? 'border-primary bg-primary/[0.04]' : 'border-transparent text-muted-foreground',
        )}
        onClick={() => onAbrir(notificacao)}
        type="button"
      >
        <span className={cn('text-sm leading-snug', naoLida && 'font-medium text-foreground')}>
          {naoLida && <span className="sr-only">Não lida: </span>}
          {notificacao.titulo}
        </span>
        {notificacao.corpo && (
          <span className="text-xs leading-relaxed text-muted-foreground">{notificacao.corpo}</span>
        )}
        <span className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
          {formatarInstante(notificacao.created_at)}
        </span>
      </button>
    </li>
  );
}

/**
 * Sino do shell (core, sem flag): contador de não lidas, lista paginada e
 * "Marcar todas como lidas". Clicar numa notificação marca como lida e
 * navega para o destino dela (`destinoDaNotificacao`).
 *
 * @param {{ triggerClassName: string }} props classes do item do Rail
 */
export function SinoNotificacoes({ triggerClassName, side = 'right' }) {
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
    if (!notificacao.lida_em) {
      marcarLida.mutate(notificacao.id);
    }

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
                  className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 font-semibold text-primary-foreground shadow-xs tabular-nums"
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
        className="w-[min(23rem,calc(100vw-5rem))] gap-2.5 rounded-xl border border-border bg-popover p-3 shadow-lg"
        side={side}
        sideOffset={10}
      >
        <div className="flex items-center justify-between gap-2 px-0.5">
          <PopoverTitle className="text-sm font-semibold tracking-tight">Notificações</PopoverTitle>
          {naoLidas > 0 && (
            <Badge variant="secondary" className="text-[11px] tabular-nums">
              {naoLidas} {naoLidas === 1 ? 'não lida' : 'não lidas'}
            </Badge>
          )}
        </div>

        {query.isPending ? (
          <Carregando />
        ) : query.error ? (
          <ApiErrorAlert
            error={query.error}
            id="notificacoes-erro"
            title="Não foi possível carregar"
          />
        ) : dados.itens.length === 0 ? (
          <div className="grid justify-items-center gap-2 rounded-lg border border-dashed border-border bg-surface/60 px-4 py-8 text-center">
            <BellOff className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Nenhuma notificação por enquanto.</p>
          </div>
        ) : (
          <ul
            aria-busy={query.isPlaceholderData}
            aria-label="Notificações"
            className="grid max-h-80 gap-1 overflow-y-auto pr-0.5"
          >
            {dados.itens.map((notificacao) => (
              <ItemNotificacao key={notificacao.id} notificacao={notificacao} onAbrir={abrir} />
            ))}
          </ul>
        )}

        <ApiErrorAlert
          error={marcarTodas.error ?? marcarLida.error}
          id="notificacoes-marcar-erro"
        />

        <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
          <Button
            aria-busy={marcarTodas.isPending}
            size="xs"
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
                disabled={pagina <= PRIMEIRA_PAGINA}
                onClick={() => setPagina((atual) => atual - 1)}
                size="icon-xs"
                variant="ghost"
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {pagina}/{totalPaginas}
              </span>
              <Button
                aria-label="Próxima página"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((atual) => atual + 1)}
                size="icon-xs"
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

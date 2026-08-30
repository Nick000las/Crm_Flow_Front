/**
 * @file Um card. `restrito`: o back não descreveu o registro para este papel, então não abre
 * nem move. Quem decide se arrasta é o back (`podeMover`).
 */
import { useDraggable } from '@dnd-kit/core';
import { ArrowRightLeft, UserRound } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { CHAVE_RESPONSAVEL } from '../../lib/form-lead';
import { textoDoCard } from '../../lib/quadro';
import { idCardDoQuadro } from '../../rotas';
import { SeloAlerta } from '../selo-alerta';
import { SeloEsfriando } from '../selo-esfriando';

const SELOS = Object.freeze({
  ESFRIANDO: 'esfriando',
  ORIGEM_REABERTA: 'origem_reaberta',
  ALERTA_FORMULARIO: 'alerta_formulario',
});
const CAIXA =
  'grid gap-2.5 rounded-xl p-3.5 text-sm shadow-xs transition-[border-color,box-shadow] duration-150 hover:border-border-strong hover:shadow-sm';

const comTexto = (itens, campos, nomePorId) =>
  (itens ?? [])
    .map((item) => ({ item, texto: textoDoCard(item, campos, nomePorId) }))
    .filter(({ texto }) => texto);

/**
 * Um selo do card. O de alerta (FM5) traz só o nível mais grave que eu não vi,
 * nunca o texto. Tipo desconhecido não aparece.
 */
function Selo({ selo }) {
  switch (selo.tipo) {
    case SELOS.ORIGEM_REABERTA:
      return (
        <span className="inline-flex items-center rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          Venda reaberta
        </span>
      );
    case SELOS.ESFRIANDO:
      return <SeloEsfriando esfriandoDesde={selo.desde} />;
    case SELOS.ALERTA_FORMULARIO:
      return <SeloAlerta nivel={selo.nivel} prefixo="Alerta do formulário" />;
    default:
      return null;
  }
}

/**
 * Conteúdo do card, também usado no `DragOverlay`, onde não há botões.
 *
 * @param {{
 *   card: import('../../api/quadro.api').CardQuadro,
 *   campos: import('../../types').Campo[],
 *   nomePorId: Map<string, string>,
 *   titulo: import('react').ReactNode,
 * }} props
 */
function CorpoDoCard({ card, campos, nomePorId, titulo }) {
  const subtitulo = comTexto(card.subtitulo, campos, nomePorId);
  const destaques = comTexto(card.destaques, campos, nomePorId);
  const responsavelNoLayout = [...subtitulo, ...destaques].some(
    ({ item }) => item.chave === CHAVE_RESPONSAVEL,
  );
  const responsavel =
    card.responsavelId && !responsavelNoLayout
      ? (nomePorId.get(card.responsavelId) ?? 'Usuário removido')
      : null;
  const selos = card.selos ?? [];

  return (
    <>
      {titulo}
      {card.tituloOportunidade && (
        <p className="break-words text-muted-foreground">{card.tituloOportunidade}</p>
      )}
      {subtitulo.map(({ item, texto }) => (
        <p className="truncate text-xs text-muted-foreground" key={item.ref}>
          <span className="sr-only">{item.label}: </span>
          {texto}
        </p>
      ))}
      {destaques.length > 0 && (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 rounded-lg bg-muted/35 px-2.5 py-2 text-xs">
          {destaques.map(({ item, texto }) => (
            <div className="contents" key={item.ref}>
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="truncate text-right font-medium text-foreground tabular-nums">
                {texto}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {responsavel && (
        <p className="flex items-center gap-1.5 truncate border-t border-border/60 pt-2 text-xs text-muted-foreground">
          <UserRound className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
          <span className="truncate">{responsavel}</span>
        </p>
      )}
      {selos.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selos.map((selo) => (
            <Selo key={selo.tipo} selo={selo} />
          ))}
        </div>
      )}
    </>
  );
}

/** Cópia do card que acompanha o ponteiro. */
export function CardArrastado({ card, campos, nomePorId }) {
  return (
    <Card layout="plain" className={cn(CAIXA, 'w-64 cursor-grabbing')}>
      <CorpoDoCard
        campos={campos}
        card={card}
        nomePorId={nomePorId}
        titulo={<p className="font-medium break-words">{card.titulo}</p>}
      />
    </Card>
  );
}

/**
 * Menu "Mover para…": o caminho do teclado e do toque, com os mesmos destinos
 * do arraste.
 */
function MenuMover({ titulo, destinos, onMover }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Mover ${titulo}`}
        className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
        title="Mover para…"
      >
        <ArrowRightLeft aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {destinos.map((coluna) => (
          <DropdownMenuItem key={coluna.ref} onClick={() => onMover(coluna)}>
            {coluna.nome}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Um card. `restrito`: o back não descreveu o registro para este papel, então
 * não abre nem move. Quem decide se arrasta é o back (`podeMover`).
 *
 * @param {{
 *   card: import('../../api/quadro.api').CardQuadro,
 *   colunaRef: string,
 *   destinos: import('../../api/quadro.api').ColunaQuadro[],
 *   campos: import('../../types').Campo[],
 *   nomePorId: Map<string, string>,
 *   onAbrir: () => void,
 *   onMover: (coluna: import('../../api/quadro.api').ColunaQuadro) => void,
 * }} props
 */
export function CardQuadro({ card, colunaRef, destinos, campos, nomePorId, onAbrir, onMover }) {
  const arrastavel = Boolean(card.podeMover) && !card.restrito;
  const { listeners, setNodeRef, isDragging } = useDraggable({
    id: card.entidadeId,
    data: { card, colunaRef },
    disabled: !arrastavel,
  });

  if (card.restrito) {
    return (
      <Card as="li" layout="plain" className={cn(CAIXA, 'text-muted-foreground')}>
        Registro restrito
      </Card>
    );
  }

  return (
    <Card
      as="li"
      layout="plain"
      {...listeners}
      className={cn(
        CAIXA,
        arrastavel ? 'cursor-grab' : 'cursor-pointer',
        isDragging && 'opacity-40',
      )}
      onClick={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest('button, a, input, [role="menuitem"]')
        ) {
          return;
        }

        onAbrir();
      }}
      ref={setNodeRef}
    >
      <CorpoDoCard
        campos={campos}
        card={card}
        nomePorId={nomePorId}
        titulo={
          <div className="flex items-start justify-between gap-1">
            <button
              className="min-w-0 cursor-pointer text-left text-sm font-semibold leading-snug break-words text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50"
              id={idCardDoQuadro(card.entidadeId)}
              onClick={onAbrir}
              type="button"
            >
              {card.titulo}
            </button>
            {arrastavel && destinos.length > 0 && (
              <MenuMover destinos={destinos} onMover={onMover} titulo={card.titulo} />
            )}
          </div>
        }
      />
    </Card>
  );
}

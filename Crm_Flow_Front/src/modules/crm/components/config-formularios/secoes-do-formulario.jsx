/**
 * @file Seções e itens do formulário: campos do CRM e perguntas próprias. Um `DndContext` só,
 * com um `SortableContext` por seção: o item arrasta dentro da seção e para outra. Teclado: o
 * puxador, ↑/↓ e o seletor "Seção".
 */
import { useCallback, useRef, useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { MessageSquarePlus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { canScrollDragArea, dragBoundsModifier } from '@/lib/drag-bounds';
import { cn } from '@/lib/utils';

import {
  adicionarItem,
  adicionarPergunta,
  adicionarSecao,
  alterarItem,
  camposDisponiveis,
  editarPergunta,
  moverItem,
  moverSecao,
  removerItem,
  removerSecao,
  renomearSecao,
  rotuloDoItem,
} from '../../lib/formularios';
import { caminhoDaSecao } from '../../lib/secoes-configuracoes';
import { BotaoIcone } from '../botao-icone';
import { BotoesOrdem } from '../ordenavel/botoes-ordem';
import { SelectSimples } from '../select-simples';
import { ItemDoFormulario } from './item-do-formulario';
import { PerguntaDialog } from './pergunta-dialog';

// Um clique no puxador não deve virar arrasto sem querer.
const DISTANCIA_MINIMA_PX = 4;
const PREFIXO_SECAO_VAZIA = 'secao-vazia:';

const INSTRUCOES =
  'Para mover um item, pressione espaço ou Enter no puxador, use as setas e pressione ' +
  'espaço ou Enter de novo para soltar. Esc cancela. O seletor "Seção" de cada item também move.';

const nomeDaSecao = (secao, indice) => secao.titulo.trim() || `Seção ${indice + 1}`;

/**
 * Seção vazia: sem item, não haveria onde soltar.
 *
 * @param {{ chaveLocal: string, children: import('react').ReactNode }} props
 */
function AlvoDaSecaoVazia({ chaveLocal, children }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${PREFIXO_SECAO_VAZIA}${chaveLocal}`,
    data: { secao: chaveLocal },
  });

  return (
    <div
      className={cn(
        'border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground transition-colors duration-200',
        isOver && 'border-primary ring-2 ring-primary/20',
      )}
      ref={setNodeRef}
    >
      {children}
    </div>
  );
}

/**
 * Seções e itens do formulário: campos do CRM e perguntas próprias. Um
 * `DndContext` só, com um `SortableContext` por seção: o item arrasta dentro
 * da seção e para outra. Teclado: o puxador, ↑/↓ e o seletor "Seção".
 *
 * @param {{
 *   rascunho: import('../../lib/formularios').RascunhoNoForm,
 *   elegiveis: import('../../lib/formularios').CampoElegivel[],
 *   indisponiveis: Set<string>,
 *   errosPorItem: Record<string, import('../../lib/formularios').ErrosDoItem>,
 *   errosPorSecao: Record<string, string>,
 *   erroDasSecoes: string | null,
 *   onChange: (rascunho: import('../../lib/formularios').RascunhoNoForm) => void,
 * }} props
 */
export function SecoesDoFormulario({
  rascunho,
  elegiveis,
  indisponiveis,
  errosPorItem,
  errosPorSecao,
  erroDasSecoes,
  onChange,
}) {
  const boundary = useRef(null);
  const limitDrag = useCallback((args) => dragBoundsModifier(() => boundary.current)(args), []);
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DISTANCIA_MINIMA_PX } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  // `secao` = criar nela; `chaveLocal` = editar a pergunta.
  const [perguntaAberta, setPerguntaAberta] = useState(null);
  const campoPorId = new Map(elegiveis.map((campo) => [campo.id, campo]));
  const disponiveis = camposDisponiveis(elegiveis, rascunho);
  const itens = rascunho.secoes.flatMap((secao) => secao.itens);
  const opcoesDeSecao = rascunho.secoes.map((secao, indice) => ({
    valor: secao.chaveLocal,
    rotulo: nomeDaSecao(secao, indice),
  }));
  const rotuloDe = (chaveLocal) => {
    const item = itens.find((atual) => atual.chaveLocal === chaveLocal);

    return item ? rotuloDoItem(item, campoPorId) : 'Item';
  };
  const rotuloDoAlvo = (over) => {
    const secao = over.data.current?.secao ?? over.data.current?.sortable?.containerId;
    const indice = rascunho.secoes.findIndex((atual) => atual.chaveLocal === secao);
    const nome = indice >= 0 ? nomeDaSecao(rascunho.secoes[indice], indice) : 'seção';
    const posicao = over.data.current?.sortable?.index;

    return posicao === undefined ? nome : `${nome}, posição ${posicao + 1}`;
  };
  const emEdicao = perguntaAberta?.chaveLocal
    ? itens.find((item) => item.chaveLocal === perguntaAberta.chaveLocal)?.pergunta
    : null;

  function aoSoltar({ active, over }) {
    if (!over || active.id === over.id) {
      return;
    }

    const daSecaoVazia = over.data.current?.secao;
    const sortable = over.data.current?.sortable;
    const destino = daSecaoVazia
      ? { secao: daSecaoVazia, indice: 0 }
      : sortable && { secao: sortable.containerId, indice: sortable.index };

    if (destino) {
      onChange(moverItem(rascunho, String(active.id), destino));
    }
  }

  function confirmarPergunta(pergunta) {
    if (perguntaAberta?.chaveLocal) {
      onChange(editarPergunta(rascunho, perguntaAberta.chaveLocal, pergunta));
    } else if (perguntaAberta?.secao) {
      onChange(adicionarPergunta(rascunho, perguntaAberta.secao, pergunta));
    }
  }

  return (
    <div className="grid gap-3" ref={boundary} data-drag-boundary>
      <DndContext
        accessibility={{
          announcements: {
            onDragStart: ({ active }) => `${rotuloDe(active.id)} selecionado.`,
            onDragOver: ({ active, over }) =>
              over
                ? `${rotuloDe(active.id)} sobre ${rotuloDoAlvo(over)}.`
                : `${rotuloDe(active.id)} fora das seções.`,
            onDragEnd: ({ active, over }) =>
              over
                ? `${rotuloDe(active.id)} solto em ${rotuloDoAlvo(over)}.`
                : `${rotuloDe(active.id)} solto.`,
            onDragCancel: ({ active }) =>
              `Movimento cancelado. ${rotuloDe(active.id)} voltou ao lugar.`,
          },
          screenReaderInstructions: { draggable: INSTRUCOES },
        }}
        collisionDetection={closestCenter}
        modifiers={[limitDrag]}
        autoScroll={{ canScroll: (element) => canScrollDragArea(element, boundary.current) }}
        onDragEnd={aoSoltar}
        sensors={sensores}
      >
        {rascunho.secoes.map((secao, indiceSecao) => {
          const nome = nomeDaSecao(secao, indiceSecao);
          const idTitulo = `formulario-secao-${secao.chaveLocal}-titulo`;
          const erroDaSecao = errosPorSecao[secao.chaveLocal];

          return (
            <section
              aria-label={nome}
              className="grid gap-3 rounded-xl border border-border bg-surface p-4"
              key={secao.chaveLocal}
            >
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor={idTitulo}>
                  Título da {nome}
                </label>
                <Input
                  aria-describedby={erroDaSecao ? `${idTitulo}-erro` : undefined}
                  aria-invalid={erroDaSecao ? true : undefined}
                  className="min-w-48 flex-1 bg-background"
                  id={idTitulo}
                  onChange={(event) =>
                    onChange(renomearSecao(rascunho, secao.chaveLocal, event.target.value))
                  }
                  placeholder="Título da seção (opcional)"
                  value={secao.titulo}
                />
                <BotoesOrdem
                  desabilitado={false}
                  indice={indiceSecao}
                  onMover={(de, para) => onChange(moverSecao(rascunho, de, para))}
                  rotulo={nome}
                  total={rascunho.secoes.length}
                />
                <BotaoIcone
                  icone={Trash2}
                  variant="destructive"
                  onClick={() => onChange(removerSecao(rascunho, secao.chaveLocal))}
                  rotulo={`Remover ${nome} (os itens saem do formulário)`}
                />
              </div>
              {erroDaSecao && (
                <p className="text-xs text-destructive" id={`${idTitulo}-erro`} role="alert">
                  {erroDaSecao}
                </p>
              )}

              <SortableContext
                id={secao.chaveLocal}
                items={secao.itens.map((item) => item.chaveLocal)}
                strategy={verticalListSortingStrategy}
              >
                {secao.itens.length === 0 ? (
                  <AlvoDaSecaoVazia chaveLocal={secao.chaveLocal}>
                    Arraste um item para cá, adicione um campo do CRM ou uma pergunta.
                  </AlvoDaSecaoVazia>
                ) : (
                  <ul className="grid gap-2">
                    {secao.itens.map((item, indice) => (
                      <ItemDoFormulario
                        campo={'campoId' in item ? campoPorId.get(item.campoId) : undefined}
                        erros={errosPorItem[item.chaveLocal]}
                        indice={indice}
                        indisponivel={indisponiveis.has(item.chaveLocal)}
                        item={item}
                        key={item.chaveLocal}
                        onAlterar={(mudancas) =>
                          onChange(alterarItem(rascunho, item.chaveLocal, mudancas))
                        }
                        onEditarPergunta={() => setPerguntaAberta({ chaveLocal: item.chaveLocal })}
                        onMover={(destino) =>
                          onChange(moverItem(rascunho, item.chaveLocal, destino))
                        }
                        onRemover={() => onChange(removerItem(rascunho, item.chaveLocal))}
                        rotulo={rotuloDoItem(item, campoPorId)}
                        secao={secao.chaveLocal}
                        secoes={opcoesDeSecao}
                        total={secao.itens.length}
                      />
                    ))}
                  </ul>
                )}
              </SortableContext>

              <div className="flex flex-wrap items-center gap-2">
                {disponiveis.length > 0 && (
                  <SelectSimples
                    aria-label={`Adicionar campo do CRM em ${nome}`}
                    className="w-full bg-background sm:w-72"
                    onChange={(campoId) => {
                      const campo = campoPorId.get(campoId);

                      if (campo) {
                        onChange(adicionarItem(rascunho, secao.chaveLocal, campo));
                      }
                    }}
                    opcoes={disponiveis.map((campo) => ({
                      valor: campo.id,
                      rotulo: campo.sensivel ? `${campo.label} (sensível)` : campo.label,
                    }))}
                    placeholder="Adicionar campo do CRM…"
                    value=""
                  />
                )}
                <Button
                  className="bg-background"
                  onClick={() => setPerguntaAberta({ secao: secao.chaveLocal })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <MessageSquarePlus aria-hidden="true" />
                  Adicionar pergunta
                  <span className="sr-only"> em {nome}</span>
                </Button>
              </div>
              {disponiveis.length === 0 && indiceSecao === rascunho.secoes.length - 1 && (
                <p className="text-xs text-muted-foreground">
                  Todos os campos do CRM já estão no formulário. Para gravar a resposta num campo
                  novo da pessoa, crie um campo personalizado em{' '}
                  <Link className="underline underline-offset-4" to={caminhoDaSecao('campos')}>
                    Campos
                  </Link>
                  .
                </p>
              )}
            </section>
          );
        })}
      </DndContext>

      {erroDasSecoes && (
        <p className="text-sm text-destructive" role="alert">
          {erroDasSecoes}
        </p>
      )}
      <div>
        <Button onClick={() => onChange(adicionarSecao(rascunho))} type="button" variant="outline">
          <Plus aria-hidden="true" />
          Nova seção
        </Button>
      </div>

      <PerguntaDialog
        key={perguntaAberta?.chaveLocal ?? perguntaAberta?.secao ?? 'fechado'}
        onConfirmar={confirmarPergunta}
        onOpenChange={(aberto) => !aberto && setPerguntaAberta(null)}
        open={Boolean(perguntaAberta)}
        pergunta={emEdicao ?? null}
      />
    </div>
  );
}

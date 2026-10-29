import { History } from 'lucide-react';
import { useState } from 'react';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { ModulePlaceholder } from '@/components/module-placeholder';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { isAccessError } from '@/services/api';
import { useCategoriasHistorico, useHistorico } from '../../hooks/use-historico';
import { formatarInstante } from '../../lib/formatadores';
import { autorDoEvento, detalheDoEvento, itensDoEvento, tituloDoEvento } from '../../lib/historico';

const CHIP_CLASS =
  'border px-2 py-1 text-xs outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/50';

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

function Chip({ ativo, onClick, children }) {
  return (
    <button
      aria-pressed={ativo}
      className={cn(
        CHIP_CLASS,
        ativo ? 'border-foreground bg-muted font-medium' : 'border-border text-muted-foreground hover:text-foreground',
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

/**
 * Filtro por categoria (`crm.timeline`): várias ao mesmo tempo (OU);
 * "Todas" limpa. Sem as categorias (flag desligada, erro), não aparece.
 */
function FiltroCategorias({ categorias, selecionadas, onChange }) {
  function alternar(chave) {
    const proximas = new Set(selecionadas);
    if (proximas.has(chave)) proximas.delete(chave);
    else proximas.add(chave);
    onChange(proximas);
  }

  return (
    <div aria-label="Filtrar histórico" className="flex flex-wrap gap-1.5" role="group">
      <Chip ativo={selecionadas.size === 0} onClick={() => onChange(new Set())}>
        Todas
      </Chip>
      {categorias.map((categoria) => (
        <Chip ativo={selecionadas.has(categoria.key)} key={categoria.key} onClick={() => alternar(categoria.key)}>
          {categoria.label}
        </Chip>
      ))}
    </div>
  );
}

/** Um lado do diff; vazio vira "vazio" em cinza. */
function Lado({ texto }) {
  return texto === null ? <span className="text-muted-foreground">vazio</span> : <span>{texto}</span>;
}

/**
 * Um evento da timeline: título ("Criado por Ana", "Arquivado"), data e
 * autor, a distribuição (no `criado`) e o diff ("Status: Novo → Ganho").
 */
function Evento({ evento, nomePorId }) {
  const { titulo, comAutor } = tituloDoEvento(evento);
  const detalhe = detalheDoEvento(evento);
  const itens = itensDoEvento(evento, nomePorId);

  return (
    <li className="relative grid gap-1 pb-4 pl-4 last:pb-0">
      <span aria-hidden="true" className="absolute top-1.5 -left-[3.5px] size-1.5 bg-foreground" />
      <p className="text-sm font-medium break-words">{titulo}</p>
      <p className="text-xs text-muted-foreground">
        <time className="font-mono tabular-nums" dateTime={evento.criadoEm}>
          {formatarInstante(evento.criadoEm)}
        </time>
        {!comAutor && ` · por ${autorDoEvento(evento)}`}
      </p>
      {detalhe && <p className="text-sm text-muted-foreground">{detalhe}</p>}
      {itens.length > 0 && (
        <ul className="grid gap-0.5 text-sm">
          {itens.map((item, indice) => (
            <li className="break-words" key={`${item.chave}-${indice}`}>
              <span className="text-muted-foreground">{item.label}:</span> <Lado texto={item.antes} />{' '}
              <span aria-hidden="true">→</span>
              <span className="sr-only">para</span> <Lado texto={item.depois} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Aba "Histórico" do drawer (`crm.atividades`): a timeline do lead, do mais
 * recente para o mais antigo. Com `crm.timeline`, chips por categoria
 * (`?categorias=`). O back já tira os campos que o papel não vê.
 *
 * @param {{ leadId: string, nomePorId: Map<string, string> }} props
 */
export function AbaHistorico({ leadId, nomePorId }) {
  const [selecionadas, setSelecionadas] = useState(() => new Set());
  const categoriasQuery = useCategoriasHistorico();
  const categorias = categoriasQuery.data ?? [];
  // Na ordem do back: a mesma seleção dá sempre a mesma key.
  const filtro = categorias.filter((categoria) => selecionadas.has(categoria.key)).map((categoria) => categoria.key);
  const historico = useHistorico(leadId, filtro);

  if (isAccessError(historico.error)) return <AcessoIndisponivel error={historico.error} />;
  if (historico.isPending) return <Carregando />;

  const chips = categorias.length > 0 && (
    <FiltroCategorias categorias={categorias} onChange={setSelecionadas} selecionadas={selecionadas} />
  );

  if (historico.isError && !historico.data) {
    return (
      <div className="grid gap-3">
        {chips}
        <ApiErrorAlert error={historico.error} id="historico-erro" />
      </div>
    );
  }

  const eventos = historico.data.pages.flatMap((pagina) => pagina.itens);
  const carregandoFiltro = historico.isPlaceholderData;

  return (
    <div className="grid gap-3">
      {chips}
      <span className="sr-only" role="status">
        {carregandoFiltro ? 'Carregando histórico…' : ''}
      </span>

      {eventos.length === 0 ? (
        filtro.length > 0 ? (
          <ModulePlaceholder
            description="Nenhum evento destas categorias neste lead."
            icon={History}
            title="Nenhum evento nestas categorias"
          >
            <Button onClick={() => setSelecionadas(new Set())} size="sm" variant="outline">
              Mostrar todos
            </Button>
          </ModulePlaceholder>
        ) : (
          <ModulePlaceholder
            description="As mudanças feitas no lead aparecem aqui."
            icon={History}
            title="Nenhum evento ainda"
          />
        )
      ) : (
        <ol
          aria-busy={carregandoFiltro}
          className={cn('ml-1 border-l border-border pt-0.5', carregandoFiltro && 'opacity-60')}
        >
          {eventos.map((evento) => (
            <Evento evento={evento} key={evento.id} nomePorId={nomePorId} />
          ))}
        </ol>
      )}

      {/* Erro ao carregar a próxima página: o que já veio continua na tela. */}
      <ApiErrorAlert error={historico.isFetchNextPageError ? historico.error : null} id="historico-mais-erro" />

      {historico.hasNextPage && !carregandoFiltro && (
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

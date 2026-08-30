import { LoadingState } from '@/components/loading-state';
import { X } from 'lucide-react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FORECAST } from '../../constants';
import { Paginacao } from '../paginacao';

const LINHAS_SKELETON = 5;

/**
 * Moldura da lista aberta (mês ou bloco): título, abas, ações, estados e
 * paginação. A tabela entra como `children`.
 *
 * @param {{
 *   titulo: string,
 *   abas?: { valor: string, rotulo: string }[],
 *   abaAtual?: string,
 *   onAba?: (valor: string) => void,
 *   carregando: boolean,
 *   erro?: unknown,
 *   total: number,
 *   pagina: number,
 *   tamanho: number,
 *   onPagina: (mudancas: { pagina?: number, tamanho?: number }) => void,
 *   onFechar: () => void,
 *   acoes?: import('react').ReactNode,
 *   children?: import('react').ReactNode,
 * }} props
 */
export function ListaDoForecast({
  titulo,
  abas,
  abaAtual,
  onAba,
  carregando,
  erro = null,
  total,
  pagina,
  tamanho,
  onPagina,
  onFechar,
  acoes,
  children,
}) {
  const comAbas = Array.isArray(abas) && abas.length === 2;

  return (
    <section
      aria-label={titulo}
      className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-xs"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-medium">{titulo}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {acoes}
          <Button aria-label="Fechar lista" onClick={onFechar} size="icon" variant="ghost">
            <X aria-hidden="true" />
          </Button>
        </div>
      </header>

      {comAbas && (
        <Tabs onValueChange={onAba} value={abaAtual}>
          <TabsList variant="line">
            {abas.map((aba) => (
              <TabsTrigger key={aba.valor} value={aba.valor}>
                {aba.rotulo}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {erro ? (
        <ApiErrorAlert error={erro} title="Não foi possível carregar a lista" />
      ) : carregando ? (
        <div aria-busy="true" className="grid gap-2">
          <LoadingState label="Carregando oportunidades…" />
          {Array.from({ length: LINHAS_SKELETON }, (_, linha) => (
            <Skeleton className="h-8 w-full" key={linha} />
          ))}
        </div>
      ) : total === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nenhuma oportunidade nesta lista.
        </p>
      ) : (
        <>
          {children}
          <Paginacao
            onChange={onPagina}
            pagina={pagina}
            rotuloTamanho="Oportunidades por página"
            tamanho={tamanho}
            tamanhos={FORECAST.TAMANHOS}
            total={total}
          />
        </>
      )}
    </section>
  );
}

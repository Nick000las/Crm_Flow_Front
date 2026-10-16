import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { lerValorDaColuna } from '../lib/colunas';
import { AcoesLead } from './acoes-lead';
import { CelulaLead } from './celula-lead';
import { LinkDoLead } from './link-do-lead';

const HEAD_CLASS =
  'font-mono text-[11px] font-normal uppercase tracking-wide text-muted-foreground';
const LINHAS_SKELETON = 8;

function Cabecalho({ colunas, comAcoes }) {
  return (
    <TableHeader>
      <TableRow>
        {colunas.map((coluna) => (
          <TableHead className={HEAD_CLASS} key={coluna.id} scope="col">
            {coluna.label}
          </TableHead>
        ))}
        {comAcoes && (
          <TableHead className="w-10" scope="col">
            <span className="sr-only">Ações</span>
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
  );
}

/** @param {{ colunas: import('../lib/colunas').Coluna[] }} props */
export function LeadsTableSkeleton({ colunas }) {
  return (
    <div className="overflow-x-auto border border-border" aria-busy="true">
      <span className="sr-only" role="status">
        Carregando leads…
      </span>
      <Table>
        <Cabecalho colunas={colunas} />
        <TableBody>
          {Array.from({ length: LINHAS_SKELETON }, (_, linha) => (
            <TableRow key={linha}>
              {colunas.map((coluna) => (
                <TableCell key={coluna.id}>
                  <Skeleton className="h-4 w-24 rounded-none" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Clique em controle interno (link, botão, menu) não deve abrir a linha. */
function cliqueEmControle(event) {
  return event.target instanceof Element && event.target.closest('a, button, [role="menuitem"]');
}

/**
 * A primeira coluna visível leva o link que abre o lead — ele existe mesmo
 * se o usuário esconder "Nome", e é o alvo do Enter e do foco de volta.
 * O clique no resto da linha é só atalho de mouse.
 *
 * @param {{
 *   colunas: import('../lib/colunas').Coluna[],
 *   leads: import('../types').Lead[],
 *   nomePorId: Map<string, string>,
 *   atualizando?: boolean,
 *   onAbrir: (id: string) => void,
 *   onEditar: (id: string) => void,
 *   onExcluir: (lead: import('../types').Lead) => void,
 * }} props
 */
export function LeadsTable({
  colunas,
  leads,
  nomePorId,
  atualizando = false,
  onAbrir,
  onEditar,
  onExcluir,
}) {
  return (
    <div
      className={cn(
        'overflow-x-auto border border-border transition-opacity duration-200',
        atualizando && 'opacity-60',
      )}
      aria-busy={atualizando}
    >
      <Table>
        <Cabecalho colunas={colunas} comAcoes />
        <TableBody>
          {leads.map((lead) => (
            <TableRow
              className="cursor-pointer hover:bg-muted/40"
              key={lead.id}
              onClick={(event) => !cliqueEmControle(event) && onAbrir(lead.id)}
            >
              {colunas.map((coluna, indice) => {
                const celula = (
                  <CelulaLead
                    coluna={coluna}
                    nomePorId={nomePorId}
                    // A 1ª coluna já é o link do lead: e-mail/URL nela viram texto.
                    semLink={indice === 0}
                    valor={lerValorDaColuna(lead, coluna)}
                  />
                );

                return (
                  <TableCell className={indice === 0 ? 'font-medium' : undefined} key={coluna.id}>
                    {indice === 0 ? <LinkDoLead lead={lead}>{celula}</LinkDoLead> : celula}
                  </TableCell>
                );
              })}
              <TableCell className="py-1 text-right">
                <AcoesLead
                  lead={lead}
                  onEditar={() => onEditar(lead.id)}
                  onExcluir={() => onExcluir(lead)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

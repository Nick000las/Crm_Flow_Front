import { RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { textoDaPurga } from '../lib/arquivo';
import { lerValorDaColuna } from '../lib/colunas';
import { tituloDoLead } from '../lib/layout';
import { ROTAS_CRM } from '../rotas';
import { AcoesLead } from './acoes-lead';
import { CelulaLead } from './celula-lead';
import { LinkDoLead } from './link-do-lead';

const HEAD_CLASS =
  'font-mono text-[11px] font-normal uppercase tracking-wide text-muted-foreground';
const LINHAS_SKELETON = 8;

function Cabecalho({ colunas, identificador, comAcoes, lixeira, comSelecao }) {
  return (
    <TableHeader>
      <TableRow>
        {comSelecao && (
          <TableHead className="w-10" scope="col">
            <span className="sr-only">Selecionar</span>
          </TableHead>
        )}
        {identificador && (
          <TableHead className={HEAD_CLASS} scope="col">
            {identificador.label}
          </TableHead>
        )}
        {colunas.map((coluna) => (
          <TableHead className={HEAD_CLASS} key={coluna.id} scope="col">
            {coluna.label}
          </TableHead>
        ))}
        {lixeira && (
          <TableHead className={HEAD_CLASS} scope="col">
            Exclusão
          </TableHead>
        )}
        {comAcoes && (
          <TableHead className="w-10" scope="col">
            <span className="sr-only">Ações</span>
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
  );
}

/**
 * @param {{
 *   colunas: import('../lib/colunas').Coluna[],
 *   identificador?: import('../lib/layout').ItemLayout | null,
 * }} props
 */
export function LeadsTableSkeleton({ colunas, identificador }) {
  return (
    <div className="overflow-x-auto border border-border" aria-busy="true">
      <span className="sr-only" role="status">
        Carregando leads…
      </span>
      <Table>
        <Cabecalho colunas={colunas} identificador={identificador} />
        <TableBody>
          {Array.from({ length: LINHAS_SKELETON }, (_, linha) => (
            <TableRow key={linha}>
              {identificador && (
                <TableCell>
                  <Skeleton className="h-4 w-32 rounded-none" />
                </TableCell>
              )}
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
 * @typedef {{
 *   ids: Set<string>,
 *   cheia: boolean,
 *   alternar: (lead: import('../types').Lead) => void,
 * }} SelecaoDaTabela  com `cheia`, só os marcados continuam clicáveis
 */

/**
 * Lead descartado numa mesclagem: não se restaura (409). O back garante
 * `mesclado_em_id` e `mesclado_em_nome` (o nome atual do que ficou) juntos;
 * o nome é o link para ele.
 */
function MescladoEm({ lead }) {
  return (
    <span className="text-xs">
      Mesclado em{' '}
      <Link
        className="underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        to={ROTAS_CRM.lead(lead.mesclado_em_id)}
      >
        {lead.mesclado_em_nome}
      </Link>
    </span>
  );
}

/** Lixeira: o lead não abre (o back dá 404); a ação da linha é restaurar. */
function Restaurar({ lead, titulo, restaurando, onRestaurar }) {
  return (
    <Button
      aria-busy={restaurando}
      aria-label={`Restaurar ${titulo}`}
      className="rounded-none"
      disabled={restaurando}
      onClick={() => onRestaurar(lead)}
      size="sm"
      variant="ghost"
    >
      <RotateCcw aria-hidden="true" />
      {restaurando ? 'Restaurando…' : 'Restaurar'}
    </Button>
  );
}

/**
 * O link que abre o lead fica na 1ª coluna — o alvo do Enter e do foco de
 * volta; o clique no resto da linha é só atalho de mouse. Com layout
 * (`identificador`), a 1ª coluna é sempre o identificador, fixa; sem, é a
 * primeira coluna visível (existe mesmo se o usuário esconder "Nome").
 * Na lixeira (`lixeira`), a linha não abre nada: sem link, com o prazo da
 * purga e "Restaurar" no lugar do menu.
 *
 * @param {{
 *   colunas: import('../lib/colunas').Coluna[],
 *   identificador?: import('../lib/layout').ItemLayout | null,
 *   leads: import('../types').Lead[],
 *   nomePorId: Map<string, string>,
 *   atualizando?: boolean,
 *   onAbrir: (id: string) => void,
 *   onEditar: (id: string) => void,
 *   onExcluir: (lead: import('../types').Lead) => void,
 *   onArquivar?: (lead: import('../types').Lead) => void,
 *   onDesarquivar?: (lead: import('../types').Lead) => void,
 *   lixeira?: boolean,
 *   onRestaurar?: (lead: import('../types').Lead) => void,
 *   restaurandoId?: string | null,
 *   onMesclar?: (lead: import('../types').Lead) => void,
 *   selecao?: SelecaoDaTabela | null,
 * }} props `selecao` (mesclar 2 leads) põe um checkbox por linha
 */
export function LeadsTable({
  colunas,
  identificador,
  leads,
  nomePorId,
  atualizando = false,
  onAbrir,
  onEditar,
  onExcluir,
  onArquivar,
  onDesarquivar,
  lixeira = false,
  onRestaurar,
  restaurandoId = null,
  onMesclar,
  selecao = null,
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
        <Cabecalho
          colunas={colunas}
          comAcoes
          comSelecao={Boolean(selecao)}
          identificador={identificador}
          lixeira={lixeira}
        />
        <TableBody>
          {leads.map((lead) => {
            const titulo = tituloDoLead(lead, identificador);

            return (
              <TableRow
                className={lixeira ? undefined : 'cursor-pointer hover:bg-muted/40'}
                key={lead.id}
                onClick={lixeira ? undefined : (event) => !cliqueEmControle(event) && onAbrir(lead.id)}
              >
                {selecao && (
                  <TableCell className="py-1">
                    <Checkbox
                      aria-label={`Selecionar ${titulo}`}
                      checked={selecao.ids.has(lead.id)}
                      disabled={selecao.cheia && !selecao.ids.has(lead.id)}
                      onCheckedChange={() => selecao.alternar(lead)}
                    />
                  </TableCell>
                )}
                {identificador && (
                  <TableCell className="font-medium">
                    {lixeira ? (
                      titulo
                    ) : (
                      <LinkDoLead lead={lead} titulo={titulo}>
                        {titulo}
                      </LinkDoLead>
                    )}
                  </TableCell>
                )}
                {colunas.map((coluna, indice) => {
                  const comLink = !lixeira && !identificador && indice === 0;
                  const celula = (
                    <CelulaLead
                      coluna={coluna}
                      nomePorId={nomePorId}
                      // Célula dentro do link do lead: e-mail/URL nela viram texto.
                      semLink={comLink}
                      valor={lerValorDaColuna(lead, coluna)}
                    />
                  );
  
                  return (
                    <TableCell className={comLink ? 'font-medium' : undefined} key={coluna.id}>
                      {comLink ? <LinkDoLead lead={lead}>{celula}</LinkDoLead> : celula}
                    </TableCell>
                  );
                })}
                {lixeira && (
                  <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                    {lead.mesclado_em_id ? <MescladoEm lead={lead} /> : textoDaPurga(lead.purga_em)}
                  </TableCell>
                )}
                <TableCell className="py-1 text-right">
                  {lixeira && lead.mesclado_em_id ? null : lixeira ? (
                    <Restaurar
                      lead={lead}
                      onRestaurar={onRestaurar}
                      restaurando={restaurandoId === lead.id}
                      titulo={titulo}
                    />
                  ) : (
                    <AcoesLead
                      lead={lead}
                      onArquivar={onArquivar && (() => onArquivar(lead))}
                      onDesarquivar={onDesarquivar && (() => onDesarquivar(lead))}
                      onEditar={() => onEditar(lead.id)}
                      onExcluir={() => onExcluir(lead)}
                      onMesclar={onMesclar && (() => onMesclar(lead))}
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

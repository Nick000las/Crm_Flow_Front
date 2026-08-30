import { estadoDaVisao, visaoDoEstado } from '../lib/url-state';
import { BuscaLeads } from './busca-leads';
import { ConstrutorFiltro } from './construtor-filtro';
import { SeletorColunas } from './seletor-colunas';
import { ViewsMenu } from './views-menu';

const totalFormatter = new Intl.NumberFormat('pt-BR');

/**
 * Busca, filtros, views e colunas da lista. Tudo que muda a consulta passa
 * por `atualizar` (URL) e volta para a primeira página.
 *
 * @param {{
 *   estado: import('../lib/url-state').EstadoLista,
 *   atualizar: (mudancas: Partial<import('../lib/url-state').EstadoLista>) => void,
 *   campos: import('../types').Campo[],
 *   usuarios: { id: string, nome: string }[],
 *   colunas: import('../lib/colunas').Coluna[],
 *   colunasSelecionadas: string[],
 *   onAlternarColuna: (id: string) => void,
 *   chavesComErro: Set<string>,
 *   total: number | undefined,
 *   placeholderBusca: string,
 * }} props
 */
export function LeadsToolbar({
  estado,
  atualizar,
  campos,
  usuarios,
  colunas,
  colunasSelecionadas,
  onAlternarColuna,
  chavesComErro,
  total,
  placeholderBusca,
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <BuscaLeads
        busca={estado.busca}
        onBuscaChange={(busca) => atualizar({ busca, pagina: 1 })}
        placeholder={placeholderBusca}
      />
      <ConstrutorFiltro
        campos={campos}
        chavesComErro={chavesComErro}
        filtro={estado.filtro}
        onAplicar={(filtro) => atualizar({ filtro, pagina: 1 })}
        usuarios={usuarios}
      />
      {/* A view grava e reabre também a situação (Arquivados, Lixeira). */}
      <ViewsMenu
        onAplicar={(filtros) => atualizar(estadoDaVisao(filtros))}
        visaoAtual={visaoDoEstado(estado)}
      />
      <SeletorColunas
        colunas={colunas}
        onAlternar={onAlternarColuna}
        selecionadas={colunasSelecionadas}
      />
      {total !== undefined && (
        <p className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
          {totalFormatter.format(total)} {total === 1 ? 'lead' : 'leads'}
        </p>
      )}
    </div>
  );
}

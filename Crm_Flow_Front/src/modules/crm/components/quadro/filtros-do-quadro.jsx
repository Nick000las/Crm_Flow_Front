/**
 * @file Busca, filtros, views e ordem do quadro: as mesmas peças da lista de leads, e a mesma
 * view vale nas duas telas. O quadro só tem cards ativos, então a `situacao` de uma view não se
 * aplica aqui.
 */
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { SITUACOES_LEAD } from '../../constants';
import { useLayoutEfetivo } from '../../hooks/use-layout';
import { useFaixasScore } from '../../hooks/use-score';
import { chipsDoFiltro, FILTRO_VAZIO } from '../../lib/filtro';
import { placeholderDaBusca } from '../../lib/layout';
import { DIRECAO, opcoesDeOrdem } from '../../lib/quadro-consulta';
import { estadoDaVisao, visaoDoEstado } from '../../lib/url-state';
import { BuscaLeads } from '../busca-leads';
import { ChipsFiltro } from '../chips-filtro';
import { ConstrutorFiltro } from '../construtor-filtro';
import { SelectSimples } from '../select-simples';
import { ViewsMenu } from '../views-menu';

/**
 * Busca, filtros, views e ordem do quadro: as mesmas peças da lista de leads,
 * e a mesma view vale nas duas telas. O quadro só tem cards ativos, então a
 * `situacao` de uma view não se aplica aqui.
 *
 * @param {{
 *   estado: import('../../lib/url-state').EstadoLista,
 *   atualizar: (mudancas: Partial<import('../../lib/url-state').EstadoLista>) => void,
 *   campos: import('../../types').Campo[],
 *   camposDoFiltro: import('../../types').Campo[],
 *   comValor: boolean,
 *   chavesComErro: Set<string>,
 *   usuarios: { id: string, nome: string }[],
 *   nomePorId: Map<string, string>,
 *   ordem: import('../../lib/quadro-consulta').OrdemDoQuadro,
 *   onOrdem: (ordem: import('../../lib/quadro-consulta').OrdemDoQuadro) => void,
 * }} props `campos`: todos os de `/fields`; `camposDoFiltro`: os do construtor
 */
export function FiltrosDoQuadro({
  estado,
  atualizar,
  campos,
  camposDoFiltro,
  comValor,
  chavesComErro,
  usuarios,
  nomePorId,
  ordem,
  onOrdem,
}) {
  const layout = useLayoutEfetivo();
  const faixasScore = useFaixasScore();
  const crescente = ordem.direcao === DIRECAO.ASC;
  const IconeDaDirecao = crescente ? ArrowUpNarrowWide : ArrowDownWideNarrow;

  const chips = chipsDoFiltro(estado.filtro, campos, nomePorId, faixasScore);

  return (
    <section
      aria-label="Busca, filtros e ordenação do pipeline"
      data-tour="crm-pipeline-filters"
      className="space-y-2.5 rounded-xl border border-border bg-card/80 p-3 shadow-xs"
    >
      <div className="flex flex-wrap items-center gap-2">
        <BuscaLeads
          busca={estado.busca}
          onBuscaChange={(busca) => atualizar({ busca })}
          placeholder={placeholderDaBusca(layout?.identificador ?? null)}
        />
        <ConstrutorFiltro
          campos={camposDoFiltro}
          chavesComErro={chavesComErro}
          comValor={comValor}
          filtro={estado.filtro}
          onAplicar={(filtro) => atualizar({ filtro })}
          usuarios={usuarios}
        />
        <ViewsMenu
          onAplicar={(filtros) =>
            atualizar({ ...estadoDaVisao(filtros), situacao: SITUACOES_LEAD.ATIVOS })
          }
          visaoAtual={visaoDoEstado({ ...estado, situacao: SITUACOES_LEAD.ATIVOS })}
        />
        <div className="flex items-center gap-1.5 sm:ml-auto">
          <span className="hidden text-xs font-medium text-muted-foreground xl:inline">
            Ordenar
          </span>
          <SelectSimples
            aria-label="Ordenar por"
            className="w-48"
            onChange={(campo) => campo && onOrdem({ ...ordem, campo })}
            opcoes={opcoesDeOrdem(campos)}
            value={ordem.campo}
          />
          <Button
            aria-label={
              crescente
                ? 'Ordem crescente. Mudar para decrescente'
                : 'Ordem decrescente. Mudar para crescente'
            }
            className="size-9"
            onClick={() => onOrdem({ ...ordem, direcao: crescente ? DIRECAO.DESC : DIRECAO.ASC })}
            size="icon"
            title={crescente ? 'Crescente' : 'Decrescente'}
            type="button"
            variant="outline"
          >
            <IconeDaDirecao className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="border-t border-border/60 pt-2.5">
          <ChipsFiltro
            chavesComErro={chavesComErro}
            chips={chips}
            onLimpar={() => atualizar({ filtro: FILTRO_VAZIO })}
            onRemover={(chip) => atualizar({ filtro: chip.remover() })}
          />
        </div>
      )}
    </section>
  );
}

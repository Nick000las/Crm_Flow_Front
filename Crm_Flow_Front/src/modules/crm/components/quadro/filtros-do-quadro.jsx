import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FILTRO_VAZIO, chipsDoFiltro } from '../../lib/filtro';
import { DIRECAO, opcoesDeOrdem } from '../../lib/quadro-consulta';
import { placeholderDaBusca } from '../../lib/layout';
import { estadoDaVisao, visaoDoEstado } from '../../lib/url-state';
import { SITUACOES_LEAD } from '../../constants';
import { useLayoutEfetivo } from '../../hooks/use-layout';
import { useFaixasScore } from '../../hooks/use-score';
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

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
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
        <div className="flex items-center gap-1 sm:ml-auto">
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
            className="size-9 rounded-none"
            onClick={() => onOrdem({ ...ordem, direcao: crescente ? DIRECAO.DESC : DIRECAO.ASC })}
            size="icon"
            title={crescente ? 'Crescente' : 'Decrescente'}
            type="button"
            variant="outline"
          >
            <IconeDaDirecao aria-hidden="true" />
          </Button>
        </div>
      </div>
      <ChipsFiltro
        chavesComErro={chavesComErro}
        chips={chipsDoFiltro(estado.filtro, campos, nomePorId, faixasScore)}
        onLimpar={() => atualizar({ filtro: FILTRO_VAZIO })}
        onRemover={(chip) => atualizar({ filtro: chip.remover() })}
      />
    </>
  );
}

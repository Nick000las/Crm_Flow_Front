import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { pesquisarLeads } from '../api/leads.api';
import { buscarCards, criarCard, listarColunas, moverCard, resumirColuna } from '../api/quadro.api';
import { porNoTopo, tirarDasPaginas } from '../lib/quadro';
import { crmKeys } from '../query-keys';

const CARDS_POR_PAGINA = 50;
const MINIMO_PARA_BUSCAR = 2;
const PESSOAS_NA_BUSCA = 8;

/**
 * Depois de mover ou criar, só as colunas tocadas: cada coluna custa duas
 * requisições. O resto do prefixo (a tabela, as outras colunas) fica velho e
 * recarrega quando voltar a ser usado.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string} quadroRef
 * @param {string[]} colunas
 */
function recarregarColunas(queryClient, quadroRef, colunas) {
  queryClient.invalidateQueries({ queryKey: crmKeys.leads(), refetchType: 'none' });
  return Promise.all(
    colunas
      .flatMap((coluna) => [
        crmKeys.quadroCards(quadroRef, coluna),
        crmKeys.quadroResumo(quadroRef, coluna),
      ])
      .map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}

/** @param {string} quadroRef */
export function useColunasDoQuadro(quadroRef) {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.quadroColunas(quadroRef),
    queryFn: ({ signal }) => listarColunas(authApi, quadroRef, { signal }),
  });
}

/**
 * Outra consulta é outra key: a primeira página volta sem cursor. Enquanto a
 * nova não chega, a anterior fica na tela, em vez de piscar o skeleton.
 *
 * @param {string} quadroRef
 * @param {string | undefined} colunaRef
 * @param {import('../lib/quadro-consulta').ConsultaDoQuadro | null} consulta `null` = ainda não dá para pedir
 * @param {boolean} [ligada] `false` = a coluna ainda não apareceu
 */
export function useCardsDaColuna(quadroRef, colunaRef, consulta, ligada = true) {
  const { authApi } = useAuth();

  return useInfiniteQuery({
    queryKey: crmKeys.quadroCards(quadroRef, colunaRef, consulta ?? undefined),
    queryFn: ({ pageParam, signal }) =>
      buscarCards(
        authApi,
        quadroRef,
        {
          colunaRef,
          limite: CARDS_POR_PAGINA,
          ...consulta,
          ...(pageParam && { cursor: pageParam }),
        },
        { signal },
      ),
    initialPageParam: undefined,
    getNextPageParam: (ultima) => ultima.proximoCursor ?? undefined,
    enabled: Boolean(consulta && colunaRef) && ligada,
    placeholderData: keepPreviousData,
  });
}

/**
 * @param {string} quadroRef
 * @param {string} colunaRef
 * @param {import('../lib/quadro-consulta').ConsultaDoQuadro | null} consulta
 * @param {boolean} ligada
 */
export function useResumoDaColuna(quadroRef, colunaRef, consulta, ligada) {
  const { authApi } = useAuth();
  const filtros = consulta?.filtros;

  return useQuery({
    queryKey: crmKeys.quadroResumo(quadroRef, colunaRef, filtros),
    queryFn: ({ signal }) =>
      resumirColuna(authApi, quadroRef, { colunaRef, ...(filtros && { filtros }) }, { signal }),
    enabled: Boolean(consulta) && ligada,
    placeholderData: keepPreviousData,
  });
}

/**
 * Otimista: o card muda de coluna ao soltar e volta se o back recusar. Recarrega
 * sempre, porque a resposta não traz o card, e a soma das colunas mudou. Envia
 * o filtro da tela: com `saiuDoFiltro`, o card sai da coluna de destino. Quem
 * conclui o form de obrigatórios manda `versao` (a do que acabou de gravar) e
 * `campos`.
 *
 * @param {string} quadroRef
 * @param {import('../lib/quadro-consulta').ConsultaDoQuadro | null} consulta
 */
export function useMoverCard(quadroRef, consulta) {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();
  const chaveDaColuna = (colunaRef) =>
    crmKeys.quadroCards(quadroRef, colunaRef, consulta ?? undefined);

  return useMutation({
    mutationFn: ({ card, para, versao, campos }) =>
      moverCard(authApi, quadroRef, card.entidadeId, {
        colunaDestino: para,
        expectedUpdatedAt: versao ?? card.atualizadoEm,
        ...(consulta?.filtros && { filtros: consulta.filtros }),
        ...(campos && { campos }),
      }),
    onMutate: async ({ card, de, para }) => {
      const origem = chaveDaColuna(de);
      const destino = chaveDaColuna(para);
      await Promise.all(
        [origem, destino].map((queryKey) => queryClient.cancelQueries({ queryKey })),
      );

      const antes = {
        origem: queryClient.getQueryData(origem),
        destino: queryClient.getQueryData(destino),
      };
      queryClient.setQueryData(origem, (dados) => tirarDasPaginas(dados, card.entidadeId));
      queryClient.setQueryData(destino, (dados) => porNoTopo(dados, card));
      return antes;
    },
    onError: (_erro, { de, para }, antes) => {
      queryClient.setQueryData(chaveDaColuna(de), antes?.origem);
      queryClient.setQueryData(chaveDaColuna(para), antes?.destino);
    },
    onSuccess: ({ saiuDoFiltro }, { card, para }) => {
      if (saiuDoFiltro) {
        queryClient.setQueryData(chaveDaColuna(para), (dados) =>
          tirarDasPaginas(dados, card.entidadeId),
        );
      }
    },
    onSettled: (_resposta, _erro, { card, de, para }) =>
      Promise.all([
        recarregarColunas(queryClient, quadroRef, [de, para]),
        ...[
          crmKeys.lead(card.leadId),
          crmKeys.oportunidades(card.leadId),
          crmKeys.historico(card.leadId),
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]),
  });
}

/** @param {string} quadroRef */
export function useCriarCard(quadroRef) {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (corpo) => criarCard(authApi, quadroRef, corpo),
    onSuccess: (_resposta, { colunaRef }) => recarregarColunas(queryClient, quadroRef, [colunaRef]),
  });
}

/**
 * Busca de pessoas para o "Adicionar" da coluna.
 *
 * @param {string} termo
 */
export function useBuscaDePessoas(termo) {
  const { authApi } = useAuth();
  const busca = termo.trim();

  return useQuery({
    queryKey: crmKeys.leadsSearch({ quadro: true, busca }),
    queryFn: ({ signal }) =>
      pesquisarLeads(
        authApi,
        { busca, paginacao: { pagina: 1, tamanho: PESSOAS_NA_BUSCA } },
        { signal },
      ),
    enabled: busca.length >= MINIMO_PARA_BUSCAR,
    placeholderData: keepPreviousData,
  });
}

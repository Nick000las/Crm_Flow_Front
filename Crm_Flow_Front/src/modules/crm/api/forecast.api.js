/**
 * Tipos do forecast (FC2), a partir de `handoff-front-fc2.md`, seções 2 e 3.
 * As três rotas (`GET /crm/forecast`, `GET /crm/forecast/oportunidades` e
 * `POST /crm/forecast/data-prevista`) ficam atrás da flag `crm.forecast` e
 * são abertas a todos os papéis; o que cada um vê muda pelas permissões.
 * Valores em dinheiro vêm `null` quando o papel não vê Valor (nunca 0).
 */

/**
 * Soma de um conjunto de oportunidades (realizado do mês).
 * @typedef {object} SomaForecast
 * @property {number} quantidade
 * @property {number | null} soma
 */

/**
 * Bloco de oportunidades fora dos meses (atrasadas, sem previsão etc.).
 * @typedef {object} BlocoForecast
 * @property {number} quantidade
 * @property {number | null} soma
 * @property {number | null} ponderado
 */

/**
 * Blocos de `blocos`. `semValor` só tem `quantidade`: sem valor, não há soma.
 * @typedef {object} BlocosForecast
 * @property {BlocoForecast} atrasadas
 * @property {BlocoForecast} antesDoPeriodo
 * @property {BlocoForecast} semPrevisao
 * @property {BlocoForecast} alemDoHorizonte
 * @property {{ quantidade: number }} semValor
 */

/**
 * Um mês de `meses`. Vem mesmo sem dado (zeros).
 * @typedef {object} MesForecast
 * @property {string} mes `AAAA-MM`
 * @property {SomaForecast} realizado
 * @property {SomaForecast} ponderado
 * @property {{ soma: number | null }} melhorCaso
 * @property {number | null} previsto Realizado + ponderado do mês.
 * @property {number} ganhasSemValor Ganhas do mês sem valor (só contagem).
 */

/**
 * Grupo de `grupos` (com `agrupar=responsavel` ou `status`). Só vêm grupos
 * com ao menos uma oportunidade, do maior previsto para o menor.
 * @typedef {object} GrupoForecast
 * @property {string | null} chave Id do usuário, key do status, ou `null` (sem responsável).
 * @property {string} rotulo Nome do usuário, label do status ou "Sem responsável".
 * @property {MesForecast[]} meses
 * @property {BlocosForecast} blocos
 */

/**
 * Resposta de `GET /crm/forecast` (dentro de `data`).
 * @typedef {object} RespostaForecast
 * @property {string} fuso Ex.: `America/Sao_Paulo`.
 * @property {string} hoje `AAAA-MM-DD` no fuso do tenant.
 * @property {{ de: string, ate: string }} periodo Período efetivo, com o padrão aplicado.
 * @property {{ pipelineId: string | null, responsavelId: string | null, agrupar: 'total' | 'responsavel' | 'status' }} filtros
 * @property {boolean} veValor Quando `false`, todo número em dinheiro vem `null`.
 * @property {boolean} veProbabilidade Quando `false`, `probabilidadeEfetiva` some dos itens.
 * @property {string[]} camposDesligados Chaves do forecast que o papel não tem (`dataPrevistaFechamento`, `probabilidadeFechamento`).
 * @property {boolean} vazio Nenhuma oportunidade de vendas ativa nos pipelines do papel (ignora filtros).
 * @property {MesForecast[]} meses
 * @property {BlocosForecast} blocos
 * @property {GrupoForecast[]} grupos `[]` com `agrupar=total`.
 */

/**
 * Query de `GET /crm/forecast`. Todos opcionais.
 * @typedef {object} ParamsForecast
 * @property {string} [de] `AAAA-MM`. Padrão: mês atual menos 3.
 * @property {string} [ate] `AAAA-MM`. Padrão: mês atual mais 3. Máximo de 24 meses.
 * @property {string} [pipelineId] Uuid de um pipeline de vendas visível ao papel.
 * @property {string} [responsavelId] Uuid do usuário responsável.
 * @property {'total' | 'responsavel' | 'status'} [agrupar] `status` exige `pipelineId`.
 */

/**
 * Oportunidade em `itens` de `GET /crm/forecast/oportunidades`. As chaves
 * opcionais somem por papel (seção 3): valor/ponderado por Valor, probabilidade
 * por Probabilidade, data por Data prevista e status/statusLabel/categoria/ganhaEm por Status.
 * @typedef {object} ItemForecast
 * @property {string} id
 * @property {string} leadId
 * @property {string} pessoa
 * @property {string} pipelineId
 * @property {string | null} responsavelId
 * @property {string} atualizadaEm ISO.
 * @property {number | null} [valor] Ausente se o papel não vê Valor; `null` se a oportunidade não tem valor.
 * @property {number | null} [ponderado] Ausente se o papel não vê Valor; `null` sem valor.
 * @property {number | null} [probabilidadeEfetiva] Ausente se o papel não vê Probabilidade.
 * @property {string | null} [dataPrevistaFechamento] `AAAA-MM-DD`. Ausente se o papel não vê a data.
 * @property {string} [status] Ausente se o papel não vê Status.
 * @property {string} [statusLabel] Ausente se o papel não vê Status.
 * @property {string} [categoria] `aberto` ou `ganho`. Ausente se o papel não vê Status.
 * @property {string | null} [ganhaEm] ISO, só em ganhas. Ausente se o papel não vê Status.
 */

/**
 * Query de `GET /crm/forecast/oportunidades`. Informe um entre `mes` e `bloco`.
 * Mande o mesmo `de`/`ate` e filtros do GET principal.
 * @typedef {object} ParamsListaForecast
 * @property {string} [mes] `AAAA-MM`. Exige `tipo`.
 * @property {'realizado' | 'aberto'} [tipo] Obrigatório com `mes`.
 * @property {'atrasadas' | 'antes_do_periodo' | 'sem_previsao' | 'alem_do_horizonte' | 'sem_valor'} [bloco]
 * @property {string} [de] `AAAA-MM`. Só usado em `antes_do_periodo`.
 * @property {string} [ate] `AAAA-MM`. Só usado em `alem_do_horizonte`.
 * @property {string} [pipelineId]
 * @property {string} [responsavelId]
 * @property {number} [pagina] Inteiro, mínimo 1. Padrão 1.
 * @property {number} [tamanho] Inteiro de 1 a 100. Padrão 50.
 */

/**
 * Página de `GET /crm/forecast/oportunidades` (dentro de `data`). Sem cache.
 * @typedef {object} PaginaForecast
 * @property {ItemForecast[]} itens
 * @property {number} total
 * @property {number} pagina
 * @property {number} tamanho
 */

/**
 * Corpo de `POST /crm/forecast/data-prevista`. Corpo estrito: chave a mais dá 400.
 * @typedef {object} CorpoDataPrevista
 * @property {string[]} oportunidadeIds De 1 a 200 uuids, sem repetir.
 * @property {string} dataPrevistaFechamento `AAAA-MM-DD`, obrigatório (não aceita `null`).
 */

/**
 * Resposta 200 de `POST /crm/forecast/data-prevista` (dentro de `data`).
 * Erro inesperado não vem aqui: a chamada inteira dá 500.
 * @typedef {object} ResultadoDataPrevista
 * @property {number} atualizadas
 * @property {{ id: string, motivo: string }[]} ignoradas `motivo` é `NAO_ENCONTRADA`, `NAO_ABERTA`, `RESOURCE_CONFLICT` ou o `code` de outro erro de negócio.
 */

/**
 * Query string sem `undefined`/`null`/`''`; número vira texto. Sem nada a
 * mandar, volta vazia (sem `?`).
 * @param {string} caminho
 * @param {Record<string, string | number | null | undefined>} [params]
 */
export function comQuery(caminho, params = {}) {
  const query = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params ?? {})) {
    if (valor === undefined || valor === null || valor === '') {
      continue;
    }
    query.set(chave, String(valor));
  }
  const texto = query.toString();
  return texto ? `${caminho}?${texto}` : caminho;
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {ParamsForecast} [params]
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<RespostaForecast>}
 */
export function buscarForecast(authApi, params, options) {
  return authApi.get(comQuery('/crm/forecast', params), options);
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {ParamsListaForecast} params
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<PaginaForecast>}
 */
export function listarOportunidadesDoForecast(authApi, params, options) {
  return authApi.get(comQuery('/crm/forecast/oportunidades', params), options);
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {CorpoDataPrevista} corpo
 * @returns {Promise<ResultadoDataPrevista>}
 */
export function atualizarDataPrevista(authApi, corpo) {
  return authApi.post('/crm/forecast/data-prevista', corpo);
}

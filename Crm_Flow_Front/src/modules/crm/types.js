/**
 * Formas de dado do CRM como chegam do back. Leitura de lead vem em
 * snake_case (coluna); form, filtro e payload usam a `chave` camelCase.
 *
 * @typedef {'texto' | 'texto_longo' | 'numero' | 'monetario' | 'data' | 'booleano'
 *   | 'selecao' | 'selecao_multipla' | 'telefone' | 'email' | 'url'} TipoCampo
 *
 * @typedef {'create_form' | 'detail' | 'table' | 'filter'} Contexto
 * @typedef {Record<Contexto, boolean>} Visibilidade
 *
 * @typedef {Object} Campo  Item de `GET /crm/leads/fields`, já ordenado.
 * @property {string} chave        camelCase (Camadas 1/2) ou chave custom (Camada 3)
 * @property {string} [coluna]     snake_case da leitura (Camadas 1/2)
 * @property {string} label
 * @property {TipoCampo} tipo
 * @property {1 | 2 | 3} camada
 * @property {boolean} obrigatorio
 * @property {number} ordem
 * @property {string[] | null} [opcoes]  keys ativas (o que o seletor oferece); `null` em tags
 * @property {Visibilidade} [visibilidade]  em que telas o campo aparece (ver `camposDoContexto`)
 * @property {'status' | 'fonte_lead' | 'motivo_perda' | 'tag'} [lista]  campo de lista do tenant
 * @property {import('./lib/opcoes.js').Opcao[]} [opcoesLista]  todas as opções da lista, com as inativas
 *
 * @typedef {Object} CampoConfigurado  Item de `GET /crm/configuracoes/campos`, já ordenado.
 *   Inclui os ocultos em todos os contextos.
 * @property {string} id
 * @property {string} chave
 * @property {string | null} systemKey   `null` = personalizado
 * @property {1 | 2 | 3} camada
 * @property {string} label
 * @property {string | null} labelPadrao  só campo do sistema; `label: null` no PUT volta a ele
 * @property {TipoCampo} tipo
 * @property {string[] | null} opcoes
 * @property {boolean} obrigatorio
 * @property {number} ordem
 * @property {Visibilidade} visibilidade
 * @property {{ canHide: boolean, canMakeOptional: boolean, canRename: boolean }} capacidades
 *
 * @typedef {Object} Lead  Leitura de lead (snake_case). NUMERIC chega como string.
 * @property {string} id
 * @property {string} nome
 * @property {string | null} email
 * @property {string | null} telefone
 * @property {string | null} status
 * @property {string | null} valor
 * @property {string | null} usuario_responsavel_id
 * @property {Record<string, unknown>} [custom_fields]
 *
 * @typedef {'igual' | 'contem' | 'entre' | 'e_um_dos' | 'vazio' | 'nao_vazio'} Operador
 *
 * @typedef {Object} FiltroCampo
 * @property {string} chave
 * @property {Operador} operador
 * @property {unknown} [valor]
 *
 * @typedef {Object} Filtro  Corpo de `POST /crm/leads/search` (sem paginação).
 * @property {string} [busca]
 * @property {FiltroCampo[]} [filtros]
 * @property {string} [usuarioResponsavelId]
 *
 * @typedef {Object} PaginaLeads
 * @property {Lead[]} itens
 * @property {number} total
 * @property {number} pagina
 * @property {number} tamanho
 *
 * @typedef {Object} FilterView
 * @property {string} id
 * @property {string} nome
 * @property {Filtro} filtro
 *
 * @typedef {Object} ImportJob
 * @property {string} id
 * @property {'pendente' | 'processando' | 'concluido' | 'falhou'} status
 * @property {number} total_linhas
 * @property {number} linhas_processadas
 */

export {};

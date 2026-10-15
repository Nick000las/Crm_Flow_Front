/**
 * Formas de dado do CRM como chegam do back. Leitura de lead vem em
 * snake_case (coluna); form, filtro e payload usam a `chave` camelCase.
 *
 * @typedef {'texto' | 'numero' | 'data' | 'booleano' | 'selecao' | 'selecao_multipla'} TipoCampo
 *
 * @typedef {Object} Campo  Item de `GET /crm/leads/fields`, já ordenado.
 * @property {string} chave        camelCase (Camadas 1/2) ou chave custom (Camada 3)
 * @property {string} [coluna]     snake_case da leitura (Camadas 1/2)
 * @property {string} label
 * @property {TipoCampo} tipo
 * @property {1 | 2 | 3} camada
 * @property {boolean} obrigatorio
 * @property {number} ordem
 * @property {string[] | null} [opcoes]
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

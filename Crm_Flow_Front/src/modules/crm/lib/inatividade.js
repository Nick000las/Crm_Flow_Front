import { CATEGORIAS_STATUS, INATIVIDADE } from '../constants.js';

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const INTEIRO = /^\d+$/;

/**
 * Lead esfriando (flag `crm.inatividade`). Quem decide se o lead esfria é o
 * back (`esfriando_desde`); aqui só a apresentação e a configuração por status.
 *
 * @typedef {{
 *   id: string,
 *   key: string,
 *   label: string,
 *   color: string | null,
 *   category: string,
 *   ativo: boolean,
 *   dias: number | null,
 * }} StatusInatividade  `dias: null` = desligado
 * @typedef {{ ligado: boolean, dias: string }} ValorInatividade  `dias` como digitado
 */

/**
 * O filtro que vai para a busca. Sem a flag, `esfriando` sai (o back daria
 * 403): um link ou view antiga não quebra a lista.
 *
 * @param {import('./filtro.js').FiltroAplicado} filtro
 * @param {boolean} comInatividade
 */
export function filtroDaBusca(filtro, comInatividade) {
  if (comInatividade || !filtro.esfriando) {
    return filtro;
  }

  return Object.fromEntries(Object.entries(filtro).filter(([chave]) => chave !== 'esfriando'));
}

/**
 * Dias inteiros desde que o lead começou a esfriar (para baixo: 30h é 1 dia).
 * `null` sem data válida.
 *
 * @param {string | null | undefined} esfriandoDesde ISO
 * @param {Date} [agora]
 */
export function diasEsfriando(esfriandoDesde, agora = new Date()) {
  const instante = esfriandoDesde ? Date.parse(esfriandoDesde) : Number.NaN;
  if (Number.isNaN(instante)) {
    return null;
  }

  return Math.max(0, Math.floor((agora.getTime() - instante) / MS_POR_DIA));
}

/** "Esfriando há 3 dias" — o selo da tabela e do drawer. Vazio sem data. */
export function textoEsfriando(esfriandoDesde, agora) {
  const dias = diasEsfriando(esfriandoDesde, agora);
  if (dias === null) {
    return '';
  }
  if (dias === 0) {
    return 'Esfriando desde hoje';
  }

  return `Esfriando há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

/** Só status de categoria aberta esfria; ganho e perdido ficam travados. */
export function statusEsfria(status) {
  return status.category === CATEGORIAS_STATUS.ABERTO;
}

/**
 * @param {StatusInatividade[]} lista
 * @returns {Record<string, ValorInatividade>}
 */
export function valoresDaInatividade(lista) {
  return Object.fromEntries(
    lista.map(({ key, dias }) => [
      key,
      { ligado: dias !== null, dias: dias === null ? '' : String(dias) },
    ]),
  );
}

/**
 * Ligar um status sem dias sugere o padrão; desligar guarda o número digitado
 * (religar volta a ele).
 *
 * @param {ValorInatividade} atual
 * @param {boolean} ligado
 * @returns {ValorInatividade}
 */
export function alternarStatus(atual, ligado) {
  return {
    ligado,
    dias: ligado && atual.dias === '' ? String(INATIVIDADE.DIAS_PADRAO) : atual.dias,
  };
}

/** @param {string} texto */
function lerDias(texto) {
  const limpo = texto.trim();
  return INTEIRO.test(limpo) ? Number(limpo) : Number.NaN;
}

/**
 * Erro de UX por status ligado com dias fora de 1–365 (inteiro). O back
 * valida de novo; a mensagem dele (`status.<key>`) prevalece.
 *
 * @param {Record<string, ValorInatividade>} valores
 * @returns {Record<string, string>}
 */
export function errosLocais(valores) {
  return Object.fromEntries(
    Object.entries(valores).flatMap(([key, { ligado, dias }]) => {
      if (!ligado) {
        return [];
      }
      const numero = lerDias(dias);
      const valido = numero >= INATIVIDADE.DIAS_MIN && numero <= INATIVIDADE.DIAS_MAX;

      return valido
        ? []
        : [
            [
              key,
              `Use um número inteiro de ${INATIVIDADE.DIAS_MIN} a ${INATIVIDADE.DIAS_MAX} dias`,
            ],
          ];
    }),
  );
}

/**
 * Corpo do PUT: só os status que mudaram, `null` para desligar. `null` quando
 * nada mudou. Status fechado nunca vai (o back daria 400).
 *
 * @param {Record<string, ValorInatividade>} valores
 * @param {StatusInatividade[]} lista
 * @returns {Record<string, number | null> | null}
 */
export function inatividadeParaEnvio(valores, lista) {
  const mudancas = Object.fromEntries(
    lista.flatMap((status) => {
      const valor = valores[status.key];
      if (!valor || !statusEsfria(status)) {
        return [];
      }

      const dias = valor.ligado ? lerDias(valor.dias) : null;
      return dias === status.dias ? [] : [[status.key, dias]];
    }),
  );

  return Object.keys(mudancas).length > 0 ? mudancas : null;
}

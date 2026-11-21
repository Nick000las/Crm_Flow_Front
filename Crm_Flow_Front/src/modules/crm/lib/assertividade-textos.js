import { FAIXAS_ASSERTIVIDADE } from '../constants.js';

/** Textos da aba Assertividade do forecast (FC3). */
export const TEXTOS_ASSERTIVIDADE = Object.freeze({
  aba: 'Assertividade',
  abaPrevisao: 'Previsão',
  semDados: 'Sem dados ainda',
  todosSemDados:
    'As previsões começam a ser guardadas toda segunda-feira. Volte depois do primeiro mês completo.',
  ajudaSnapshot:
    'O previsto é uma foto do forecast tirada na primeira segunda-feira do mês e não muda depois.',
  ajudaLeitura: 'A assertividade é o realizado dividido pelo previsto.',
  semResponsaveis: 'Nenhum responsável neste mês.',
  escolhaUmMes: 'Clique em um mês para ver por responsável.',
  soMesesFechados: 'Só meses fechados: escolha um mês anterior ao atual',
});

/** Cabeçalhos da tabela por responsável. */
export const COLUNAS_RESPONSAVEL = Object.freeze({
  responsavel: 'Responsável',
  previsto: 'Previsto',
  realizado: 'Realizado',
  assertividade: 'Assertividade',
});

/** Rótulos das séries e da tooltip (nomes dos campos de `MesAssertividade`). */
export const ROTULOS_SERIE_ASSERTIVIDADE = Object.freeze({
  previsto: 'Previsto',
  realizado: 'Realizado',
  realizadoNoSnapshot: 'Realizado na foto',
  ponderadoNoSnapshot: 'Ponderado na foto',
  semana: 'Semana da foto',
  assertividade: 'Assertividade',
});

/** Rótulo de cada faixa de assertividade. */
export const ROTULOS_FAIXA = Object.freeze({
  otimista: 'Otimista',
  boa: 'Dentro do esperado',
  pessimista: 'Pessimista',
});

const porcentagem = (razao) => Math.round(razao * 100);

/** Explicação de cada faixa; os percentuais vêm de `FAIXAS_ASSERTIVIDADE`. */
export const AJUDA_FAIXA = Object.freeze({
  otimista: `Previu mais do que vendeu (abaixo de ${porcentagem(FAIXAS_ASSERTIVIDADE.OTIMISTA_ABAIXO)}%).`,
  boa: `Entre ${porcentagem(FAIXAS_ASSERTIVIDADE.OTIMISTA_ABAIXO)}% e ${porcentagem(FAIXAS_ASSERTIVIDADE.PESSIMISTA_ACIMA)}% do previsto.`,
  pessimista: `Vendeu mais do que previu (acima de ${porcentagem(FAIXAS_ASSERTIVIDADE.PESSIMISTA_ACIMA)}%).`,
});

const MESES = Object.freeze([
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]);

/**
 * 'AAAA-MM' → nome do mês ('outubro'). Entrada inválida volta igual.
 * @param {string} mes
 * @returns {string}
 */
export function rotuloMesSemAno(mes) {
  const m = typeof mes === 'string' ? /^\d{4}-(\d{2})$/.exec(mes) : null;
  if (!m) {
    return mes;
  }
  const indice = Number(m[1]) - 1;
  if (indice < 0 || indice > 11) {
    return mes;
  }
  return MESES[indice];
}

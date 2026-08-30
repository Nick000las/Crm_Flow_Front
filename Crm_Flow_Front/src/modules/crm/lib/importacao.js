import { IMPORTACAO, IMPORT_JOB_STATUS } from '../constants.js';

/**
 * Regras puras do import de planilha: arquivo, mapeamento, relatório,
 * progresso e a máquina de passos do wizard.
 *
 * @typedef {{ chave: string, label: string, tipo: string, obrigatorio: boolean }} CampoPlanilha
 * @typedef {Record<string, string>} Mapeamento  `{ colunaDaPlanilha: chaveDoCampo }`; '' = não importar
 * @typedef {{ linha: number, coluna?: string, motivo: string }} ErroDeLinha
 */

const EXTENSAO = '.xlsx';
const BYTES_POR_MB = 1024 * 1024;
const CHAVES_CONTATO = Object.freeze(['email', 'telefone']);
const PORCENTAGEM = 100;

// ---------------------------------------------------------------------------
// Arquivo

/**
 * Checagem barata antes do upload. O limite de linhas (5.000) só dá para
 * conferir lendo a planilha — o back faz isso no preview.
 *
 * @param {{ name: string, size: number }} arquivo
 * @returns {string | null} motivo da recusa
 */
export function validarArquivo(arquivo) {
  if (!arquivo.name.toLowerCase().endsWith(EXTENSAO)) {
    return 'Envie uma planilha .xlsx';
  }
  if (arquivo.size > IMPORTACAO.TAMANHO_MAXIMO_ARQUIVO_BYTES) {
    return `O arquivo passa de ${IMPORTACAO.TAMANHO_MAXIMO_ARQUIVO_BYTES / BYTES_POR_MB} MB`;
  }
  if (arquivo.size === 0) {
    return 'O arquivo está vazio';
  }

  return null;
}

// ---------------------------------------------------------------------------
// Mapeamento

/** "E-mail do Cliente" → "emaildocliente": compara ignorando acento, caixa e pontuação. */
export function normalizar(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // remove acentos (marcas combinantes)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Pré-seleciona o destino quando o nome da coluna bate com o `label` ou a
 * `chave` do campo. Cada campo é usado uma vez só (o back recusa repetição).
 *
 * @param {string[]} colunas
 * @param {CampoPlanilha[]} campos
 * @returns {Mapeamento}
 */
export function autoMapear(colunas, campos) {
  const usados = new Set();

  return Object.fromEntries(
    colunas.map((coluna) => {
      const alvo = normalizar(coluna);
      const campo = campos.find(
        (candidato) =>
          !usados.has(candidato.chave) &&
          (normalizar(candidato.label) === alvo || normalizar(candidato.chave) === alvo),
      );
      if (campo) {
        usados.add(campo.chave);
      }
      return [coluna, campo?.chave ?? ''];
    }),
  );
}

/** Só o que vai ser importado — colunas com destino. */
export function mapeamentoParaEnvio(mapeamento) {
  return Object.fromEntries(Object.entries(mapeamento).filter(([, chave]) => chave));
}

/**
 * Avisos que espelham `validarMapeamento` do back, para o usuário corrigir
 * antes de gastar uma validação da planilha inteira.
 *
 * @param {Mapeamento} mapeamento
 * @param {CampoPlanilha[]} campos
 * @returns {string[]}
 */
export function problemasDoMapeamento(mapeamento, campos) {
  const destinos = Object.values(mapeamento).filter(Boolean);
  const problemas = [];

  if (destinos.length === 0) {
    problemas.push('Mapeie ao menos uma coluna');
  }

  const repetidos = [
    ...new Set(destinos.filter((chave, indice) => destinos.indexOf(chave) !== indice)),
  ];
  for (const chave of repetidos) {
    const label = campos.find((campo) => campo.chave === chave)?.label ?? chave;
    problemas.push(`"${label}" foi escolhido para mais de uma coluna`);
  }

  for (const campo of campos) {
    if (campo.obrigatorio && !destinos.includes(campo.chave)) {
      problemas.push(`O campo obrigatório "${campo.label}" não foi mapeado`);
    }
  }

  if (!CHAVES_CONTATO.some((chave) => destinos.includes(chave))) {
    problemas.push('Mapeie ao menos a coluna de e-mail ou a de telefone');
  }

  return problemas;
}

// ---------------------------------------------------------------------------
// Relatório e progresso

const SEPARADOR_CSV = ';'; // o Excel em pt-BR abre `;` direto em colunas
const escaparCsv = (valor) => `"${String(valor ?? '').replaceAll('"', '""')}"`;

/** @param {ErroDeLinha[]} erros */
export function relatorioCsv(erros) {
  const cabecalho = ['Linha', 'Coluna', 'Motivo'].map(escaparCsv).join(SEPARADOR_CSV);
  const linhas = erros.map((erro) =>
    [erro.linha, erro.coluna, erro.motivo].map(escaparCsv).join(SEPARADOR_CSV),
  );

  return [cabecalho, ...linhas].join('\r\n');
}

export function emProcessamento(status) {
  return status === IMPORT_JOB_STATUS.PROCESSANDO;
}

/**
 * @param {{ total_linhas?: number, linhas_processadas?: number }} job
 * @returns {number} 0–100
 */
export function percentualConcluido(job) {
  const total = job.total_linhas ?? 0;
  if (total === 0) {
    return 0;
  }

  return Math.min(PORCENTAGEM, Math.round(((job.linhas_processadas ?? 0) / total) * PORCENTAGEM));
}

// ---------------------------------------------------------------------------
// Wizard

export const PASSO = Object.freeze({
  ARQUIVO: 'arquivo',
  MAPEAR: 'mapear',
  REVISAR: 'revisar',
  PROCESSAR: 'processar',
});

export const PASSOS = Object.freeze([
  { id: PASSO.ARQUIVO, rotulo: 'Arquivo' },
  { id: PASSO.MAPEAR, rotulo: 'Mapear' },
  { id: PASSO.REVISAR, rotulo: 'Revisar' },
  { id: PASSO.PROCESSAR, rotulo: 'Processar' },
]);

export const ESTRATEGIA_PADRAO = 'pular';

/** @param {string | null} [jobId] retomar o acompanhamento de um job da URL */
export function estadoInicial(jobId = null) {
  return {
    passo: jobId ? PASSO.PROCESSAR : PASSO.ARQUIVO,
    arquivo: null,
    preview: null,
    mapeamento: {},
    estrategia: ESTRATEGIA_PADRAO,
    // LGPD (`crm.lgpd`): base legal das linhas que não trazem a sua ('' = nenhuma).
    baseLegalLote: '',
    validacao: null,
    jobId,
  };
}

/**
 * Máquina de passos explícita: cada ação só vale no passo certo, então não
 * dá para chegar em "Revisar" sem planilha nem em "Processar" sem job.
 */
export function wizardReducer(estado, acao) {
  switch (acao.tipo) {
    case 'arquivoLido':
      return {
        ...estadoInicial(),
        passo: PASSO.MAPEAR,
        arquivo: acao.arquivo,
        preview: acao.preview,
        mapeamento: autoMapear(acao.preview.colunas, acao.preview.campos),
      };
    case 'mapear':
      return {
        ...estado,
        mapeamento: { ...estado.mapeamento, [acao.coluna]: acao.chave },
        validacao: null,
      };
    case 'estrategia':
      return { ...estado, estrategia: acao.estrategia, validacao: null };
    case 'baseLegalLote':
      return { ...estado, baseLegalLote: acao.baseLegalLote, validacao: null };
    case 'validado':
      return estado.passo === PASSO.MAPEAR
        ? { ...estado, passo: PASSO.REVISAR, validacao: acao.validacao }
        : estado;
    case 'confirmado':
      return estado.validacao?.jobId
        ? { ...estado, passo: PASSO.PROCESSAR, jobId: estado.validacao.jobId }
        : estado;
    case 'voltar':
      return estado.passo === PASSO.REVISAR
        ? { ...estado, passo: PASSO.MAPEAR, validacao: null }
        : estado;
    case 'reiniciar':
      return estadoInicial();
    default:
      return estado;
  }
}

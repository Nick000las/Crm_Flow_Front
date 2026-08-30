import { formatarCep, formatarData, formatarEndereco, formatarTelefone } from './formatadores.js';
import { MENSAGEM_SEM_PERMISSAO } from '../constants.js';
import { idNoForm, paraValorDeApi, paraValorDeForm, podeEditarCampo } from './form-lead.js';
import { textoDoValor } from './layout.js';

/**
 * Enriquecimento por CNPJ (`crm.cnpj`): a lupa sugere valores para o form e a
 * configuração diz para que campo vai cada dado da Receita. Puro.
 *
 * @typedef {import('../api/cnpj.api.js').SugestaoCnpj} SugestaoCnpj
 * @typedef {import('../api/cnpj.api.js').ConfigCnpj} ConfigCnpj
 * @typedef {{
 *   campoReceita: string,
 *   id: string,
 *   label: string,
 *   texto: string,
 *   valorDeForm: unknown,
 *   disponivel: boolean,
 *   motivo: string | null,
 *   substitui: boolean,
 *   marcadaPorPadrao: boolean,
 * }} ItemSugestao
 */

const TAMANHO_CNPJ = 14;

export const MENSAGENS_CNPJ = Object.freeze({
  NAO_ENCONTRADO: 'CNPJ não encontrado na Receita.',
  NAO_SUPORTADO: 'Consulta indisponível para este formato de CNPJ (alfanumérico). Preencha à mão.',
  SEM_SUGESTAO: 'Nenhum campo do lead está configurado para receber estes dados.',
  CONFIGURAR_MAIS: 'Para preencher mais campos automaticamente, configure em',
  INDISPONIVEL: 'A consulta à Receita está indisponível agora.',
  FORA_DO_FORM: 'Campo fora deste formulário',
});

/** Só consulta com o documento inteiro (14 caracteres sem máscara). */
export function cnpjCompleto(valor) {
  return String(valor ?? '').replace(/[^0-9A-Za-z]/g, '').length === TAMANHO_CNPJ;
}

const iguais = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Situação cadastral que não precisa de destaque. */
const SITUACAO_REGULAR = 'ATIVA';

/** Dados da Receita que chegam crus (só dígitos ou ISO) e ganham formato. */
const FORMATO_DO_DADO = Object.freeze({
  cep: formatarCep,
  telefone: formatarTelefone,
  dataAbertura: formatarData,
});

/** Dado "endereço completo" e as partes que ele junta numa linha só. */
const DADO_ENDERECO = 'endereco';
const PARTES_DO_ENDERECO = Object.freeze([
  'logradouro',
  'numero',
  'complemento',
  'bairro',
  'municipio',
  'uf',
  'cep',
]);

/** As partes soltas da Receita viram uma linha ("Rua X, 10 - Centro, São Paulo/SP, 01311-902"). */
function enderecoEmLinha(dados) {
  return formatarEndereco({
    logradouro: dados.logradouro,
    numero: dados.numero,
    complemento: dados.complemento,
    bairro: dados.bairro,
    cidade: dados.municipio,
    uf: dados.uf,
    cep: dados.cep,
  });
}

/**
 * O que a Receita devolveu e não está entre as sugestões, só para leitura —
 * o usuário vê o resultado mesmo sem campo para recebê-lo. Ordem e rótulo de
 * `camposReceita`; ausentes saem. O endereço aparece numa linha só (no lugar
 * de "Endereço completo"), e sai inteiro quando ele já é uma sugestão.
 *
 * @param {Record<string, unknown> | null | undefined} dados
 * @param {{ chave: string, label: string }[]} camposReceita
 * @param {Set<string>} [sugeridos]  `campoReceita` que já estão nas sugestões
 * @returns {{ chave: string, label: string, texto: string }[]}
 */
export function dadosParaLeitura(dados, camposReceita, sugeridos = new Set()) {
  if (!dados) {
    return [];
  }

  return camposReceita.flatMap(({ chave, label }) => {
    if (sugeridos.has(chave) || PARTES_DO_ENDERECO.includes(chave)) {
      return [];
    }
    if (chave === DADO_ENDERECO) {
      const texto = enderecoEmLinha(dados);
      return texto ? [{ chave, label, texto }] : [];
    }

    const valor = dados[chave];
    if (valor === undefined || valor === null || valor === '' || typeof valor === 'object') {
      return [];
    }
    const formatar = FORMATO_DO_DADO[chave];
    return [{ chave, label, texto: (formatar && formatar(valor)) || String(valor) }];
  });
}

/**
 * Situação cadastral fora do normal ("BAIXADA", "SUSPENSA", "INAPTA"…), em
 * maiúsculas, para o selo; `null` quando ATIVA ou ausente.
 *
 * @param {Record<string, unknown> | null | undefined} dados
 */
export function situacaoDestacada(dados) {
  const situacao = typeof dados?.situacao === 'string' ? dados.situacao.trim().toUpperCase() : '';
  return situacao && situacao !== SITUACAO_REGULAR ? situacao : null;
}

/**
 * Sugestões da Receita prontas para o painel: o valor no formato do controle
 * e se vem marcada. Marcada por padrão quando o campo está vazio ou já tem o
 * mesmo valor; com outro valor, o usuário decide substituir. Campo que não
 * está no form (oculto na criação, por exemplo) ou só de ver (permissão por
 * campo) aparece, mas não se aplica — `motivo` diz por quê.
 *
 * @param {SugestaoCnpj[]} sugestao
 * @param {import('../types.js').Campo[]} campos  campos do form
 * @param {Record<string, unknown>} valores
 * @returns {ItemSugestao[]}
 */
export function itensDaSugestao(sugestao, campos, valores) {
  return sugestao.map((item) => {
    const campo = campos.find(
      (atual) => atual.chave === item.chave && atual.camada === item.camada,
    );
    const id = idNoForm({ chave: item.chave, camada: item.camada });
    // Sem o campo no form, o `tipo` do destino (vem na sugestão) ainda formata o valor.
    const texto = textoDoValor(campo ?? { tipo: item.tipo }, item.valor) ?? String(item.valor);

    if (!campo || !podeEditarCampo(campo)) {
      return {
        campoReceita: item.campoReceita,
        id,
        label: campo?.label ?? item.label,
        texto,
        valorDeForm: null,
        disponivel: false,
        motivo: campo ? MENSAGEM_SEM_PERMISSAO : MENSAGENS_CNPJ.FORA_DO_FORM,
        substitui: false,
        marcadaPorPadrao: false,
      };
    }

    const valorDeForm = paraValorDeForm(campo.tipo, item.valor);
    const atual = paraValorDeApi(campo.tipo, valores[id]);
    const sugerido = paraValorDeApi(campo.tipo, valorDeForm);
    const vazio = atual === null;
    const mesmo = iguais(atual, sugerido);

    return {
      campoReceita: item.campoReceita,
      id,
      label: campo.label,
      texto,
      valorDeForm,
      disponivel: true,
      motivo: null,
      substitui: !vazio && !mesmo,
      marcadaPorPadrao: vazio || mesmo,
    };
  });
}

/**
 * Põe os itens marcados nos valores do form. Nada é salvo: o usuário revisa
 * e salva o lead.
 *
 * @param {Record<string, unknown>} valores
 * @param {ItemSugestao[]} itens
 * @param {Set<string>} marcados  ids no form
 */
export function aplicarSugestoes(valores, itens, marcados) {
  const proximos = { ...valores };
  for (const item of itens) {
    if (item.disponivel && marcados.has(item.id)) {
      proximos[item.id] = item.valorDeForm;
    }
  }
  return proximos;
}

// ---------------------------------------------------------------------------
// Configuração

/**
 * Campos que aceitam o dado da Receita (`tipos` do back), na ordem do tenant.
 *
 * @param {{ tipos: string[] }} dadoReceita
 * @param {import('../types.js').CampoConfigurado[]} campos
 */
export function camposCompativeis(dadoReceita, campos) {
  return campos.filter((campo) => dadoReceita.tipos.includes(campo.tipo));
}

/** @param {ConfigCnpj} config */
export function valoresDaConfig({ ativo, modo, sobrescrever, mapeamento }) {
  return { ativo, modo, sobrescrever, mapeamento: { ...mapeamento } };
}

/**
 * Corpo do PUT (a configuração inteira). Dado sem destino sai do mapeamento;
 * as chaves vão em ordem, para comparar com o salvo sem falso "mudou".
 *
 * @param {ReturnType<typeof valoresDaConfig>} valores
 */
export function configParaEnvio({ ativo, modo, sobrescrever, mapeamento }) {
  return {
    ativo,
    modo,
    sobrescrever,
    mapeamento: Object.fromEntries(
      Object.entries(mapeamento)
        .filter(([, idDoCampo]) => Boolean(idDoCampo))
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
}

/** Algo mudou em relação ao salvo? @param {ReturnType<typeof valoresDaConfig>} valores @param {ConfigCnpj} config */
export function configMudou(valores, config) {
  return !iguais(configParaEnvio(valores), configParaEnvio(valoresDaConfig(config)));
}

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  LIMITES_ALERTA,
  MENSAGENS_ALERTA,
  NIVEIS_ALERTA,
  OPCOES_NIVEL,
  alertaNovo,
  alertasDoForm,
  alertasParaApi,
  alvoDaChave,
  alvosDaVersao,
  alvosDoRascunho,
  chaveDoAlvo,
  descreverAlerta,
  rotuloDoNivel,
  validarAlertas,
} from './alertas-formulario.js';
import {
  MENSAGENS_FORMULARIO,
  POLITICAS,
  dadosDoForm,
  errosDoFormulario,
  rascunhoDoForm,
  rascunhoParaApi,
  removerItem,
  validarNoCliente,
} from './formularios.js';

const ALERGIAS = {
  id: 'c1',
  chave: 'alergias',
  label: 'Alergias',
  tipo: 'texto',
  opcoes: null,
  opcoesLista: null,
};
const PLANO = {
  id: 'c2',
  chave: 'plano',
  label: 'Plano',
  tipo: 'selecao',
  opcoes: null,
  opcoesLista: [
    { key: 'ouro', label: 'Ouro', color: null, category: null, ativo: true },
    { key: 'prata', label: 'Prata', color: null, category: null, ativo: true },
  ],
};
const CAMPOS = [ALERGIAS, PLANO];
const itemDeCampo = (campoId) => ({
  campoId,
  obrigatorio: false,
  politica: POLITICAS.SOBRESCREVER,
  preencher: false,
});
const FUMA = {
  pergunta: {
    id: 'p1',
    rotulo: 'Fuma?',
    ajuda: null,
    tipo: 'booleano',
    opcoes: null,
    sensivel: false,
  },
  obrigatorio: false,
};
const ALERTAS = [
  {
    id: 'a1',
    alvo: { campoId: 'c1' },
    operador: 'contem',
    valor: 'dipirona',
    nivel: 'critical',
    texto: 'Alergia a dipirona',
  },
  {
    id: 'a2',
    alvo: { perguntaId: 'p1' },
    operador: 'igual',
    valor: true,
    nivel: 'warning',
    texto: 'Fumante',
  },
  {
    id: 'a3',
    alvo: { campoId: 'c2' },
    operador: 'e_um_dos',
    valor: ['ouro'],
    nivel: 'info',
    texto: 'Cliente ouro',
  },
];
const DA_API = {
  secoes: [{ titulo: null, itens: [itemDeCampo('c1'), FUMA, itemDeCampo('c2')] }],
  introducao: null,
  termo: 'Aceito',
  alertas: ALERTAS,
};
const FORMULARIO = {
  nome: 'Anamnese',
  descricao: null,
  validadeDias: 7,
  ativo: true,
};

test('níveis: rótulos e do mais grave para o mais leve no select', () => {
  assert.deepEqual(
    OPCOES_NIVEL.map((opcao) => opcao.valor),
    ['critical', 'warning', 'info'],
  );
  assert.equal(rotuloDoNivel(NIVEIS_ALERTA.CRITICO), 'Crítico');
  assert.equal(rotuloDoNivel('outro'), 'outro');
});

test('chave do alvo vai e volta', () => {
  assert.equal(chaveDoAlvo({ campoId: 'c1' }), 'campo:c1');
  assert.equal(chaveDoAlvo({ perguntaId: 'p1' }), 'pergunta:p1');
  assert.deepEqual(alvoDaChave('campo:c1'), { campoId: 'c1' });
  assert.deepEqual(alvoDaChave('pergunta:p1'), { perguntaId: 'p1' });
  assert.equal(alvoDaChave('nova-3'), null);
});

test('alvos: campos do schema e perguntas já salvas', () => {
  const rascunho = rascunhoDoForm(DA_API, CAMPOS);
  const comNova = {
    ...rascunho,
    secoes: [
      {
        ...rascunho.secoes[0],
        itens: [
          ...rascunho.secoes[0].itens,
          {
            chaveLocal: 'nova-9',
            obrigatorio: false,
            pergunta: { ...FUMA.pergunta, id: undefined },
          },
          { chaveLocal: 'campo:sumiu', ...itemDeCampo('sumiu') },
        ],
      },
    ],
  };

  assert.deepEqual(
    alvosDoRascunho(comNova, CAMPOS).map((alvo) => [alvo.id, alvo.label]),
    [
      ['campo:c1', 'Alergias'],
      ['pergunta:p1', 'Fuma?'],
      ['campo:c2', 'Plano'],
    ],
  );
});

test('alertas vão e voltam pelo PUT, com o id e o valor no formato da API', () => {
  const rascunho = rascunhoDoForm(DA_API, CAMPOS);

  assert.equal(rascunho.alertas[1].condicao.valor, 'true');
  assert.deepEqual(rascunhoParaApi(rascunho, CAMPOS).alertas, ALERTAS);
});

test('sem alertas na API, o form começa sem nenhum', () => {
  assert.deepEqual(rascunhoDoForm({ ...DA_API, alertas: undefined }, CAMPOS).alertas, []);
});

test('alerta novo começa sem alvo, em Atenção, e não vai sem id', () => {
  const novo = alertaNovo(4);
  const alvos = alvosDoRascunho(rascunhoDoForm(DA_API, CAMPOS), CAMPOS);
  const preenchido = {
    ...novo,
    condicao: { campoId: 'campo:c1', operador: 'nao_vazio', valor: null },
    texto: '  Tem alergia ',
  };

  assert.equal(novo.chaveLocal, 'alerta-novo-4');
  assert.equal(novo.nivel, 'warning');
  assert.deepEqual(alertasParaApi([preenchido], alvos), [
    {
      alvo: { campoId: 'c1' },
      operador: 'nao_vazio',
      nivel: 'warning',
      texto: 'Tem alergia',
    },
  ]);
});

test('validarAlertas: alvo, operador do tipo, valor, texto e limite', () => {
  const rascunho = rascunhoDoForm(DA_API, CAMPOS);
  const alvos = alvosDoRascunho(rascunho, CAMPOS);
  const [alergia, fumante] = rascunho.alertas;
  const alertas = [
    { ...alertaNovo(1), texto: 'x' },
    { ...alergia, condicao: { ...alergia.condicao, campoId: 'campo:sumiu' } },
    // "contém" não vale para booleano (a pergunta mudou de tipo depois).
    { ...fumante, condicao: { ...fumante.condicao, operador: 'contem' } },
    { ...alergia, chaveLocal: 'sem-valor', condicao: { ...alergia.condicao, valor: ' ' } },
    { ...alergia, chaveLocal: 'texto', texto: 'x'.repeat(LIMITES_ALERTA.TEXTO + 1) },
    { ...alergia, chaveLocal: 'vazio', texto: '  ' },
  ];

  const { porAlerta, geral } = validarAlertas(alertas, alvos);

  assert.deepEqual(porAlerta, {
    'alerta-novo-1': { campo: MENSAGENS_ALERTA.ALVO },
    'alerta:a1': { campo: MENSAGENS_ALERTA.ALVO_SAIU },
    'alerta:a2': { operador: MENSAGENS_ALERTA.OPERADOR },
    'sem-valor': { valor: 'Informe um valor' },
    texto: { texto: MENSAGENS_ALERTA.TEXTO_LONGO },
    vazio: { texto: MENSAGENS_ALERTA.TEXTO },
  });
  assert.equal(geral, MENSAGENS_ALERTA.REVISE);
  assert.deepEqual(validarAlertas(rascunho.alertas, alvos), { porAlerta: {}, geral: null });

  const demais = Array.from({ length: LIMITES_ALERTA.POR_FORMULARIO + 1 }, (_, indice) => ({
    ...alergia,
    chaveLocal: `a-${indice}`,
  }));
  assert.equal(validarAlertas(demais, alvos).geral, MENSAGENS_ALERTA.LIMITE);
});

test('validarNoCliente: tirar o alvo do formulário marca o alerta', () => {
  const rascunho = removerItem(rascunhoDoForm(DA_API, CAMPOS), 'campo:c1');
  const elegiveis = CAMPOS.map((campo) => ({ ...campo, camada: 3, sensivel: false }));
  const resultado = validarNoCliente(dadosDoForm(FORMULARIO), rascunho, elegiveis, CAMPOS);

  assert.deepEqual(resultado.porAlerta, { 'alerta:a1': { campo: MENSAGENS_ALERTA.ALVO_SAIU } });
  assert.equal(resultado.geral, MENSAGENS_ALERTA.REVISE);
  assert.notEqual(resultado.geral, MENSAGENS_FORMULARIO.REVISE_ITENS);
});

test('errosDoFormulario leva o erro do alerta ao alerta, pelo índice enviado', () => {
  const enviado = rascunhoDoForm(DA_API, CAMPOS);
  const erros = errosDoFormulario(
    {
      'rascunho.alertas.0.alvo': ['O alvo não está no rascunho'],
      'rascunho.alertas.1.operador': ['Operador não vale para o tipo'],
      'rascunho.alertas.2.id': ['Alerta repetido'],
      'rascunho.alertas.9.texto': ['Sem alerta'],
      'rascunho.alertas': ['No máximo 30 alertas'],
    },
    enviado,
  );

  assert.deepEqual(erros.porAlerta, {
    'alerta:a1': { campo: 'O alvo não está no rascunho' },
    'alerta:a2': { operador: 'Operador não vale para o tipo' },
    'alerta:a3': { texto: 'Alerta repetido' },
  });
  assert.equal(erros.alertas, 'No máximo 30 alertas');
  assert.deepEqual(erros.outros, ['Sem alerta']);
});

test('descreverAlerta: a condição em frase, com o nome da opção', () => {
  const versao = {
    secoes: [
      {
        itens: [
          { campoId: 'c1', campo: { label: 'Alergias', tipo: 'texto', opcoes: null } },
          { pergunta: FUMA.pergunta },
          { campoId: 'c2', campo: { label: 'Plano', tipo: 'selecao', opcoes: null } },
        ],
      },
    ],
  };
  const alvos = alvosDaVersao(versao, CAMPOS);

  assert.equal(descreverAlerta(ALERTAS[0], alvos), 'Alergias contém dipirona');
  assert.equal(descreverAlerta(ALERTAS[1], alvos), 'Fuma? é Sim');
  assert.equal(descreverAlerta(ALERTAS[2], alvos), 'Plano é um de Ouro');
  assert.equal(
    descreverAlerta({ ...ALERTAS[0], alvo: { campoId: 'outro' } }, alvos),
    'Item removido',
  );
});

test('alertasDoForm guarda o alvo desconhecido como veio', () => {
  const [alerta] = alertasDoForm(
    [{ alvo: { campoId: 'zz' }, operador: 'igual', valor: 'x', nivel: 'info', texto: 'T' }],
    [],
  );

  assert.equal(alerta.chaveLocal, 'alerta-importado-0');
  assert.deepEqual(alerta.condicao, { campoId: 'campo:zz', operador: 'igual', valor: 'x' });
});

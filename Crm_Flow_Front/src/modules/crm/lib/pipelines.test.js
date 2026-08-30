import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  comStatusReordenados,
  motivoNaoDesativa,
  motivoNaoExclui,
  origensDaAutomacao,
  payloadDaAutomacao,
  pipelinesAtivos,
  resumoDaAutomacao,
  statusAbertos,
  statusDisponiveis,
  statusDoPipeline,
  valoresDaAutomacao,
} from './pipelines.js';

const AUTOMACAO_VAZIA = {
  ativa: false,
  origemId: null,
  statusInicial: null,
  regraDoDono: 'none',
  donoId: null,
};

const VENDAS = {
  id: 'v',
  nome: 'Vendas',
  tipo: 'sales',
  padrao: true,
  ativo: true,
  oportunidades: 3,
  automacao: AUTOMACAO_VAZIA,
  status: [
    { id: 's1', key: 'novo', label: 'Novo', category: 'aberto', ativo: true },
    { id: 's2', key: 'antigo', label: 'Antigo', category: 'aberto', ativo: false },
    { id: 's3', key: 'ganho', label: 'Ganho', category: 'ganho', ativo: true },
  ],
};
const ATENDIMENTO = {
  id: 'a',
  nome: 'Atendimento',
  tipo: 'service',
  padrao: false,
  ativo: true,
  oportunidades: 0,
  automacao: {
    ativa: true,
    origemId: 'v',
    statusInicial: 'novo',
    regraDoDono: 'specific_user',
    donoId: 'u1',
  },
  status: [{ id: 's9', key: 'novo', label: 'Na fila', category: 'aberto', ativo: true }],
};
const INATIVO = {
  ...VENDAS,
  id: 'i',
  nome: 'Antigas',
  padrao: false,
  ativo: false,
  oportunidades: 0,
};
const PIPELINES = [VENDAS, ATENDIMENTO, INATIVO];

test('statusDoPipeline separa a mesma key em pipelines diferentes', () => {
  assert.equal(statusDoPipeline(PIPELINES, 'v', 'novo').label, 'Novo');
  assert.equal(statusDoPipeline(PIPELINES, 'a', 'novo').label, 'Na fila');
  assert.equal(statusDoPipeline(PIPELINES, 'a', 'ganho'), null);
  assert.equal(statusDoPipeline(PIPELINES, 'sumiu', 'novo'), null);
});

test('statusAbertos traz só os abertos ativos', () => {
  assert.deepEqual(statusAbertos(VENDAS), [{ valor: 'novo', rotulo: 'Novo' }]);
  assert.deepEqual(statusAbertos(undefined), []);
});

test('statusDisponiveis mantém o atual desativado', () => {
  const keys = (atual) => statusDisponiveis(VENDAS, atual).map((item) => item.valor);

  assert.deepEqual(keys('novo'), ['novo', 'ganho']);
  assert.deepEqual(keys('antigo'), ['novo', 'antigo', 'ganho']);
});

test('seletores de pipeline ignoram os inativos', () => {
  assert.deepEqual(
    pipelinesAtivos(PIPELINES).map((item) => item.valor),
    ['v', 'a'],
  );

  assert.deepEqual(origensDaAutomacao(PIPELINES), [{ valor: 'v', rotulo: 'Vendas' }]);
});

test('automação vai e volta do form, e o dono só vale com usuário específico', () => {
  const valores = valoresDaAutomacao(AUTOMACAO_VAZIA);

  assert.deepEqual(valores, {
    ativa: false,
    origemId: '',
    statusInicial: '',
    regraDoDono: 'none',
    donoId: '',
  });

  assert.deepEqual(payloadDaAutomacao(valores), AUTOMACAO_VAZIA);

  assert.equal(
    payloadDaAutomacao({ ...valores, regraDoDono: 'person_owner', donoId: 'u1' }).donoId,
    null,
  );

  assert.equal(
    payloadDaAutomacao({ ...valores, regraDoDono: 'specific_user', donoId: 'u1' }).donoId,
    'u1',
  );
});

test('resumoDaAutomacao descreve o que acontece', () => {
  const nomes = new Map([['u1', 'Ana']]);

  assert.equal(resumoDaAutomacao(VENDAS, PIPELINES, nomes), 'Desligada.');

  assert.equal(
    resumoDaAutomacao(ATENDIMENTO, PIPELINES, nomes),
    'Venda ganha em Vendas cria um card em Na fila. Responsável: Ana.',
  );

  assert.match(resumoDaAutomacao(ATENDIMENTO, PIPELINES, new Map()), /Usuário removido/);
});

test('o padrão não desativa nem exclui', () => {
  assert.match(motivoNaoDesativa(VENDAS), /padrão/);
  assert.equal(motivoNaoDesativa(ATENDIMENTO), null);
  assert.match(motivoNaoExclui(VENDAS, PIPELINES), /padrão/);
});

test('não exclui com oportunidades nem se outro pipeline nasce dele', () => {
  assert.match(motivoNaoExclui({ ...INATIVO, oportunidades: 1 }, PIPELINES), /oportunidades/);
  assert.equal(motivoNaoExclui(ATENDIMENTO, PIPELINES), null);

  const origem = { ...INATIVO, id: 'v2' };
  const dependente = { ...ATENDIMENTO, automacao: { ...ATENDIMENTO.automacao, origemId: 'v2' } };

  assert.match(motivoNaoExclui(origem, [origem, dependente]), /nasce/);
});

test('comStatusReordenados só mexe no pipeline certo', () => {
  const [vendas, atendimento] = comStatusReordenados(PIPELINES, 'v', ['s3', 's1', 's2']);

  assert.deepEqual(
    vendas.status.map((status) => status.id),
    ['s3', 's1', 's2'],
  );

  assert.equal(atendimento, ATENDIMENTO);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MENSAGENS } from './form-lead.js';
import {
  acessoAosDados,
  campoDoMotivo,
  errosDoDialog,
  payloadDaCriacao,
  payloadDaEdicao,
  payloadDoStatus,
  pedeMotivo,
  pedeProbabilidadeNoStatus,
  podeAlterar,
  podeMudarStatus,
  validarOportunidade,
  valoresDaOportunidade,
  versaoDoConflito,
} from './oportunidades.js';

const CAMPOS = [
  { chave: 'status', camada: 1 },
  { chave: 'valor', camada: 2 },
  { chave: 'motivoPerda', camada: 2 },
  { chave: 'probabilidadeFechamento', camada: 2 },
  { chave: 'dataPrevistaFechamento', camada: 2 },
];
const SO_VER = CAMPOS.map((campo) => ({ ...campo, acesso: 'view' }));

const OPORTUNIDADE = {
  id: 'o1',
  pipelineId: 'p1',
  titulo: 'Reforma',
  status: 'proposta',
  valor: 1500,
  probabilidadeFechamento: 40,
  dataPrevistaFechamento: '2026-12-20T00:00:00.000Z',
  responsavelId: 'u1',
  atualizadaEm: '2026-11-06T12:00:00.000Z',
};

test('sem o campo em /fields, o dado some; o responsável não depende disso', () => {
  const acesso = acessoAosDados([{ chave: 'status', camada: 1 }]);

  assert.deepEqual(acesso.probabilidadeFechamento, { visivel: false, editavel: false });
  assert.deepEqual(acesso.responsavelId, { visivel: true, editavel: true });
  assert.deepEqual(acesso.valor, { visivel: false, editavel: false });
});

test('campo só de ver aparece e não edita', () => {
  const acesso = acessoAosDados(SO_VER);

  assert.deepEqual(acesso.dataPrevistaFechamento, { visivel: true, editavel: false });
  assert.equal(podeMudarStatus(SO_VER), false);
  assert.equal(podeMudarStatus(CAMPOS), true);
  assert.equal(podeMudarStatus([]), false);
});

test('personalizado com a mesma chave não conta como o campo do sistema', () => {
  assert.equal(podeMudarStatus([{ chave: 'status', camada: 3 }]), false);
  assert.equal(campoDoMotivo([{ chave: 'motivoPerda', camada: 3 }]), null);
});

test('valoresDaOportunidade converte para o form', () => {
  assert.deepEqual(valoresDaOportunidade(OPORTUNIDADE), {
    pipelineId: 'p1',
    status: 'proposta',
    titulo: 'Reforma',
    valor: '1500',
    probabilidadeFechamento: '40',
    dataPrevistaFechamento: '2026-12-20',
    responsavelId: 'u1',
  });
});

test('na criação, os padrões preenchem pipeline e responsável', () => {
  const valores = valoresDaOportunidade(null, { pipelineId: 'p1', responsavelId: 'u1' });

  assert.equal(valores.pipelineId, 'p1');
  assert.equal(valores.responsavelId, 'u1');
  assert.equal(valores.status, '');
  assert.equal(valores.valor, '');
});

test('oportunidade sem responsável não herda o padrão', () => {
  const valores = valoresDaOportunidade(
    { ...OPORTUNIDADE, responsavelId: null },
    { responsavelId: 'u1' },
  );

  assert.equal(valores.responsavelId, '');
});

test('validarOportunidade segue os limites do back', () => {
  const valores = valoresDaOportunidade(OPORTUNIDADE);

  assert.deepEqual(validarOportunidade(valores), {});

  assert.deepEqual(validarOportunidade({ ...valores, valor: '-1' }), {
    valor: MENSAGENS.VALOR_NEGATIVO,
  });

  assert.deepEqual(validarOportunidade({ ...valores, valor: 'abc' }), {
    valor: MENSAGENS.NUMERO_INVALIDO,
  });

  for (const probabilidade of ['101', '-1', '10,5']) {
    assert.deepEqual(validarOportunidade({ ...valores, probabilidadeFechamento: probabilidade }), {
      probabilidadeFechamento: MENSAGENS.PROBABILIDADE_INVALIDA,
    });
  }

  assert.deepEqual(validarOportunidade({ ...valores, probabilidadeFechamento: '' }), {});
});

test('payloadDaCriacao leva só o preenchido', () => {
  const valores = { ...valoresDaOportunidade(null, { pipelineId: 'p1' }), valor: '1.500,50' };

  assert.deepEqual(payloadDaCriacao(valores, CAMPOS), { pipelineId: 'p1', valor: 1500.5 });
});

test('payloadDaCriacao não manda campo só de ver', () => {
  const valores = {
    ...valoresDaOportunidade(null),
    probabilidadeFechamento: '40',
    titulo: 'Loja',
  };

  assert.deepEqual(payloadDaCriacao(valores, SO_VER), { titulo: 'Loja' });
});

test('payloadDaEdicao é o diff, com a versão lida', () => {
  const valores = { ...valoresDaOportunidade(OPORTUNIDADE), valor: '', titulo: 'Loja' };

  assert.deepEqual(payloadDaEdicao(OPORTUNIDADE, valores, CAMPOS), {
    titulo: 'Loja',
    valor: null,
    expectedUpdatedAt: OPORTUNIDADE.atualizadaEm,
  });
});

test('payloadDaEdicao é null sem mudança', () => {
  const valores = valoresDaOportunidade(OPORTUNIDADE);

  assert.equal(payloadDaEdicao(OPORTUNIDADE, valores, CAMPOS), null);
});

test('payloadDaEdicao ignora dado que o papel não vê', () => {
  const semProbabilidade = { ...OPORTUNIDADE, probabilidadeFechamento: undefined };
  const valores = valoresDaOportunidade(semProbabilidade);

  assert.equal(payloadDaEdicao(semProbabilidade, valores, [CAMPOS[0]]), null);
});

test('payloadDoStatus só leva o motivo em status perdido', () => {
  const versao = { expectedUpdatedAt: OPORTUNIDADE.atualizadaEm };

  assert.deepEqual(
    payloadDoStatus(OPORTUNIDADE, { status: 'perdido', motivoPerda: 'preco' }, 'perdido'),
    { status: 'perdido', motivoPerda: 'preco', ...versao },
  );

  assert.deepEqual(
    payloadDoStatus(OPORTUNIDADE, { status: 'ganho', motivoPerda: 'preco' }, 'ganho'),
    { status: 'ganho', ...versao },
  );

  assert.deepEqual(
    payloadDoStatus(OPORTUNIDADE, { status: 'perdido', motivoPerda: '' }, 'perdido'),
    {
      status: 'perdido',
      ...versao,
    },
  );
});

test('payloadDoStatus leva a probabilidade escolhida só em status aberto', () => {
  const versao = { expectedUpdatedAt: OPORTUNIDADE.atualizadaEm };
  const valores = { status: 'proposta', motivoPerda: '', probabilidadeFechamento: '35' };

  assert.deepEqual(payloadDoStatus(OPORTUNIDADE, valores, 'aberto'), {
    status: 'proposta',
    probabilidadeFechamento: 35,
    ...versao,
  });

  // Vazia = volta à do status: não vai.
  assert.deepEqual(
    payloadDoStatus(OPORTUNIDADE, { ...valores, probabilidadeFechamento: '' }, 'aberto'),
    { status: 'proposta', ...versao },
  );

  assert.deepEqual(payloadDoStatus(OPORTUNIDADE, { ...valores, status: 'ganho' }, 'ganho'), {
    status: 'ganho',
    ...versao,
  });

  assert.equal(pedeProbabilidadeNoStatus('aberto'), true);
  assert.equal(pedeProbabilidadeNoStatus('perdido'), false);
});

test('pedeMotivo vale para toda categoria perdido', () => {
  assert.equal(pedeMotivo('perdido'), true);
  assert.equal(pedeMotivo('ganho'), false);
  assert.equal(pedeMotivo(null), false);
});

test('podeAlterar trava arquivada e lead anonimizado', () => {
  assert.equal(podeAlterar(OPORTUNIDADE, {}), true);
  assert.equal(podeAlterar({ ...OPORTUNIDADE, arquivadaEm: '2026-11-01' }, {}), false);
  assert.equal(podeAlterar(OPORTUNIDADE, { anonimizado_em: '2026-11-01' }), false);
});

test('versaoDoConflito lê o estado atual do erro', () => {
  assert.equal(versaoDoConflito({ details: { atual: OPORTUNIDADE } }), OPORTUNIDADE);
  assert.equal(versaoDoConflito({ details: {} }), null);
  assert.equal(versaoDoConflito(null), null);
});

test('errosDoDialog separa o que tem campo do que não tem', () => {
  const erro = {
    fields: { motivoPerda: ['Informe o motivo'], empresa: ['Empresa é obrigatória'], vazio: [] },
  };

  assert.deepEqual(errosDoDialog(erro, ['status', 'motivoPerda']), {
    porCampo: { motivoPerda: 'Informe o motivo' },
    outros: ['Empresa é obrigatória'],
  });

  assert.deepEqual(errosDoDialog(null, []), { porCampo: {}, outros: [] });
});

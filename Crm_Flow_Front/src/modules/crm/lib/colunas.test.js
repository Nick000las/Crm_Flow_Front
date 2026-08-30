import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  COLUNAS_PADRAO,
  lerValorDaColuna,
  lerValorDoCampo,
  montarColunas,
  sanearSelecao,
} from './colunas.js';

const campos = [
  { chave: 'nome', coluna: 'nome', label: 'Nome', tipo: 'texto', camada: 1, ordem: 0 },
  { chave: 'email', coluna: 'email', label: 'E-mail', tipo: 'texto', camada: 1, ordem: 1 },
  { chave: 'telefone', coluna: 'telefone', label: 'Telefone', tipo: 'texto', camada: 1, ordem: 2 },
  {
    chave: 'fonteLead',
    coluna: 'fonte_lead',
    label: 'Origem',
    tipo: 'selecao',
    camada: 1,
    ordem: 3,
  },
  { chave: 'status', coluna: 'status', label: 'Status', tipo: 'selecao', camada: 1, ordem: 4 },
  { chave: 'renda', label: 'Renda', tipo: 'numero', camada: 3, ordem: 10 },
  { chave: 'valor', coluna: 'valor', label: 'Valor', tipo: 'monetario', camada: 2, ordem: 11 },
];

const lead = {
  id: 'l1',
  nome: 'Ana',
  fonte_lead: 'indicacao',
  valor: '1500.00',
  usuario_responsavel_id: 'u1',
  custom_fields: { renda: 3000 },
};

test('lerValorDoCampo lê Camadas 1/2 pela coluna e Camada 3 em custom_fields', () => {
  assert.equal(lerValorDoCampo(lead, campos[3]), 'indicacao');
  assert.equal(lerValorDoCampo(lead, campos[5]), 3000);
  assert.equal(lerValorDoCampo({ id: 'x' }, campos[5]), undefined);
});

test('montarColunas acrescenta Responsável e Criado em', () => {
  const ids = montarColunas(campos).map((coluna) => coluna.id);

  assert.deepEqual(ids.slice(campos.length - 1, campos.length + 2), [
    'valor',
    'responsavel',
    'criadoEm',
  ]);
});

test('lerValorDaColuna resolve colunas especiais', () => {
  const colunas = montarColunas(campos);
  const porId = (id) => colunas.find((coluna) => coluna.id === id);

  assert.equal(lerValorDaColuna(lead, porId('valor')), '1500.00');
  assert.equal(lerValorDaColuna(lead, porId('responsavel')), 'u1');
  assert.equal(lerValorDaColuna(lead, porId('nome')), 'Ana');
});

test('sanearSelecao descarta colunas inexistentes e cai no padrão', () => {
  const colunas = montarColunas(campos);

  assert.deepEqual(sanearSelecao(['renda', 'sumiu'], colunas), ['renda']);
  assert.deepEqual(sanearSelecao(['sumiu'], colunas), [...COLUNAS_PADRAO]);
  assert.deepEqual(sanearSelecao('lixo', colunas), [...COLUNAS_PADRAO]);
});

test('sem escolha do usuário, o padrão do layout vale no lugar do fixo', () => {
  const colunas = montarColunas(campos);

  assert.deepEqual(sanearSelecao(null, colunas, ['criadoEm', 'email']), ['criadoEm', 'email']);
  assert.deepEqual(sanearSelecao(['email'], colunas, ['criadoEm']), ['email']);
});

test('colunas do ciclo de vida (FC4) vêm depois das de sistema, na ordem da tela', () => {
  const ids = montarColunas(campos).map((coluna) => coluna.id);

  assert.deepEqual(ids.slice(-6), [
    'responsavel',
    'criadoEm',
    'cicloDeVida',
    'clienteDesde',
    'ultimaCompra',
    'oportunidadesAbertas',
  ]);

  assert.equal(COLUNAS_PADRAO.includes('cicloDeVida'), false);
});

test('sem dataConversao, as colunas de data não existem e saem da seleção', () => {
  const colunas = montarColunas(campos, { comDataConversao: false });
  const ids = colunas.map((coluna) => coluna.id);

  assert.deepEqual(ids.slice(-2), ['cicloDeVida', 'oportunidadesAbertas']);
  assert.equal(ids.includes('clienteDesde'), false);
  assert.equal(ids.includes('ultimaCompra'), false);

  assert.deepEqual(sanearSelecao(['clienteDesde', 'ultimaCompra', 'cicloDeVida'], colunas), [
    'cicloDeVida',
  ]);
});

test('lerValorDaColuna do ciclo: o lead no Ciclo; o resto cru, sem virar 0 nem "Lead"', () => {
  const colunas = montarColunas(campos);
  const porId = (id) => colunas.find((coluna) => coluna.id === id);
  const cliente = {
    id: 'l2',
    ciclo_de_vida: 'cliente',
    cliente_desde: '2026-03-10T14:00:00.000Z',
    ultima_compra: '2026-10-02T17:20:00.000Z',
    oportunidades_abertas: 0,
  };

  assert.equal(lerValorDaColuna(cliente, porId('cicloDeVida')), cliente);
  assert.equal(lerValorDaColuna(cliente, porId('clienteDesde')), '2026-03-10T14:00:00.000Z');
  assert.equal(lerValorDaColuna(cliente, porId('ultimaCompra')), '2026-10-02T17:20:00.000Z');
  assert.equal(lerValorDaColuna(cliente, porId('oportunidadesAbertas')), 0);

  const semNada = { id: 'l3' };

  assert.equal(lerValorDaColuna(semNada, porId('clienteDesde')), undefined);
  assert.equal(lerValorDaColuna(semNada, porId('ultimaCompra')), undefined);
  assert.equal(lerValorDaColuna(semNada, porId('oportunidadesAbertas')), undefined);
  assert.equal(lerValorDaColuna({ cliente_desde: null }, porId('clienteDesde')), null);
});

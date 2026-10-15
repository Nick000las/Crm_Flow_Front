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
  { chave: 'fonteLead', coluna: 'fonte_lead', label: 'Origem', tipo: 'selecao', camada: 1, ordem: 3 },
  { chave: 'status', coluna: 'status', label: 'Status', tipo: 'selecao', camada: 1, ordem: 4 },
  { chave: 'renda', label: 'Renda', tipo: 'numero', camada: 3, ordem: 10 },
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

test('montarColunas acrescenta Valor e Responsável', () => {
  const ids = montarColunas(campos).map((coluna) => coluna.id);

  assert.deepEqual(ids.slice(-2), ['valor', 'responsavel']);
  assert.equal(ids.length, campos.length + 2);
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

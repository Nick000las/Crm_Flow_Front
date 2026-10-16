import assert from 'node:assert/strict';
import { test } from 'node:test';
import { camposDoContexto } from './contextos.js';

const visivel = (overrides) => ({
  create_form: true,
  detail: true,
  table: true,
  filter: true,
  ...overrides,
});

const campos = [
  { chave: 'nome', visibilidade: visivel() },
  { chave: 'empresa', visibilidade: visivel({ table: false }) },
  { chave: 'cargo', visibilidade: visivel({ create_form: false, filter: false }) },
];

test('cada tela recebe só os campos visíveis nela, na mesma ordem', () => {
  const chaves = (contexto) => camposDoContexto(campos, contexto).map((campo) => campo.chave);

  assert.deepEqual(chaves('table'), ['nome', 'cargo']);
  assert.deepEqual(chaves('filter'), ['nome', 'empresa']);
  assert.deepEqual(chaves('create_form'), ['nome', 'empresa']);
  assert.deepEqual(chaves('detail'), ['nome', 'empresa', 'cargo']);
});

test('campo sem visibilidade (back antigo) aparece em todas as telas', () => {
  assert.equal(camposDoContexto([{ chave: 'nome' }], 'table').length, 1);
});

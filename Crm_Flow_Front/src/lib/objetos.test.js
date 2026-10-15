import assert from 'node:assert/strict';
import { test } from 'node:test';
import { semChave } from './objetos.js';

test('remove a chave sem alterar o original', () => {
  const original = { a: 1, b: 2 };

  assert.deepEqual(semChave(original, 'a'), { b: 2 });
  assert.deepEqual(original, { a: 1, b: 2 });
});

test('chave ausente devolve o mesmo objeto', () => {
  const original = { a: 1 };

  assert.equal(semChave(original, 'x'), original);
});

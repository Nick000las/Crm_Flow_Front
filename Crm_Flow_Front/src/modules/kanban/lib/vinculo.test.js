import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FLAG_VINCULO, contatoDaPessoa, podeVincular } from './vinculo.js';

const usuario = { role: 'OPERADOR', modulosAtivos: ['crm'], featuresAtivas: [FLAG_VINCULO] };

test('podeVincular pede a flag, o CRM e editar o quadro', () => {
  assert.equal(podeVincular(usuario, true), true);
  assert.equal(podeVincular(usuario, false), false);
  assert.equal(podeVincular({ ...usuario, featuresAtivas: [] }, true), false);
  assert.equal(podeVincular({ ...usuario, modulosAtivos: ['kanban'] }, true), false);
  assert.equal(podeVincular(null, true), false);
});

test('contatoDaPessoa junta o que existe', () => {
  assert.equal(contatoDaPessoa({ email: 'a@b.c', telefone: '(11) 9' }), 'a@b.c · (11) 9');
  assert.equal(contatoDaPessoa({ email: null, telefone: '(11) 9' }), '(11) 9');
  assert.equal(contatoDaPessoa({}), '');
});

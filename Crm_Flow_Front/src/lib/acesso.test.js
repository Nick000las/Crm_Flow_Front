import assert from 'node:assert/strict';
import { test } from 'node:test';
import { podeVer } from './acesso.js';

const dono = { role: 'DONO', modulosAtivos: ['crm'] };
const operador = { role: 'OPERADOR', modulosAtivos: ['crm'] };

test('sem usuário, nada é visível', () => {
  assert.equal(podeVer({}, null), false);
});

test('entrada sem restrição é visível a qualquer usuário', () => {
  assert.equal(podeVer({}, operador), true);
});

test('restringe por papel', () => {
  const gestao = { roles: ['DONO', 'MASTER'] };

  assert.equal(podeVer(gestao, dono), true);
  assert.equal(podeVer(gestao, operador), false);
});

test('esconde módulo não contratado', () => {
  assert.equal(podeVer({ moduleKey: 'crm' }, dono), true);
  assert.equal(podeVer({ moduleKey: 'agenda' }, dono), false);
});

test('sem modulosAtivos na sessão, o filtro por módulo é permissivo', () => {
  assert.equal(podeVer({ moduleKey: 'crm' }, { role: 'DONO' }), true);
});

test('módulo e papel precisam passar juntos', () => {
  const entry = { moduleKey: 'crm', roles: ['DONO'] };

  assert.equal(podeVer(entry, dono), true);
  assert.equal(podeVer(entry, { ...dono, modulosAtivos: [] }), false);
  assert.equal(podeVer(entry, operador), false);
});

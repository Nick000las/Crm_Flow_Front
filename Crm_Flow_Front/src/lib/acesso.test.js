import assert from 'node:assert/strict';
import { test } from 'node:test';
import { podeVer, temFeature } from './acesso.js';

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

test('temFeature: só a flag ligada na sessão', () => {
  const user = { ...dono, featuresAtivas: ['crm.listas'] };

  assert.equal(temFeature(user, 'crm.listas'), true);
  assert.equal(temFeature(user, 'crm.layout'), false);
});

test('temFeature: sem featuresAtivas na sessão, a flag conta como desligada', () => {
  assert.equal(temFeature(dono, 'crm.listas'), false);
  assert.equal(temFeature(null, 'crm.listas'), false);
});

test('item de menu atrás de flag some com a flag desligada', () => {
  const item = { moduleKey: 'crm', feature: 'crm.layout', roles: ['DONO'] };

  assert.equal(podeVer(item, { ...dono, featuresAtivas: ['crm.layout'] }), true);
  assert.equal(podeVer(item, { ...dono, featuresAtivas: [] }), false);
  assert.equal(podeVer(item, dono), false);
  assert.equal(
    podeVer(item, { ...operador, featuresAtivas: ['crm.layout'] }),
    false,
  );
});

test('feature em lista exige todas as flags ligadas', () => {
  const item = { feature: ['crm.layout', 'crm.listas'] };

  assert.equal(podeVer(item, { ...dono, featuresAtivas: ['crm.layout', 'crm.listas'] }), true);
  assert.equal(podeVer(item, { ...dono, featuresAtivas: ['crm.layout'] }), false);
});

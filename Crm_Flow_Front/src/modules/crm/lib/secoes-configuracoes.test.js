import assert from 'node:assert/strict';
import { test } from 'node:test';
import { caminhoDaSecao, secoesVisiveis } from './secoes-configuracoes.js';

const dono = { role: 'DONO', modulosAtivos: ['crm'], featuresAtivas: [] };

test('sem flag nenhuma, Campos aparece (é a única pronta)', () => {
  assert.deepEqual(
    secoesVisiveis(dono).map((secao) => secao.key),
    ['campos'],
  );
});

test('Listas aparece só com crm.listas, na ordem da spec', () => {
  assert.equal(secoesVisiveis(dono).some((secao) => secao.key === 'listas'), false);
  assert.deepEqual(
    secoesVisiveis({ ...dono, featuresAtivas: ['crm.listas'] }).map((secao) => secao.key),
    ['campos', 'listas'],
  );
});

test('subseção ainda sem tela fica oculta mesmo com a flag dela ligada', () => {
  const comDuplicidade = { ...dono, featuresAtivas: ['crm.duplicidade'] };

  assert.equal(secoesVisiveis(comDuplicidade).some((secao) => secao.key === 'duplicidade'), false);
});

test('OPERADOR vê só o Layout, e só com crm.layout', () => {
  const operador = { ...dono, role: 'OPERADOR' };

  assert.deepEqual(secoesVisiveis(operador), []);
  assert.deepEqual(
    secoesVisiveis({ ...operador, featuresAtivas: ['crm.layout', 'crm.listas'] }).map((secao) => secao.key),
    ['layout'],
  );
});

test('com crm.layout, o DONO vê Layout antes de Campos (ordem da spec)', () => {
  assert.deepEqual(
    secoesVisiveis({ ...dono, featuresAtivas: ['crm.layout'] }).map((secao) => secao.key),
    ['layout', 'campos'],
  );
});

test('caminho da subseção', () => {
  assert.equal(caminhoDaSecao('campos'), '/crm/configuracoes/campos');
});

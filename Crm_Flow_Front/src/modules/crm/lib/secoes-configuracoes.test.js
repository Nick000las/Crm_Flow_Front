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
  const comLayout = { ...dono, featuresAtivas: ['crm.layout'] };

  assert.equal(secoesVisiveis(comLayout).some((secao) => secao.key === 'layout'), false);
});

test('OPERADOR não vê a área', () => {
  assert.deepEqual(secoesVisiveis({ ...dono, role: 'OPERADOR' }), []);
});

test('caminho da subseção', () => {
  assert.equal(caminhoDaSecao('campos'), '/crm/configuracoes/campos');
});

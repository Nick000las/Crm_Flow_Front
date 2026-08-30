import assert from 'node:assert/strict';
import { test } from 'node:test';

import { caminhoDaSecao, secoesVisiveis } from './secoes-configuracoes.js';

const chaves = (user) => secoesVisiveis(user).map((secao) => secao.key);

const dono = { role: 'DONO', modulosAtivos: ['crm'], featuresAtivas: [] };

test('sem flag nenhuma, aparecem Campos e Pipelines', () => {
  assert.deepEqual(
    secoesVisiveis(dono).map((secao) => secao.key),
    ['campos', 'pipelines'],
  );
});

test('Listas aparece só com crm.listas, na ordem da spec', () => {
  assert.equal(
    secoesVisiveis(dono).some((secao) => secao.key === 'listas'),
    false,
  );

  assert.deepEqual(
    secoesVisiveis({ ...dono, featuresAtivas: ['crm.listas'] }).map((secao) => secao.key),
    ['campos', 'listas', 'pipelines'],
  );

  assert.deepEqual(
    secoesVisiveis({ ...dono, featuresAtivas: ['crm.listas', 'crm.regras'] }).map(
      (secao) => secao.key,
    ),
    ['campos', 'listas', 'pipelines', 'regras'],
  );
});

test('OPERADOR vê Pipelines e, só com crm.layout, o Layout', () => {
  const operador = { ...dono, role: 'OPERADOR' };

  assert.deepEqual(chaves(operador), ['pipelines']);

  assert.deepEqual(
    secoesVisiveis({ ...operador, featuresAtivas: ['crm.layout', 'crm.listas'] }).map(
      (secao) => secao.key,
    ),
    ['layout', 'pipelines'],
  );

  // Regras de campo são de gestão: o OPERADOR não vê (o form dele aplica as regras).
  assert.deepEqual(chaves({ ...operador, featuresAtivas: ['crm.regras'] }), ['pipelines']);

  // Duplicidade: o OPERADOR lê as regras (só gestão altera).
  assert.deepEqual(
    secoesVisiveis({ ...operador, featuresAtivas: ['crm.duplicidade'] }).map((secao) => secao.key),
    ['pipelines', 'duplicidade'],
  );
});

test('com crm.layout, o DONO vê Layout antes de Campos (ordem da spec)', () => {
  assert.deepEqual(
    secoesVisiveis({ ...dono, featuresAtivas: ['crm.layout'] }).map((secao) => secao.key),
    ['layout', 'campos', 'pipelines'],
  );
});

test('caminho da subseção', () => {
  assert.equal(caminhoDaSecao('campos'), '/crm/configuracoes/campos');
});

test('Inatividade aparece com crm.inatividade, para gestão e OPERADOR', () => {
  assert.equal(
    secoesVisiveis(dono).some((secao) => secao.key === 'inatividade'),
    false,
  );

  assert.deepEqual(
    secoesVisiveis({ ...dono, featuresAtivas: ['crm.inatividade'] }).map((secao) => secao.key),
    ['campos', 'pipelines', 'inatividade'],
  );

  assert.deepEqual(
    secoesVisiveis({ ...dono, role: 'OPERADOR', featuresAtivas: ['crm.inatividade'] }).map(
      (secao) => secao.key,
    ),
    ['pipelines', 'inatividade'],
  );
});

test('Enriquecimento aparece com crm.cnpj; o OPERADOR também vê (só leitura)', () => {
  assert.deepEqual(
    secoesVisiveis({ ...dono, featuresAtivas: ['crm.cnpj'] }).map((secao) => secao.key),
    ['campos', 'pipelines', 'enriquecimento'],
  );

  assert.deepEqual(
    secoesVisiveis({ ...dono, role: 'OPERADOR', featuresAtivas: ['crm.cnpj'] }).map(
      (secao) => secao.key,
    ),
    ['pipelines', 'enriquecimento'],
  );
});

test('Distribuição aparece com crm.distribuicao; o OPERADOR também vê (só leitura)', () => {
  assert.deepEqual(
    secoesVisiveis({ ...dono, featuresAtivas: ['crm.distribuicao'] }).map((secao) => secao.key),
    ['campos', 'pipelines', 'distribuicao'],
  );

  assert.deepEqual(
    secoesVisiveis({ ...dono, role: 'OPERADOR', featuresAtivas: ['crm.distribuicao'] }).map(
      (secao) => secao.key,
    ),
    ['pipelines', 'distribuicao'],
  );
});

test('Permissões por campo aparece com crm.permissoes, só para gestão', () => {
  assert.deepEqual(
    secoesVisiveis({ ...dono, featuresAtivas: ['crm.permissoes'] }).map((secao) => secao.key),
    ['campos', 'pipelines', 'permissoes'],
  );

  assert.deepEqual(chaves({ ...dono, role: 'OPERADOR', featuresAtivas: ['crm.permissoes'] }), [
    'pipelines',
  ]);
});

test('Pontuação aparece com crm.score; o OPERADOR também vê (só leitura)', () => {
  assert.deepEqual(
    secoesVisiveis({ ...dono, featuresAtivas: ['crm.score'] }).map((secao) => secao.key),
    ['campos', 'pipelines', 'pontuacao'],
  );

  assert.deepEqual(
    secoesVisiveis({ ...dono, role: 'OPERADOR', featuresAtivas: ['crm.score'] }).map(
      (secao) => secao.key,
    ),
    ['pipelines', 'pontuacao'],
  );
});

test('Privacidade aparece com crm.lgpd; o OPERADOR também vê (só leitura)', () => {
  assert.deepEqual(
    secoesVisiveis({ ...dono, featuresAtivas: ['crm.lgpd'] }).map((secao) => secao.key),
    ['campos', 'pipelines', 'privacidade'],
  );

  assert.deepEqual(
    secoesVisiveis({ ...dono, role: 'OPERADOR', featuresAtivas: ['crm.lgpd'] }).map(
      (secao) => secao.key,
    ),
    ['pipelines', 'privacidade'],
  );
});

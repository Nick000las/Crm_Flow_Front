import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MENSAGENS_PERMISSOES,
  errosDasPermissoes,
  permissoesMudaram,
  permissoesParaEnvio,
  validarPermissoes,
  valoresDasPermissoes,
} from './permissoes.js';

const CONFIG = {
  papeis: ['OPERADOR'],
  campos: [
    {
      id: 'c-nome',
      chave: 'nome',
      label: 'Nome',
      camada: 1,
      podeRestringir: false,
      acessos: { OPERADOR: 'edit' },
    },
    {
      id: 'c-email',
      chave: 'email',
      label: 'E-mail',
      camada: 1,
      podeRestringir: true,
      acessos: { OPERADOR: 'edit' },
    },
    {
      id: 'c-tel',
      chave: 'telefone',
      label: 'Telefone',
      camada: 1,
      podeRestringir: true,
      acessos: { OPERADOR: 'view' },
    },
    {
      id: 'c-renda',
      chave: 'renda',
      label: 'Renda',
      camada: 3,
      podeRestringir: true,
      acessos: { OPERADOR: 'hidden' },
    },
  ],
};

test('ida e volta: o PUT leva o mapa inteiro do papel', () => {
  const valores = valoresDasPermissoes(CONFIG);

  assert.deepEqual(permissoesParaEnvio(valores), {
    OPERADOR: { 'c-email': 'edit', 'c-nome': 'edit', 'c-renda': 'hidden', 'c-tel': 'view' },
  });
  assert.equal(permissoesMudaram(valores, CONFIG), false);
  assert.equal(
    permissoesMudaram({ OPERADOR: { ...valores.OPERADOR, 'c-renda': 'view' } }, CONFIG),
    true,
  );
});

test('e-mail e telefone restritos juntos dão erro no papel', () => {
  const valores = valoresDasPermissoes(CONFIG);

  assert.deepEqual(validarPermissoes(valores, CONFIG), {});
  assert.deepEqual(
    validarPermissoes({ OPERADOR: { ...valores.OPERADOR, 'c-email': 'hidden' } }, CONFIG),
    {
      OPERADOR: MENSAGENS_PERMISSOES.CONTATO,
    },
  );
});

test('400 do PUT: erro do campo vai para a linha, do papel para o alerta', () => {
  assert.deepEqual(
    errosDasPermissoes(
      {
        'OPERADOR.c-nome': ['"Nome" é sempre editável'],
        OPERADOR: ['Deixe e-mail ou telefone editável'],
        outro: ['?'],
      },
      ['OPERADOR'],
    ),
    {
      porCampo: { 'c-nome': { OPERADOR: '"Nome" é sempre editável' } },
      porPapel: { OPERADOR: 'Deixe e-mail ou telefone editável' },
      outros: ['?'],
    },
  );
});
